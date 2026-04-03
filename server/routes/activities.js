const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/activities — list, filterable
router.get('/', async (req, res) => {
  try {
    const { contact_id, subdivision_id, project_id, type, limit = 50 } = req.query;
    let query = db('activities');

    if (contact_id) query = query.where('contact_id', contact_id);
    if (subdivision_id) query = query.where('subdivision_id', subdivision_id);
    if (project_id) query = query.where('project_id', project_id);
    if (type) query = query.where('type', type);

    const activities = await query.orderBy('created_at', 'desc').orderBy('id', 'desc').limit(parseInt(limit));
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities/recent
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await db('activities').orderBy('created_at', 'desc').orderBy('id', 'desc').limit(limit);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities — log new activity
router.post('/', async (req, res) => {
  try {
    const [id] = await db('activities').insert(req.body);

    // Auto-update contact.last_contacted
    if (req.body.contact_id) {
      await db('contacts').where('id', req.body.contact_id).update({
        last_contacted: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Auto-update subdivision.last_contacted
    if (req.body.subdivision_id) {
      await db('subdivisions').where('id', req.body.subdivision_id).update({
        last_contacted: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const activity = await db('activities').where('id', id).first();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
