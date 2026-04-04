const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateRefreshToken, hashToken } = require('../utils/tokens');

// ── Team Management ──

// GET /api/settings/team
router.get('/team', async (req, res) => {
  try {
    const invites = await db('team_invites').where('invited_by', req.user.id).orderBy('created_at', 'desc');
    res.json(invites);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/team/invite
router.post('/team/invite', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const token = generateRefreshToken();
    const [id] = await db('team_invites').insert({
      invited_by: req.user.id, email, role: role || 'technician', token_hash: hashToken(token),
    });

    // Send invite email
    try {
      const { sendTemplatedEmail } = require('../services/emailService');
      const user = await db('users').where('id', req.user.id).first();
      const registerUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/register`;
      await sendTemplatedEmail('team_invite', {
        inviter_name: user.first_name || 'Your team lead',
        company_name: user.company_name || 'WeDoneDoIt',
        role: role || 'technician',
        register_url: registerUrl,
      }, { to_email: email });
    } catch { /* best effort */ }

    res.status(201).json(await db('team_invites').where('id', id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/settings/team/:id
router.delete('/team/:id', async (req, res) => {
  try {
    await db('team_invites').where({ id: req.params.id, invited_by: req.user.id }).update({ status: 'revoked' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Data Export ──

// GET /api/settings/export/:type
router.get('/export/:type', async (req, res) => {
  try {
    let data, headers;
    const userId = req.user.id;

    switch (req.params.type) {
      case 'projects': {
        data = await db('contractor_jobs').where('user_id', userId);
        headers = ['id', 'title', 'client_name', 'client_email', 'service_type', 'status', 'estimated_cost', 'total_revenue', 'start_date', 'end_date', 'total_homes', 'homes_completed', 'created_at'];
        break;
      }
      case 'invoices': {
        data = await db('invoices').where('user_id', userId);
        headers = ['invoice_number', 'customer_name', 'customer_email', 'total', 'status', 'issue_date', 'due_date', 'paid_at', 'payment_method'];
        break;
      }
      case 'leads': {
        data = await db('contractor_leads').where('user_id', userId)
          .leftJoin('subdivisions', 'contractor_leads.subdivision_id', 'subdivisions.id')
          .select('contractor_leads.*', 'subdivisions.name as subdivision_name');
        headers = ['id', 'subdivision_name', 'stage', 'service_type', 'estimated_value', 'estimated_homes', 'notes', 'next_follow_up', 'created_at'];
        break;
      }
      case 'clients': {
        data = await db('contractor_jobs').where('user_id', userId).whereNotNull('client_email')
          .select('client_name', 'client_email', 'client_phone', 'client_address').distinct();
        headers = ['client_name', 'client_email', 'client_phone', 'client_address'];
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid export type. Use: projects, invoices, leads, clients' });
    }

    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
