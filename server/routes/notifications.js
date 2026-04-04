const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notifications — list notifications (newest first)
router.get('/', async (req, res) => {
  try {
    const { limit = 30, offset = 0, unread_only } = req.query;
    let query = db('notifications').where('user_id', req.user.id);
    if (unread_only === 'true') query = query.whereNull('read_at');
    const notifications = await query
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const [{ count }] = await db('notifications')
      .where('user_id', req.user.id)
      .whereNull('read_at')
      .count('* as count');
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/:id/read — mark single as read
router.post('/:id/read', async (req, res) => {
  try {
    await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .whereNull('read_at')
      .update({ read_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  try {
    await db('notifications')
      .where('user_id', req.user.id)
      .whereNull('read_at')
      .update({ read_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
