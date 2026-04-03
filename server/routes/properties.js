const express = require('express');
const router = express.Router();
const db = require('../db');
const { parseCSV, applyMappings, validateRow } = require('../services/csvProcessor');
const { aggregateAll } = require('../services/subdivisionAggregator');

// GET /api/properties — paginated, filterable, sortable, searchable
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      subdivision, zip, year_built_min, year_built_max,
      sort = 'id', order = 'asc', search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = db('properties');
    let countQuery = db('properties');

    const applyFilters = (q) => {
      if (subdivision) q.where('subdivision', subdivision);
      if (zip) q.where('zip', zip);
      if (year_built_min) q.where('year_built', '>=', parseInt(year_built_min));
      if (year_built_max) q.where('year_built', '<=', parseInt(year_built_max));
      if (search) {
        q.where(function () {
          this.where('address', 'like', `%${search}%`)
            .orWhere('owner_name', 'like', `%${search}%`)
            .orWhere('subdivision', 'like', `%${search}%`)
            .orWhere('parcel_id', 'like', `%${search}%`);
        });
      }
      return q;
    };

    applyFilters(query);
    applyFilters(countQuery);

    const allowedSorts = ['id', 'address', 'subdivision', 'year_built', 'square_footage', 'assessed_value', 'owner_name', 'zip', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    const [{ total }] = await countQuery.count('* as total');
    const rows = await query
      .orderBy(sortField, sortOrder)
      .limit(parseInt(limit))
      .offset(offset);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/stats
router.get('/stats', async (req, res) => {
  try {
    const [{ total }] = await db('properties').count('* as total');
    const byZip = await db('properties').select('zip').count('* as count').groupBy('zip').orderBy('count', 'desc');
    const byYear = await db('properties').select('year_built').count('* as count').whereNotNull('year_built').groupBy('year_built').orderBy('year_built');
    const subdivisionCount = await db('properties').countDistinct('subdivision as count').whereNotNull('subdivision').first();

    res.json({
      total,
      subdivisions: subdivisionCount.count,
      byZip,
      byYear,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const property = await db('properties').where('id', req.params.id).first();
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties — create one
router.post('/', async (req, res) => {
  try {
    const [id] = await db('properties').insert(req.body);
    const property = await db('properties').where('id', id).first();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/properties/:id
router.put('/:id', async (req, res) => {
  try {
    await db('properties').where('id', req.params.id).update({ ...req.body, last_updated: new Date().toISOString() });
    const property = await db('properties').where('id', req.params.id).first();
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('properties').where('id', req.params.id).del();
    if (!deleted) return res.status(404).json({ error: 'Property not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties/import — bulk import from mapped CSV data
router.post('/import', async (req, res) => {
  try {
    const { csvText, mappings } = req.body;
    if (!csvText || !mappings) return res.status(400).json({ error: 'csvText and mappings required' });

    const records = parseCSV(csvText);
    const mapped = applyMappings(records, mappings);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < mapped.length; i++) {
      const row = mapped[i];
      const rowErrors = validateRow(row, i);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      // Default maintenance year fields to year_built
      if (row.year_built) {
        if (!row.hvac_year_installed) row.hvac_year_installed = row.year_built;
        if (!row.water_heater_year) row.water_heater_year = row.year_built;
        if (!row.roof_year) row.roof_year = row.year_built;
        if (!row.exterior_paint_year) row.exterior_paint_year = row.year_built;
      }

      try {
        await db('properties').insert(row);
        imported++;
      } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
          skipped++;
        } else {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    }

    // Auto-run subdivision aggregation
    await aggregateAll();

    res.json({ imported, skipped, errors, total: mapped.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
