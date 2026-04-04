const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const { stage, limit = 50 } = req.query;
    let query = db('contractor_leads')
      .where('contractor_leads.user_id', req.user.id)
      .leftJoin('subdivisions', 'contractor_leads.subdivision_id', 'subdivisions.id')
      .select('contractor_leads.*', 'subdivisions.name as subdivision_name', 'subdivisions.total_homes as subdivision_homes', 'subdivisions.zip as subdivision_zip');
    if (stage) query = query.where('contractor_leads.stage', stage);
    const leads = await query.orderBy('contractor_leads.updated_at', 'desc').limit(parseInt(limit));
    res.json(leads);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    const lead = await db('contractor_leads').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const [id] = await db('contractor_leads').insert({ ...req.body, user_id: req.user.id });
    const lead = await db('contractor_leads').where('id', id).first();
    res.status(201).json(lead);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/leads/:id
router.put('/:id', async (req, res) => {
  try {
    await db('contractor_leads').where({ id: req.params.id, user_id: req.user.id })
      .update({ ...req.body, updated_at: new Date().toISOString() });
    const lead = await db('contractor_leads').where('id', req.params.id).first();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    await db('contractor_leads').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
