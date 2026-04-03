const express = require('express');
const router = express.Router();
const db = require('../db');
const { aggregateAll } = require('../services/subdivisionAggregator');

// GET /api/subdivisions — list all, sortable
router.get('/', async (req, res) => {
  try {
    const { sort = 'name', order = 'asc' } = req.query;
    const allowedSorts = ['name', 'total_homes', 'year_built_mode', 'maintenance_urgency_score', 'pipeline_stage', 'avg_assessed_value'];
    const sortField = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    const subdivisions = await db('subdivisions').orderBy(sortField, sortOrder);
    res.json(subdivisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subdivisions/recalculate
router.post('/recalculate', async (req, res) => {
  try {
    const results = await aggregateAll();
    res.json({ updated: results.length, subdivisions: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subdivisions/:id
router.get('/:id', async (req, res) => {
  try {
    const subdivision = await db('subdivisions').where('id', req.params.id).first();
    if (!subdivision) return res.status(404).json({ error: 'Subdivision not found' });
    res.json(subdivision);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subdivisions/:id
router.put('/:id', async (req, res) => {
  try {
    const before = await db('subdivisions').where('id', req.params.id).first();
    if (!before) return res.status(404).json({ error: 'Subdivision not found' });

    await db('subdivisions').where('id', req.params.id).update({ ...req.body, updated_at: new Date().toISOString() });
    const subdivision = await db('subdivisions').where('id', req.params.id).first();

    // Auto-log pipeline stage changes
    if (req.body.pipeline_stage && req.body.pipeline_stage !== before.pipeline_stage) {
      await db('activities').insert({
        subdivision_id: parseInt(req.params.id),
        type: 'status_change',
        subject: `Pipeline: ${(before.pipeline_stage || 'research').replace(/_/g, ' ')} → ${req.body.pipeline_stage.replace(/_/g, ' ')}`,
        description: `${subdivision.name} moved from "${(before.pipeline_stage || 'research').replace(/_/g, ' ')}" to "${req.body.pipeline_stage.replace(/_/g, ' ')}"`,
      });
    }

    res.json(subdivision);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/subdivisions/:id/properties
router.get('/:id/properties', async (req, res) => {
  try {
    const subdivision = await db('subdivisions').where('id', req.params.id).first();
    if (!subdivision) return res.status(404).json({ error: 'Subdivision not found' });
    const properties = await db('properties').where('subdivision', subdivision.name);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subdivisions/:id/contacts
router.get('/:id/contacts', async (req, res) => {
  try {
    const subdivision = await db('subdivisions').where('id', req.params.id).first();
    if (!subdivision) return res.status(404).json({ error: 'Subdivision not found' });
    const contacts = await db('contacts').where('subdivision', subdivision.name).where('status', '!=', 'inactive');
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subdivisions/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const activities = await db('activities')
      .where('subdivision_id', req.params.id)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
