const express = require('express');
const router = express.Router();
const db = require('../db');
const { aggregateAll } = require('../services/subdivisionAggregator');
const { checkSubdivisionViewLimit } = require('../middleware/auth');

// GET /api/subdivisions — list all, sortable, filterable
router.get('/', async (req, res) => {
  try {
    const { sort = 'name', order = 'asc', trade, year_min, year_max, zip, urgency_min, has_coords } = req.query;
    const allowedSorts = ['name', 'total_homes', 'year_built_mode', 'maintenance_urgency_score', 'pipeline_stage', 'avg_assessed_value', 'hvac_pct_due', 'roof_pct_due', 'water_heater_pct_due', 'paint_pct_due'];
    const sortField = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    let query = db('subdivisions');

    // Filter by trade-specific urgency
    const tradeColumn = { hvac: 'hvac_pct_due', roofing: 'roof_pct_due', roof: 'roof_pct_due', plumbing: 'water_heater_pct_due', water_heater: 'water_heater_pct_due', painting: 'paint_pct_due', exterior_paint: 'paint_pct_due' };
    if (trade && tradeColumn[trade.toLowerCase()]) {
      query = query.where(tradeColumn[trade.toLowerCase()], '>', 0);
    }

    if (year_min) query = query.where('year_built_mode', '>=', parseInt(year_min));
    if (year_max) query = query.where('year_built_mode', '<=', parseInt(year_max));
    if (zip) query = query.where('zip', zip);
    if (urgency_min) query = query.where('maintenance_urgency_score', '>=', parseInt(urgency_min));
    if (has_coords === 'true') query = query.whereNotNull('latitude');

    // Tier-based distance filtering — restrict map data by radius from user's location
    if (req.user && req.user.role !== 'admin') {
      const user = await db('users').where('id', req.user.id)
        .select('user_latitude', 'user_longitude', 'subscription_tier').first();
      if (user?.user_latitude && user?.user_longitude) {
        const radiusMap = { starter: 15, pro: 50, enterprise: 9999 };
        const tier = user.subscription_tier || 'starter';
        const radiusMiles = radiusMap[tier] || 15;
        if (radiusMiles < 9999) {
          const latDelta = radiusMiles / 69.0;
          const lngDelta = radiusMiles / (69.0 * Math.cos(user.user_latitude * Math.PI / 180));
          query = query.whereBetween('latitude', [user.user_latitude - latDelta, user.user_latitude + latDelta])
            .whereBetween('longitude', [user.user_longitude - lngDelta, user.user_longitude + lngDelta]);
        }
      }
    }

    const subdivisions = await query.orderBy(sortField, sortOrder);
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

// GET /api/subdivisions/:id (Starter tier: 5 views/month limit)
router.get('/:id', checkSubdivisionViewLimit, async (req, res) => {
  try {
    const subdivision = await db('subdivisions').where('id', req.params.id).first();
    if (!subdivision) return res.status(404).json({ error: 'Subdivision not found' });
    res.json(subdivision);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subdivisions/:id — admin only
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
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
