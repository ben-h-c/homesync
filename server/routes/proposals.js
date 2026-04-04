const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('proposals').where('proposals.user_id', req.user.id)
      .leftJoin('subdivisions', 'proposals.subdivision_id', 'subdivisions.id')
      .select('proposals.*', 'subdivisions.name as subdivision_name');
    if (status) query = query.where('proposals.status', status);
    const proposals = await query.orderBy('proposals.updated_at', 'desc');
    res.json(proposals);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const proposal = await db('proposals').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const [id] = await db('proposals').insert({ ...req.body, user_id: req.user.id });
    const proposal = await db('proposals').where('id', id).first();
    res.status(201).json(proposal);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await db('proposals').where({ id: req.params.id, user_id: req.user.id })
      .update({ ...req.body, updated_at: new Date().toISOString() });
    const proposal = await db('proposals').where('id', req.params.id).first();
    res.json(proposal);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/:id/send', async (req, res) => {
  try {
    await db('proposals').where({ id: req.params.id, user_id: req.user.id })
      .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const proposal = await db('proposals').where('id', req.params.id).first();
    res.json(proposal);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
