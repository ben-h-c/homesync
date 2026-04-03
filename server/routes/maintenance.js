const express = require('express');
const router = express.Router();
const db = require('../db');
const { forecastSubdivision, recalculateAll } = require('../services/maintenanceEngine');

// GET /api/maintenance/rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await db('maintenance_rules').select('*');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/maintenance/rules/:id
router.put('/rules/:id', async (req, res) => {
  try {
    await db('maintenance_rules').where('id', req.params.id).update(req.body);
    const rule = await db('maintenance_rules').where('id', req.params.id).first();
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/maintenance/forecast/:subdivisionId
router.get('/forecast/:subdivisionId', async (req, res) => {
  try {
    const forecast = await forecastSubdivision(parseInt(req.params.subdivisionId));
    if (!forecast) return res.status(404).json({ error: 'Subdivision not found or has no properties' });
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance/recalculate-all
router.post('/recalculate-all', async (req, res) => {
  try {
    const results = await recalculateAll();
    res.json({ updated: results.length, subdivisions: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/maintenance/hot-list
router.get('/hot-list', async (req, res) => {
  try {
    const hotList = await db('subdivisions')
      .whereNotNull('maintenance_urgency_score')
      .orderBy('maintenance_urgency_score', 'desc')
      .limit(10);
    res.json(hotList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
