const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'company_name', 'phone',
        'role', 'subscription_tier', 'subscription_status', 'trial_ends_at',
        'subdivision_views_used', 'last_login_at', 'created_at')
      .orderBy('created_at', 'desc');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await db('users').where('id', req.params.id)
      .select('id', 'email', 'first_name', 'last_name', 'company_name', 'phone',
        'role', 'subscription_tier', 'subscription_status', 'trial_ends_at',
        'metro_areas', 'subdivision_views_used', 'last_login_at', 'created_at')
      .first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users — create a new user
router.post('/users', async (req, res) => {
  try {
    const { email, password, first_name, last_name, company_name, phone, role, subscription_tier } = req.body;
    if (!email || !password || !first_name) {
      return res.status(400).json({ error: 'Email, password, and first name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const existing = await db('users').where('email', email.toLowerCase()).first();
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 12);
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const [id] = await db('users').insert({
      email: email.toLowerCase(), password_hash, first_name,
      last_name: last_name || null, company_name: company_name || null, phone: phone || null,
      role: role || 'subscriber', subscription_tier: subscription_tier || 'starter',
      subscription_status: 'trialing', trial_ends_at: trialEnds,
    });

    const user = await db('users').where('id', id).first();
    const { password_hash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['first_name', 'last_name', 'email', 'company_name', 'phone',
      'role', 'subscription_tier', 'subscription_status', 'trial_ends_at',
      'subscription_started_at', 'subscription_ends_at', 'metro_areas', 'trade_category', 'zip_code'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.updated_at = new Date().toISOString();

    await db('users').where('id', req.params.id).update(update);
    const user = await db('users').where('id', req.params.id).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id (soft cancel)
router.delete('/users/:id', async (req, res) => {
  try {
    await db('users').where('id', req.params.id).update({
      subscription_status: 'canceled',
      subscription_ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await db('users').count('* as count').first();
    const byTier = await db('users').select('subscription_tier').count('* as count').groupBy('subscription_tier');
    const byStatus = await db('users').select('subscription_status').count('* as count').groupBy('subscription_status');
    const admins = await db('users').where('role', 'admin').count('* as count').first();

    const tierPrices = { starter: 49, pro: 149, enterprise: 299 };
    const activeByTier = await db('users')
      .whereIn('subscription_status', ['active', 'trialing'])
      .where('role', 'subscriber')
      .select('subscription_tier')
      .count('* as count')
      .groupBy('subscription_tier');

    const mrr = activeByTier.reduce((sum, t) => sum + (t.count * (tierPrices[t.subscription_tier] || 0)), 0);

    res.json({
      totalUsers: total.count,
      admins: admins.count,
      byTier,
      byStatus,
      mrr,
      arr: mrr * 12,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Data Discovery ──

// POST /api/admin/data-discovery — trigger subdivision discovery for ZIP codes
router.post('/data-discovery', async (req, res) => {
  try {
    const { zip_codes } = req.body;
    if (!zip_codes || !Array.isArray(zip_codes) || zip_codes.length === 0) {
      return res.status(400).json({ error: 'zip_codes array is required' });
    }
    if (zip_codes.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 ZIP codes per request' });
    }

    const [jobId] = await db('data_discovery_jobs').insert({
      user_id: req.user.id,
      zip_codes: JSON.stringify(zip_codes),
    });

    // Run discovery async — don't block the response
    const { discoverSubdivisions } = require('../services/dataDiscoveryService');
    discoverSubdivisions(zip_codes, jobId).catch((err) => {
      console.error('[Discovery] Job failed:', err.message);
      db('data_discovery_jobs').where('id', jobId).update({
        status: 'failed', error_message: err.message, completed_at: new Date().toISOString(),
      }).catch(() => {});
    });

    res.status(202).json({ job_id: jobId, status: 'pending', message: 'Discovery job started. Check status at GET /api/admin/data-discovery/:id' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data-discovery — list all discovery jobs
router.get('/data-discovery', async (req, res) => {
  try {
    const jobs = await db('data_discovery_jobs').orderBy('created_at', 'desc').limit(50);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data-discovery/:id — get job status and results
router.get('/data-discovery/:id', async (req, res) => {
  try {
    const job = await db('data_discovery_jobs').where('id', req.params.id).first();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ ...job, results: job.results ? JSON.parse(job.results) : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/data-discovery/:id/import — import discovered subdivisions
router.post('/data-discovery/:id/import', async (req, res) => {
  try {
    const job = await db('data_discovery_jobs').where('id', req.params.id).first();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Job not completed yet' });

    const results = job.results ? JSON.parse(job.results) : [];
    const { importDiscoveredSubdivisions } = require('../services/dataDiscoveryService');
    const imported = await importDiscoveredSubdivisions(results);
    res.json({ imported: imported.length, subdivisions: imported });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
