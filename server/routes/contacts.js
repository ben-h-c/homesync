const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/contacts — list, filterable
router.get('/', async (req, res) => {
  try {
    const { type, subdivision, status, search, sort = 'last_name', order = 'asc' } = req.query;
    let query = db('contacts');

    if (type) query = query.where('type', type);
    if (subdivision) query = query.where('subdivision', subdivision);
    if (status) query = query.where('status', status);
    if (search) {
      query = query.where(function () {
        this.where('first_name', 'like', `%${search}%`)
          .orWhere('last_name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('company', 'like', `%${search}%`)
          .orWhere('subdivision', 'like', `%${search}%`);
      });
    }

    const allowedSorts = ['first_name', 'last_name', 'type', 'company', 'subdivision', 'last_contacted', 'created_at', 'contractor_rating'];
    const sortField = allowedSorts.includes(sort) ? sort : 'last_name';

    const contacts = await query.orderBy(sortField, order === 'desc' ? 'desc' : 'asc');
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts/search?q=
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const contacts = await db('contacts')
      .where('first_name', 'like', `%${q}%`)
      .orWhere('last_name', 'like', `%${q}%`)
      .orWhere('email', 'like', `%${q}%`)
      .orWhere('company', 'like', `%${q}%`)
      .limit(20);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts/:id
router.get('/:id', async (req, res) => {
  try {
    const contact = await db('contacts').where('id', req.params.id).first();
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  try {
    const [id] = await db('contacts').insert({
      ...req.body,
      tags: req.body.tags ? JSON.stringify(req.body.tags) : null,
      contractor_services: req.body.contractor_services ? JSON.stringify(req.body.contractor_services) : null,
    });
    const contact = await db('contacts').where('id', id).first();
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body, updated_at: new Date().toISOString() };
    if (update.tags && Array.isArray(update.tags)) update.tags = JSON.stringify(update.tags);
    if (update.contractor_services && Array.isArray(update.contractor_services)) update.contractor_services = JSON.stringify(update.contractor_services);
    await db('contacts').where('id', req.params.id).update(update);
    const contact = await db('contacts').where('id', req.params.id).first();
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await db('contacts').where('id', req.params.id).update({ status: 'inactive', updated_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
