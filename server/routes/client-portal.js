const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const PDFDocument = require('pdfkit');
const { authenticatePortalToken } = require('../middleware/portalAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'homesync-dev-secret-change-in-production';

function generateClientToken(clientAccount) {
  return jwt.sign({ id: clientAccount.id, email: clientAccount.email, type: 'client' }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticateClient(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (payload.type !== 'client') return res.status(401).json({ error: 'Invalid client token' });
    req.clientUser = payload;
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}

// ── Client auth endpoints ──

// POST /api/portal/register — client creates account from portal token
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, token } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await db('client_accounts').where('email', email.toLowerCase()).first();
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

    const password_hash = await bcrypt.hash(password, 12);
    const [id] = await db('client_accounts').insert({
      email: email.toLowerCase(), password_hash,
      first_name: first_name || null, last_name: last_name || null,
    });

    const account = await db('client_accounts').where('id', id).first();

    // Link any portal tokens matching this email
    await db('client_portal_tokens').where('client_email', email.toLowerCase()).update({ client_account_id: id });

    const clientToken = generateClientToken(account);
    res.status(201).json({ client: { id: account.id, email: account.email, first_name: account.first_name }, token: clientToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/portal/login — client signs in
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const account = await db('client_accounts').where('email', email.toLowerCase()).first();
    if (!account || !account.password_hash) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    await db('client_accounts').where('id', account.id).update({ last_login_at: new Date().toISOString() });

    const clientToken = generateClientToken(account);
    res.json({ client: { id: account.id, email: account.email, first_name: account.first_name }, token: clientToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/my-projects — all projects for authenticated client
router.get('/my-projects', authenticateClient, async (req, res) => {
  try {
    const tokens = await db('client_portal_tokens')
      .where('client_email', req.clientUser.email)
      .where('revoked', false)
      .where('expires_at', '>', new Date().toISOString());

    const projects = [];
    for (const t of tokens) {
      const job = await db('contractor_jobs').where('id', t.job_id).first();
      const contractor = await db('users').where('id', t.contractor_user_id)
        .select('first_name', 'last_name', 'company_name', 'phone').first();
      if (job) {
        const [{ unread }] = await db('client_messages')
          .where({ job_id: job.id, sender_type: 'contractor' }).whereNull('read_at').count('* as unread');
        projects.push({
          job_id: job.id, title: job.title, status: job.status, service_type: job.service_type,
          contractor: contractor ? { name: `${contractor.first_name} ${contractor.last_name || ''}`.trim(), company: contractor.company_name } : null,
          portal_token: t.token_hash, // they already have the token, this is just for reference
          unread_messages: unread,
        });
      }
    }

    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All token-based routes: /api/portal/:token/...

// GET /api/portal/:token — validate token + return job summary
router.get('/:token', authenticatePortalToken, async (req, res) => {
  try {
    const job = await db('contractor_jobs').where('id', req.portal.jobId).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    const contractor = await db('users').where('id', req.portal.contractorUserId)
      .select('first_name', 'last_name', 'company_name', 'phone', 'email').first();
    const unreadMessages = await db('client_messages')
      .where({ job_id: req.portal.jobId, sender_type: 'contractor' }).whereNull('read_at').count('* as c').first();

    res.json({
      job: {
        id: job.id, title: job.title, status: job.status, service_type: job.service_type,
        description: job.description, start_date: job.start_date, end_date: job.end_date,
        total_homes: job.total_homes, homes_completed: job.homes_completed,
        client_name: job.client_name, photos: job.photos ? JSON.parse(job.photos) : [],
      },
      contractor: {
        name: `${contractor.first_name} ${contractor.last_name || ''}`.trim(),
        company: contractor.company_name, phone: contractor.phone, email: contractor.email,
      },
      clientEmail: req.portal.clientEmail,
      clientName: req.portal.clientName,
      unreadMessages: unreadMessages?.c || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/:token/timeline — activity log
router.get('/:token/timeline', authenticatePortalToken, async (req, res) => {
  try {
    const activities = await db('job_activities').where('job_id', req.portal.jobId)
      .whereIn('type', ['status_change', 'note', 'change_order']) // hide internal-only types
      .orderBy('created_at', 'desc').limit(30);
    res.json(activities);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/:token/invoices
router.get('/:token/invoices', authenticatePortalToken, async (req, res) => {
  try {
    const invoices = await db('invoices').where('job_id', req.portal.jobId)
      .whereIn('status', ['sent', 'viewed', 'paid', 'overdue'])
      .select('id', 'invoice_number', 'customer_name', 'total', 'status', 'issue_date', 'due_date', 'sent_at', 'paid_at')
      .orderBy('created_at', 'desc');

    // Mark as viewed and notify contractor
    for (const inv of invoices) {
      if (inv.status === 'sent') {
        await db('invoices').where('id', inv.id).update({ viewed_at: new Date().toISOString() });
        try {
          const { notifyInvoiceViewed } = require('../services/notificationService');
          await notifyInvoiceViewed({
            contractorUserId: req.portal.contractorUserId,
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: req.portal.clientName || req.portal.clientEmail,
          });
        } catch {}
      }
    }

    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/:token/invoices/:id
router.get('/:token/invoices/:invoiceId', authenticatePortalToken, async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.invoiceId, job_id: req.portal.jobId }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const line_items = await db('invoice_line_items').where('invoice_id', invoice.id).orderBy('sort_order');
    res.json({ ...invoice, line_items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/:token/invoices/:id/pdf
router.get('/:token/invoices/:invoiceId/pdf', authenticatePortalToken, async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.invoiceId, job_id: req.portal.jobId }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const items = await db('invoice_line_items').where('invoice_id', invoice.id).orderBy('sort_order');
    const user = await db('users').where('id', req.portal.contractorUserId).first();

    // Reuse PDF generation logic (simplified)
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoice_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#0F3460').text(user.company_name || 'HomeSync', 50, 50);
    doc.fontSize(9).fillColor('#666');
    if (user.phone) doc.text(user.phone);
    if (user.email) doc.text(user.email);
    doc.moveDown(2);
    doc.fontSize(20).fillColor('#0E7C7B').text('INVOICE', { align: 'right' });
    doc.fontSize(10).fillColor('#333').text(`# ${invoice.invoice_number}`, { align: 'right' });
    doc.text(`Date: ${invoice.issue_date || '—'}`, { align: 'right' });
    doc.text(`Due: ${invoice.due_date || 'Upon receipt'}`, { align: 'right' });
    if (invoice.status === 'paid') doc.fontSize(12).fillColor('#16A34A').text('PAID', { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text('BILL TO');
    doc.fontSize(11).fillColor('#333').text(invoice.customer_name || '');
    if (invoice.customer_address) doc.text(invoice.customer_address);
    doc.moveDown(2);

    // Line items
    let y = doc.y;
    doc.fontSize(9).fillColor('#666');
    items.forEach((item) => {
      doc.text(`${item.service} — ${item.description || ''}`, 50, y);
      doc.text(`${item.quantity} x $${(item.unit_price || 0).toLocaleString()} = $${(item.amount || 0).toLocaleString()}`, 400, y);
      y += 18;
    });

    y += 10;
    doc.moveTo(350, y).lineTo(560, y).stroke('#ddd');
    y += 8;
    doc.fontSize(10).text(`Subtotal: $${(invoice.subtotal || 0).toLocaleString()}`, 350, y);
    if (invoice.tax_amount > 0) { y += 16; doc.text(`Tax: $${(invoice.tax_amount || 0).toLocaleString()}`, 350, y); }
    y += 20;
    doc.fontSize(14).fillColor('#0F3460').text(`Total: $${(invoice.total || 0).toLocaleString()}`, 350, y);

    if (invoice.notes) { doc.moveDown(3); doc.fontSize(9).fillColor('#666').text(invoice.notes, 50); }
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#0E7C7B').text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/portal/:token/change-orders
router.get('/:token/change-orders', authenticatePortalToken, async (req, res) => {
  try {
    const orders = await db('change_orders').where('job_id', req.portal.jobId).orderBy('created_at', 'desc');
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/portal/:token/change-orders/:coId/respond
router.post('/:token/change-orders/:coId/respond', authenticatePortalToken, async (req, res) => {
  try {
    const { status, note } = req.body; // approved or rejected
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });

    const co = await db('change_orders').where({ id: req.params.coId, job_id: req.portal.jobId }).first();
    if (!co) return res.status(404).json({ error: 'Change order not found' });

    await db('change_orders').where('id', co.id).update({
      status, client_response: status, client_responded_at: new Date().toISOString(),
      client_note: note || null, approved_by: req.portal.clientName || req.portal.clientEmail,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    // Log activity
    await db('job_activities').insert({
      job_id: req.portal.jobId, type: 'change_order',
      description: `Client ${status} change order ${co.change_order_number}${note ? ': ' + note : ''}`,
    });

    // Notify contractor
    try {
      const { notifyChangeOrderResponse } = require('../services/notificationService');
      await notifyChangeOrderResponse({
        contractorUserId: req.portal.contractorUserId,
        jobId: req.portal.jobId,
        clientName: req.portal.clientName || req.portal.clientEmail,
        action: status,
        coNumber: co.change_order_number,
      });
    } catch {}

    res.json(await db('change_orders').where('id', co.id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/portal/:token/messages
router.get('/:token/messages', authenticatePortalToken, async (req, res) => {
  try {
    const messages = await db('client_messages').where('job_id', req.portal.jobId).orderBy('created_at', 'asc');
    // Mark contractor messages as read
    await db('client_messages').where({ job_id: req.portal.jobId, sender_type: 'contractor' }).whereNull('read_at')
      .update({ read_at: new Date().toISOString() });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/portal/:token/messages
router.post('/:token/messages', authenticatePortalToken, async (req, res) => {
  try {
    const clientName = req.portal.clientName || req.portal.clientEmail;
    const [id] = await db('client_messages').insert({
      job_id: req.portal.jobId, sender_type: 'client',
      sender_name: clientName,
      message: req.body.message,
    });

    // Notify contractor of new client message
    try {
      const { notifyClientMessage } = require('../services/notificationService');
      await notifyClientMessage({
        contractorUserId: req.portal.contractorUserId,
        jobId: req.portal.jobId,
        clientName,
        messagePreview: req.body.message || '',
      });
    } catch {} // notification is best-effort

    res.status(201).json(await db('client_messages').where('id', id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
