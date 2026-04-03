const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const { status, subdivision_id, sort = 'created_at', order = 'desc' } = req.query;
    let query = db('projects');
    if (status) query = query.where('status', status);
    if (subdivision_id) query = query.where('subdivision_id', subdivision_id);
    const projects = await query.orderBy(sort, order === 'desc' ? 'desc' : 'asc');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/stats
router.get('/stats', async (req, res) => {
  try {
    const [{ total }] = await db('projects').count('* as total');
    const [{ active }] = await db('projects').whereIn('status', ['sign_ups_open', 'scheduled', 'in_progress']).count('* as active');
    const revenue = await db('projects').sum('total_revenue as total').first();
    const signups = await db('projects').sum('homes_signed_up as total').first();
    res.json({ total, active, total_revenue: revenue.total || 0, total_homes_signed_up: signups.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await db('projects').where('id', req.params.id).first();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const [id] = await db('projects').insert(req.body);
    const project = await db('projects').where('id', id).first();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    await db('projects').where('id', req.params.id).update({ ...req.body, updated_at: new Date().toISOString() });
    const project = await db('projects').where('id', req.params.id).first();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    await db('projects').where('id', req.params.id).del();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/signups
router.get('/:id/signups', async (req, res) => {
  try {
    const signups = await db('project_signups').where('project_id', req.params.id).orderBy('created_at', 'desc');
    res.json(signups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/signups
router.post('/:id/signups', async (req, res) => {
  try {
    const [id] = await db('project_signups').insert({ ...req.body, project_id: req.params.id });
    // Update project count
    const [{ count }] = await db('project_signups').where('project_id', req.params.id).count('* as count');
    await db('projects').where('id', req.params.id).update({ homes_signed_up: count, updated_at: new Date().toISOString() });
    const signup = await db('project_signups').where('id', id).first();
    res.status(201).json(signup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/projects/:id/signups/:sid
router.put('/:id/signups/:sid', async (req, res) => {
  try {
    await db('project_signups').where('id', req.params.sid).update(req.body);
    // Recount completed
    const [{ completed }] = await db('project_signups').where({ project_id: req.params.id, status: 'completed' }).count('* as completed');
    await db('projects').where('id', req.params.id).update({ homes_completed: completed, updated_at: new Date().toISOString() });
    const signup = await db('project_signups').where('id', req.params.sid).first();
    res.json(signup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
