const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('campaigns').where('user_id', req.user.id);
    if (status) query = query.where('status', status);
    const campaigns = await query.orderBy('created_at', 'desc');
    res.json(campaigns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const campaign = await db('campaigns').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const recipients = await db('campaign_recipients').where('campaign_id', campaign.id);
    res.json({ ...campaign, recipients });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/campaigns
router.post('/', async (req, res) => {
  try {
    const { name, subject, body_html, template_id, status, scheduled_at, recipient_source, recipient_filter, notes } = req.body;
    const [id] = await db('campaigns').insert({
      name, subject, body_html, template_id, status: status || 'draft',
      scheduled_at, recipient_source, recipient_filter, notes, user_id: req.user.id,
    });
    const campaign = await db('campaigns').where('id', id).first();
    res.status(201).json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/campaigns/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, subject, body_html, template_id, status, scheduled_at, recipient_source, recipient_filter, notes } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (subject !== undefined) update.subject = subject;
    if (body_html !== undefined) update.body_html = body_html;
    if (template_id !== undefined) update.template_id = template_id;
    if (status !== undefined) update.status = status;
    if (scheduled_at !== undefined) update.scheduled_at = scheduled_at;
    if (recipient_source !== undefined) update.recipient_source = recipient_source;
    if (recipient_filter !== undefined) update.recipient_filter = recipient_filter;
    if (notes !== undefined) update.notes = notes;
    update.updated_at = new Date().toISOString();
    await db('campaigns').where({ id: req.params.id, user_id: req.user.id }).update(update);
    const campaign = await db('campaigns').where('id', req.params.id).first();
    res.json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/campaigns/:id/add-recipients
router.post('/:id/add-recipients', async (req, res) => {
  try {
    // Verify ownership
    const ownedCampaign = await db('campaigns').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!ownedCampaign) return res.status(404).json({ error: 'Campaign not found' });
    const { recipients } = req.body; // array of { email, name }
    if (!recipients?.length) return res.status(400).json({ error: 'No recipients' });
    await db('campaign_recipients').insert(
      recipients.map((r) => ({ campaign_id: parseInt(req.params.id), email: r.email, name: r.name || '' }))
    );
    await db('campaigns').where('id', req.params.id).update({
      total_recipients: await db('campaign_recipients').where('campaign_id', req.params.id).count('* as c').then(r => r[0].c),
      updated_at: new Date().toISOString(),
    });
    const campaign = await db('campaigns').where('id', req.params.id).first();
    res.json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/campaigns/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const campaign = await db('campaigns').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const recipients = await db('campaign_recipients').where({ campaign_id: campaign.id, status: 'pending' });

    const { sendEmail } = require('../services/emailService');
    let sent = 0;
    for (const r of recipients) {
      try {
        // Personalize: replace {{name}} in subject/body
        const subject = (campaign.subject || '').replace(/\{\{name\}\}/g, r.name || 'there');
        const body_html = (campaign.body_html || '').replace(/\{\{name\}\}/g, r.name || 'there');

        await sendEmail({ to_email: r.email, to_name: r.name, subject, body_html });
        await db('campaign_recipients').where('id', r.id).update({ status: 'sent', sent_at: new Date().toISOString() });
        sent++;
      } catch { /* continue on individual failures */ }
    }

    await db('campaigns').where('id', campaign.id).update({
      status: 'sent', sent_at: new Date().toISOString(), total_sent: sent, updated_at: new Date().toISOString(),
    });
    res.json(await db('campaigns').where('id', campaign.id).first());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Marketing Plans ──

// GET /api/campaigns/plans
router.get('/plans/list', async (req, res) => {
  try {
    const plans = await db('marketing_plans').where('user_id', req.user.id).orderBy('created_at', 'desc');
    res.json(plans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/campaigns/plans
router.post('/plans', async (req, res) => {
  try {
    const { name, target_services, target_areas, budget, goals, plan_content, status } = req.body;
    const [id] = await db('marketing_plans').insert({
      name, target_services, target_areas, budget, goals, plan_content, status, user_id: req.user.id,
    });
    const plan = await db('marketing_plans').where('id', id).first();
    res.status(201).json(plan);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/campaigns/plans/generate — generate a marketing plan from inputs
router.post('/plans/generate', async (req, res) => {
  try {
    const { target_services, target_areas, budget, goals } = req.body;
    let services, areas;
    try { services = JSON.parse(target_services || '[]'); } catch { services = []; }
    try { areas = JSON.parse(target_areas || '[]'); } catch { areas = []; }

    // Get matching subdivisions for recommendations
    let subQuery = db('subdivisions').whereNotNull('maintenance_urgency_score').orderBy('maintenance_urgency_score', 'desc');
    if (areas.length > 0) subQuery = subQuery.whereIn('zip', areas);
    const hotSubs = await subQuery.limit(10);

    // Generate quarterly plan
    const quarters = [
      {
        quarter: 'Q1 (Jan-Mar)', focus: 'Spring prep campaigns',
        actions: [
          { type: 'campaign', description: `Send "Spring Maintenance Check" email to ${Math.min(hotSubs.length, 5)} top subdivisions`, priority: 'high' },
          { type: 'outreach', description: 'Reach out to 3 high-urgency subdivisions with targeted proposals', priority: 'high' },
          { type: 'content', description: 'Create seasonal maintenance checklist to share with prospects', priority: 'medium' },
        ],
        target_subdivisions: hotSubs.slice(0, 3).map(s => ({ name: s.name, homes: s.total_homes, urgency: s.maintenance_urgency_score })),
      },
      {
        quarter: 'Q2 (Apr-Jun)', focus: 'Peak season execution',
        actions: [
          { type: 'campaign', description: 'Launch "Summer Ready" campaign to all leads in pipeline', priority: 'high' },
          { type: 'outreach', description: 'Follow up on Q1 contacts, send proposals to warm leads', priority: 'high' },
          { type: 'referral', description: 'Send referral request to completed project clients', priority: 'medium' },
          { type: 'content', description: 'Share before/after photos from recent projects on email and social', priority: 'low' },
        ],
        target_subdivisions: hotSubs.slice(3, 6).map(s => ({ name: s.name, homes: s.total_homes, urgency: s.maintenance_urgency_score })),
      },
      {
        quarter: 'Q3 (Jul-Sep)', focus: 'Mid-year push and reviews',
        actions: [
          { type: 'campaign', description: `Send "Fall Prep" campaign — ${services.join(', ')} services highlighted`, priority: 'high' },
          { type: 'outreach', description: 'Door-knock or direct mail top 2 subdivisions with aging homes', priority: 'medium' },
          { type: 'review', description: 'Request Google/Yelp reviews from satisfied clients', priority: 'medium' },
        ],
        target_subdivisions: hotSubs.slice(6, 9).map(s => ({ name: s.name, homes: s.total_homes, urgency: s.maintenance_urgency_score })),
      },
      {
        quarter: 'Q4 (Oct-Dec)', focus: 'Year-end close and planning',
        actions: [
          { type: 'campaign', description: 'Send "End of Year" promotion with early-bird pricing for next year', priority: 'high' },
          { type: 'outreach', description: 'Reach out to past clients for repeat work and referrals', priority: 'high' },
          { type: 'content', description: 'Create year-in-review email showcasing completed projects and savings', priority: 'medium' },
          { type: 'planning', description: 'Review pipeline, set revenue targets for next year', priority: 'medium' },
        ],
        target_subdivisions: hotSubs.slice(0, 3).map(s => ({ name: s.name, homes: s.total_homes, urgency: s.maintenance_urgency_score })),
      },
    ];

    const plan = {
      target_services: target_services,
      target_areas: target_areas,
      budget, goals,
      plan_content: JSON.stringify({
        summary: `Marketing plan for ${services.join(', ')} services${areas.length > 0 ? ` in ZIP codes ${areas.join(', ')}` : ' across Atlanta metro'}. Budget: ${budget || 'Not specified'}. Goal: ${goals || 'Grow business'}.`,
        quarters,
        recommended_subdivisions: hotSubs.map(s => ({ id: s.id, name: s.name, homes: s.total_homes, urgency: s.maintenance_urgency_score, zip: s.zip })),
        email_frequency: 'Bi-weekly campaigns recommended',
        best_send_times: 'Tuesday/Wednesday 9-11am for highest open rates',
      }),
    };

    const [id] = await db('marketing_plans').insert({ ...plan, user_id: req.user.id, name: `${services.join(' & ')} Marketing Plan` });
    const saved = await db('marketing_plans').where('id', id).first();
    res.status(201).json(saved);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
