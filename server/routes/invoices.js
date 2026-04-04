const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');

// Helper: log status change
async function logStatus(invoiceId, from, to, note) {
  await db('invoice_status_history').insert({ invoice_id: invoiceId, from_status: from, to_status: to, note: note || null });
}

// Helper: calculate totals
function calcTotals(lineItems, taxRate, discountAmount, discountType) {
  const subtotal = (lineItems || []).reduce((s, li) => s + ((li.quantity || 1) * (li.unit_price || 0)), 0);
  let discount = 0;
  if (discountType === 'percent' && discountAmount) discount = subtotal * (discountAmount / 100);
  else if (discountAmount) discount = discountAmount;
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(afterDiscount * (taxRate || 0) * 100) / 100;
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, discount: Math.round(discount * 100) / 100, taxAmount, total };
}

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { status, search, project_id } = req.query;
    let query = db('invoices').where('invoices.user_id', req.user.id)
      .leftJoin('contractor_jobs', 'invoices.job_id', 'contractor_jobs.id')
      .select('invoices.*', 'contractor_jobs.title as project_title');
    if (status) query = query.where('invoices.status', status);
    if (project_id) query = query.where('invoices.job_id', project_id);
    if (search) {
      query = query.where(function () {
        this.where('invoices.customer_name', 'like', `%${search}%`)
          .orWhere('invoices.invoice_number', 'like', `%${search}%`);
      });
    }
    const invoices = await query.orderBy('invoices.created_at', 'desc');
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/invoices/next-number
router.get('/next-number', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await db('invoices').where('user_id', req.user.id)
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('invoice_number', 'desc').first();
    let next = 1;
    if (last) {
      const num = parseInt(last.invoice_number.replace(prefix, ''));
      if (!isNaN(num)) next = num + 1;
    }
    res.json({ invoice_number: `${prefix}${String(next).padStart(3, '0')}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/invoices/stats
router.get('/stats', async (req, res) => {
  try {
    const byStatus = await db('invoices').where('user_id', req.user.id)
      .select('status').count('* as count').sum('total as total').groupBy('status');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [{ monthlyRevenue }] = await db('invoices').where('user_id', req.user.id)
      .where('status', 'paid').where('paid_at', '>=', monthStart).sum('total as monthlyRevenue');
    res.json({ byStatus, monthlyRevenue: monthlyRevenue || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    if (['next-number', 'stats'].includes(req.params.id)) return;
    const invoice = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const line_items = await db('invoice_line_items').where('invoice_id', invoice.id).orderBy('sort_order');
    const history = await db('invoice_status_history').where('invoice_id', invoice.id).orderBy('created_at', 'desc');
    res.json({ ...invoice, line_items, status_history: history });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { line_items, ...data } = req.body;
    const { subtotal, discount, taxAmount, total } = calcTotals(line_items, data.tax_rate, data.discount_amount, data.discount_type);

    const [id] = await db('invoices').insert({
      ...data, user_id: req.user.id, subtotal, tax_amount: taxAmount, total,
    });

    if (line_items?.length > 0) {
      await db('invoice_line_items').insert(
        line_items.map((li, i) => ({
          invoice_id: id, service: li.service, description: li.description,
          quantity: li.quantity || 1, unit_price: li.unit_price,
          amount: Math.round((li.quantity || 1) * li.unit_price * 100) / 100, sort_order: i,
        }))
      );
    }

    await logStatus(id, null, 'draft', 'Invoice created');
    const invoice = await db('invoices').where('id', id).first();
    const items = await db('invoice_line_items').where('invoice_id', id).orderBy('sort_order');
    res.status(201).json({ ...invoice, line_items: items });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const { line_items, status_history, ...data } = req.body;
    if (line_items) {
      const { subtotal, discount, taxAmount, total } = calcTotals(line_items, data.tax_rate ?? existing.tax_rate, data.discount_amount ?? existing.discount_amount, data.discount_type ?? existing.discount_type);
      data.subtotal = subtotal;
      data.tax_amount = taxAmount;
      data.total = total;

      await db('invoice_line_items').where('invoice_id', req.params.id).del();
      await db('invoice_line_items').insert(
        line_items.map((li, i) => ({
          invoice_id: parseInt(req.params.id), service: li.service, description: li.description,
          quantity: li.quantity || 1, unit_price: li.unit_price,
          amount: Math.round((li.quantity || 1) * li.unit_price * 100) / 100, sort_order: i,
        }))
      );
    }

    await db('invoices').where('id', req.params.id).update({ ...data, updated_at: new Date().toISOString() });
    const invoice = await db('invoices').where('id', req.params.id).first();
    const items = await db('invoice_line_items').where('invoice_id', req.params.id).orderBy('sort_order');
    res.json({ ...invoice, line_items: items });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/invoices/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const oldStatus = invoice.status;
    await db('invoices').where('id', req.params.id).update({
      status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    await logStatus(req.params.id, oldStatus, 'sent', 'Invoice sent to client');

    // Send email if client has email
    if (invoice.customer_email) {
      try {
        const { sendTemplatedEmail } = require('../services/emailService');
        const user = await db('users').where('id', req.user.id).first();
        await sendTemplatedEmail('invoice_sent', {
          customer_name: invoice.customer_name || 'there',
          invoice_number: invoice.invoice_number,
          total: invoice.total?.toLocaleString() || '0.00',
          due_date: invoice.due_date || 'Upon receipt',
          payment_terms: invoice.payment_terms || '',
          company_name: user.company_name || 'HomeSync',
          phone: user.phone || '',
        }, { to_email: invoice.customer_email, to_name: invoice.customer_name });
      } catch { /* email sending is best-effort */ }
    }

    res.json(await db('invoices').where('id', req.params.id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/invoices/:id/mark-paid
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const { payment_method, payment_date } = req.body || {};
    const oldStatus = invoice.status;
    await db('invoices').where('id', req.params.id).update({
      status: 'paid', amount_paid: invoice.total,
      paid_at: payment_date || new Date().toISOString(),
      payment_method: payment_method || null,
      updated_at: new Date().toISOString(),
    });
    await logStatus(req.params.id, oldStatus, 'paid', `Payment received${payment_method ? ` via ${payment_method}` : ''}`);

    // Notify contractor (useful when payment comes through portal/Stripe webhook later)
    try {
      const { notifyInvoicePaid } = require('../services/notificationService');
      await notifyInvoicePaid({
        contractorUserId: req.user.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name || 'A client',
        total: invoice.total?.toLocaleString() || '0',
      });
    } catch {}

    res.json(await db('invoices').where('id', req.params.id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/invoices/:id/mark-overdue
router.post('/:id/mark-overdue', async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await db('invoices').where('id', req.params.id).update({ status: 'overdue', updated_at: new Date().toISOString() });
    await logStatus(req.params.id, invoice.status, 'overdue', 'Invoice marked overdue');
    res.json(await db('invoices').where('id', req.params.id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    await db('invoices').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const items = await db('invoice_line_items').where('invoice_id', invoice.id).orderBy('sort_order');
    const user = await db('users').where('id', req.user.id).first();

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(22).fillColor('#0F3460').text(user.company_name || 'HomeSync', 50, 50);
    doc.fontSize(9).fillColor('#666');
    if (user.phone) doc.text(user.phone, 50, 76);
    if (user.email) doc.text(user.email, 50, 88);

    // Invoice title
    doc.fontSize(28).fillColor('#0E7C7B').text('INVOICE', 350, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#333');
    doc.text(`# ${invoice.invoice_number}`, 350, 84, { align: 'right' });
    doc.text(`Date: ${invoice.issue_date || new Date().toISOString().split('T')[0]}`, 350, 98, { align: 'right' });
    doc.text(`Due: ${invoice.due_date || 'Upon receipt'}`, 350, 112, { align: 'right' });

    // Status badge
    if (invoice.status === 'paid') {
      doc.fontSize(14).fillColor('#16A34A').text('PAID', 350, 130, { align: 'right' });
    }

    // Bill To
    doc.moveDown(3);
    const billY = 160;
    doc.fontSize(8).fillColor('#999').text('BILL TO', 50, billY);
    doc.fontSize(11).fillColor('#333');
    let y = billY + 14;
    if (invoice.customer_name) { doc.text(invoice.customer_name, 50, y); y += 14; }
    if (invoice.customer_address) { doc.text(invoice.customer_address, 50, y); y += 14; }
    if (invoice.customer_email) { doc.text(invoice.customer_email, 50, y); y += 14; }
    if (invoice.customer_phone) { doc.text(invoice.customer_phone, 50, y); y += 14; }

    // Payment terms
    const termsMap = { net_15: 'Net 15', net_30: 'Net 30', net_45: 'Net 45', due_on_receipt: 'Due on Receipt' };
    if (invoice.payment_terms) {
      doc.fontSize(8).fillColor('#999').text('PAYMENT TERMS', 350, billY);
      doc.fontSize(10).fillColor('#333').text(termsMap[invoice.payment_terms] || invoice.payment_terms, 350, billY + 14);
    }

    // ── Line Items Table ──
    const tableTop = Math.max(y + 20, 240);
    const col = { service: 50, desc: 170, qty: 350, price: 410, amount: 490 };

    // Header row
    doc.rect(50, tableTop - 4, 510, 20).fill('#F3F4F6');
    doc.fontSize(8).fillColor('#666');
    doc.text('Service', col.service, tableTop);
    doc.text('Description', col.desc, tableTop);
    doc.text('Qty', col.qty, tableTop);
    doc.text('Unit Price', col.price, tableTop);
    doc.text('Amount', col.amount, tableTop);

    // Rows
    let rowY = tableTop + 22;
    doc.fontSize(9).fillColor('#333');
    for (const item of items) {
      if (rowY > 680) { doc.addPage(); rowY = 60; }
      doc.text(item.service || '', col.service, rowY, { width: 115 });
      doc.text(item.description || '', col.desc, rowY, { width: 175 });
      doc.text(String(item.quantity || 1), col.qty, rowY);
      doc.text(`$${(item.unit_price || 0).toLocaleString()}`, col.price, rowY);
      doc.text(`$${(item.amount || 0).toLocaleString()}`, col.amount, rowY);
      rowY += 18;
    }

    // ── Totals ──
    doc.moveTo(390, rowY + 6).lineTo(560, rowY + 6).stroke('#E5E7EB');
    rowY += 14;

    const totals = [
      { label: 'Subtotal', value: invoice.subtotal || 0 },
    ];
    if (invoice.discount_amount > 0) {
      const discLabel = invoice.discount_type === 'percent' ? `Discount (${invoice.discount_amount}%)` : 'Discount';
      const discVal = invoice.discount_type === 'percent' ? (invoice.subtotal * invoice.discount_amount / 100) : invoice.discount_amount;
      totals.push({ label: discLabel, value: -discVal });
    }
    if (invoice.tax_rate > 0) {
      totals.push({ label: `Tax (${(invoice.tax_rate * 100).toFixed(1)}%)`, value: invoice.tax_amount || 0 });
    }

    doc.fontSize(9).fillColor('#666');
    for (const t of totals) {
      doc.text(t.label, 390, rowY);
      doc.text(`${t.value < 0 ? '-' : ''}$${Math.abs(t.value).toLocaleString()}`, col.amount, rowY);
      rowY += 16;
    }

    // Total
    doc.moveTo(390, rowY).lineTo(560, rowY).stroke('#0F3460');
    rowY += 6;
    doc.fontSize(14).fillColor('#0F3460');
    doc.text('Total', 390, rowY);
    doc.text(`$${(invoice.total || 0).toLocaleString()}`, col.amount - 10, rowY);

    // ── Notes ──
    if (invoice.notes) {
      rowY += 40;
      if (rowY > 680) { doc.addPage(); rowY = 60; }
      doc.fontSize(8).fillColor('#999').text('NOTES', 50, rowY);
      doc.fontSize(9).fillColor('#333').text(invoice.notes, 50, rowY + 12, { width: 400 });
    }

    // ── Footer ──
    const footY = 720;
    doc.fontSize(9).fillColor('#0E7C7B').text('Thank you for your business!', 50, footY, { align: 'center', width: 510 });
    doc.fontSize(8).fillColor('#999').text(`${user.company_name || 'HomeSync'} • ${user.email || ''} • ${user.phone || ''}`, 50, footY + 14, { align: 'center', width: 510 });

    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
