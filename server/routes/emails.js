const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendEmail, renderTemplate } = require('../services/emailService');

// POST /api/emails/send
router.post('/send', async (req, res) => {
  try {
    const email = await sendEmail(req.body);
    res.status(201).json(email);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/emails/sent
router.get('/sent', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [{ total }] = await db('emails').count('* as total');
    const emails = await db('emails')
      .orderBy('sent_at', 'desc')
      .orderBy('id', 'desc')
      .limit(parseInt(limit))
      .offset(offset);
    res.json({ data: emails, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emails/templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await db('email_templates').orderBy('category').orderBy('name');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/emails/templates
router.post('/templates', async (req, res) => {
  try {
    const [id] = await db('email_templates').insert(req.body);
    const template = await db('email_templates').where('id', id).first();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/emails/templates/:id
router.put('/templates/:id', async (req, res) => {
  try {
    await db('email_templates').where('id', req.params.id).update({ ...req.body, updated_at: new Date().toISOString() });
    const template = await db('email_templates').where('id', req.params.id).first();
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/emails/preview — render template with variables
router.post('/preview', async (req, res) => {
  try {
    const { template_id, variables } = req.body;
    const template = await db('email_templates').where('id', template_id).first();
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const rendered = renderTemplate(template, variables || {});
    res.json(rendered);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
