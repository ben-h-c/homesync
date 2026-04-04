const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: log activity
async function logActivity(jobId, userId, type, description, oldVal, newVal) {
  await db('job_activities').insert({ job_id: jobId, user_id: userId, type, description, old_value: oldVal || null, new_value: newVal || null });
}

// GET /api/jobs — list
router.get('/', async (req, res) => {
  try {
    const { status, service_type, search, sort = 'updated_at', order = 'desc' } = req.query;
    let query = db('contractor_jobs').where('contractor_jobs.user_id', req.user.id)
      .leftJoin('subdivisions', 'contractor_jobs.subdivision_id', 'subdivisions.id')
      .select('contractor_jobs.*', 'subdivisions.name as subdivision_name');
    if (status) query = query.where('contractor_jobs.status', status);
    if (service_type) query = query.where('contractor_jobs.service_type', service_type);
    if (search) {
      query = query.where(function () {
        this.where('contractor_jobs.title', 'like', `%${search}%`)
          .orWhere('contractor_jobs.client_name', 'like', `%${search}%`)
          .orWhere('subdivisions.name', 'like', `%${search}%`);
      });
    }
    const allowedSorts = ['title', 'status', 'start_date', 'end_date', 'total_revenue', 'updated_at', 'created_at', 'estimated_cost'];
    const sortField = allowedSorts.includes(sort) ? `contractor_jobs.${sort}` : 'contractor_jobs.updated_at';
    const jobs = await query.orderBy(sortField, order === 'asc' ? 'asc' : 'desc');
    res.json(jobs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/jobs/:id — detail with activities, change orders, invoices
router.get('/:id', async (req, res) => {
  try {
    const job = await db('contractor_jobs')
      .where('contractor_jobs.id', req.params.id)
      .where('contractor_jobs.user_id', req.user.id)
      .leftJoin('subdivisions', 'contractor_jobs.subdivision_id', 'subdivisions.id')
      .select('contractor_jobs.*', 'subdivisions.name as subdivision_name')
      .first();
    if (!job) return res.status(404).json({ error: 'Project not found' });

    const [activities, changeOrders, invoices] = await Promise.all([
      db('job_activities').where('job_id', job.id).orderBy('created_at', 'desc').limit(50),
      db('change_orders').where('job_id', job.id).orderBy('created_at', 'desc'),
      db('invoices').where({ user_id: req.user.id, job_id: job.id }).orderBy('created_at', 'desc'),
    ]);

    res.json({ ...job, activities, changeOrders, invoices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/jobs — create
router.post('/', async (req, res) => {
  try {
    const { photos, ...data } = req.body;
    const [id] = await db('contractor_jobs').insert({
      ...data,
      user_id: req.user.id,
      photos: photos ? JSON.stringify(photos) : null,
      status: data.status || 'not_started',
    });
    await logActivity(id, req.user.id, 'status_change', 'Project created', null, data.status || 'not_started');

    // If created from a lead, update lead stage
    if (data.lead_id) {
      await db('contractor_leads').where({ id: data.lead_id, user_id: req.user.id }).update({ stage: 'won', won_date: new Date().toISOString().split('T')[0] });
    }

    const job = await db('contractor_jobs').where('id', id).first();
    res.status(201).json(job);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/jobs/:id — update
router.put('/:id', async (req, res) => {
  try {
    const existing = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const { photos, ...data } = req.body;
    const update = { ...data, updated_at: new Date().toISOString() };
    if (photos) update.photos = JSON.stringify(photos);

    // Log status change
    if (data.status && data.status !== existing.status) {
      await logActivity(existing.id, req.user.id, 'status_change', `Status changed from ${existing.status} to ${data.status}`, existing.status, data.status);
      if (data.status === 'completed') update.completed_at = new Date().toISOString();
    }

    // Log notes
    if (data.notes && data.notes !== existing.notes) {
      await logActivity(existing.id, req.user.id, 'note', 'Notes updated');
    }

    await db('contractor_jobs').where('id', req.params.id).update(update);
    const job = await db('contractor_jobs').where('id', req.params.id).first();
    res.json(job);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/jobs/:id/activity — add note/activity
router.post('/:id/activity', async (req, res) => {
  try {
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    const [id] = await db('job_activities').insert({ job_id: job.id, user_id: req.user.id, ...req.body });
    const activity = await db('job_activities').where('id', id).first();
    res.status(201).json(activity);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Change Orders ──

// GET /api/jobs/:id/change-orders
router.get('/:id/change-orders', async (req, res) => {
  try {
    // Verify ownership
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    const orders = await db('change_orders').where('job_id', req.params.id).orderBy('created_at', 'desc');
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/jobs/:id/change-orders
router.post('/:id/change-orders', async (req, res) => {
  try {
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });

    // Auto-generate number
    const count = await db('change_orders').where('job_id', job.id).count('* as c').first();
    const num = `CO-${String((count.c || 0) + 1).padStart(2, '0')}`;

    const [id] = await db('change_orders').insert({
      job_id: job.id, user_id: req.user.id, change_order_number: num, ...req.body,
    });
    await logActivity(job.id, req.user.id, 'change_order', `Change order ${num} created: ${req.body.description}`);

    const order = await db('change_orders').where('id', id).first();
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/jobs/:id/change-orders/:coId
router.put('/:id/change-orders/:coId', async (req, res) => {
  try {
    const { status } = req.body;
    const update = { ...req.body, updated_at: new Date().toISOString() };
    if (status === 'approved') update.approved_at = new Date().toISOString();

    await db('change_orders').where({ id: req.params.coId, job_id: req.params.id }).update(update);
    const order = await db('change_orders').where('id', req.params.coId).first();

    if (status) {
      await logActivity(parseInt(req.params.id), req.user.id, 'change_order', `Change order ${order.change_order_number} ${status}`);
    }
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Client Portal Management ──

// POST /api/jobs/:id/portal/enable — generate portal token and send link
router.post('/:id/portal/enable', async (req, res) => {
  try {
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    if (!job.client_email) return res.status(400).json({ error: 'Project has no client email. Add a client email first.' });

    const { generateRefreshToken, hashToken } = require('../utils/tokens');
    const token = generateRefreshToken(); // 48 random bytes
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    // Revoke any existing tokens for this job
    await db('client_portal_tokens').where('job_id', job.id).update({ revoked: true });

    await db('client_portal_tokens').insert({
      job_id: job.id, contractor_user_id: req.user.id,
      client_email: job.client_email, client_name: job.client_name,
      token_hash: tokenHash, expires_at: expiresAt,
    });

    await db('contractor_jobs').where('id', job.id).update({
      portal_enabled: true, portal_token_sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    // Send email with portal link
    const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/portal/${token}`;
    try {
      const { sendTemplatedEmail } = require('../services/emailService');
      const user = await db('users').where('id', req.user.id).first();
      await sendTemplatedEmail('portal_invite', {
        client_name: job.client_name || 'there',
        company_name: user.company_name || 'ContractorHub',
        project_title: job.title || 'your project',
        service_type: job.service_type || 'Project',
        portal_url: portalUrl,
      }, { to_email: job.client_email, to_name: job.client_name });
    } catch { /* email is best-effort */ }

    await logActivity(job.id, req.user.id, 'note', 'Client portal enabled and link sent');

    res.json({ success: true, portal_url: portalUrl, expires_at: expiresAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/jobs/:id/portal/revoke
router.post('/:id/portal/revoke', async (req, res) => {
  try {
    await db('client_portal_tokens').where('job_id', req.params.id).update({ revoked: true });
    await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).update({ portal_enabled: false, updated_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/jobs/:id/portal/status
router.get('/:id/portal/status', async (req, res) => {
  try {
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    const activeToken = await db('client_portal_tokens').where({ job_id: job.id, revoked: false })
      .where('expires_at', '>', new Date().toISOString()).first();
    const unreadMessages = await db('client_messages').where({ job_id: job.id, sender_type: 'client' }).whereNull('read_at').count('* as c').first();

    res.json({
      enabled: !!job.portal_enabled,
      token_sent_at: job.portal_token_sent_at,
      last_accessed: activeToken?.last_accessed_at || null,
      expires_at: activeToken?.expires_at || null,
      unread_messages: unreadMessages?.c || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/jobs/conversations — all message threads for contractor
router.get('/conversations/list', async (req, res) => {
  try {
    // Get all jobs that have portal enabled or messages
    const jobs = await db('contractor_jobs')
      .where('contractor_jobs.user_id', req.user.id)
      .whereExists(function () {
        this.select('id').from('client_messages').whereRaw('client_messages.job_id = contractor_jobs.id');
      })
      .select('contractor_jobs.id', 'contractor_jobs.title', 'contractor_jobs.client_name',
        'contractor_jobs.client_email', 'contractor_jobs.status', 'contractor_jobs.service_type',
        'contractor_jobs.portal_enabled');

    // For each job, get unread count and last message
    const conversations = [];
    for (const job of jobs) {
      const [{ unread }] = await db('client_messages')
        .where({ job_id: job.id, sender_type: 'client' })
        .whereNull('read_at')
        .count('* as unread');
      const lastMsg = await db('client_messages')
        .where('job_id', job.id)
        .orderBy('created_at', 'desc')
        .first();
      const [{ total }] = await db('client_messages')
        .where('job_id', job.id)
        .count('* as total');
      conversations.push({
        job_id: job.id,
        title: job.title,
        client_name: job.client_name,
        client_email: job.client_email,
        status: job.status,
        service_type: job.service_type,
        portal_enabled: job.portal_enabled,
        unread_count: unread,
        total_messages: total,
        last_message: lastMsg ? {
          message: lastMsg.message,
          sender_type: lastMsg.sender_type,
          sender_name: lastMsg.sender_name,
          created_at: lastMsg.created_at,
        } : null,
      });
    }

    // Sort by unread first, then by last message time
    conversations.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      const aTime = a.last_message?.created_at || '';
      const bTime = b.last_message?.created_at || '';
      return bTime.localeCompare(aTime);
    });

    res.json(conversations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/jobs/unread-messages — total unread count for sidebar badge
router.get('/messages/unread-count', async (req, res) => {
  try {
    const jobs = await db('contractor_jobs').where('user_id', req.user.id).select('id');
    const jobIds = jobs.map((j) => j.id);
    if (jobIds.length === 0) return res.json({ count: 0 });
    const [{ count }] = await db('client_messages')
      .whereIn('job_id', jobIds)
      .where('sender_type', 'client')
      .whereNull('read_at')
      .count('* as count');
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/jobs/:id/messages — contractor reads messages
router.get('/:id/messages', async (req, res) => {
  try {
    // Verify ownership
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    const messages = await db('client_messages').where('job_id', req.params.id).orderBy('created_at', 'asc');
    // Mark client messages as read
    await db('client_messages').where({ job_id: req.params.id, sender_type: 'client' }).whereNull('read_at')
      .update({ read_at: new Date().toISOString() });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/jobs/:id/messages — contractor sends message
router.post('/:id/messages', async (req, res) => {
  try {
    // Verify ownership
    const job = await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Project not found' });
    if (!req.body.message || !req.body.message.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    const user = await db('users').where('id', req.user.id).first();
    const [id] = await db('client_messages').insert({
      job_id: parseInt(req.params.id), sender_type: 'contractor',
      sender_name: user.company_name || `${user.first_name} ${user.last_name || ''}`.trim(),
      message: req.body.message.trim(),
    });
    res.status(201).json(await db('client_messages').where('id', id).first());
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    await db('contractor_jobs').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
