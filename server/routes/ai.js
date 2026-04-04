const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkAICredits } = require('../middleware/auth');
const aiService = require('../services/aiService');

// GET /api/ai/credits — check remaining credits
router.get('/credits', async (req, res) => {
  try {
    const user = await db('users').where('id', req.user.id)
      .select('ai_credits_used', 'ai_credits_reset_at', 'subscription_tier').first();
    const tier = user.subscription_tier || 'starter';
    const limits = { starter: 5, pro: 25, enterprise: Infinity };
    const limit = limits[tier] || 5;

    // Reset check
    const now = new Date();
    const resetAt = user.ai_credits_reset_at ? new Date(user.ai_credits_reset_at) : null;
    let used = user.ai_credits_used || 0;
    if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      used = 0;
    }

    res.json({
      credits_used: used,
      credits_limit: limit === Infinity ? -1 : limit,
      credits_remaining: limit === Infinity ? -1 : Math.max(0, limit - used),
      ai_available: aiService.isAvailable(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-email — AI-powered email copy generation
router.post('/generate-email', checkAICredits, async (req, res) => {
  try {
    const { subdivision_id, service_type, tone } = req.body;

    // Get subdivision context if provided
    let subData = {};
    if (subdivision_id) {
      const sub = await db('subdivisions').where('id', subdivision_id).first();
      if (sub) {
        subData = {
          subdivisionName: sub.name,
          homeCount: sub.total_homes,
          yearBuilt: sub.year_built_mode,
          urgencyScore: sub.maintenance_urgency_score,
        };
      }
    }

    // Get contractor info
    const user = await db('users').where('id', req.user.id).first();

    const result = await aiService.generateEmailCopy({
      ...subData,
      serviceType: service_type || user.trade_category || 'home maintenance',
      tone: tone || 'professional',
      contractorName: `${user.first_name} ${user.last_name || ''}`.trim(),
      companyName: user.company_name || 'ContractorHub',
    });

    // Increment AI credits
    await db('users').where('id', req.user.id).update({
      ai_credits_used: (req.aiCreditsUsed || 0) + 1,
    });

    const limits = { starter: 5, pro: 25, enterprise: Infinity };
    const limit = limits[user.subscription_tier || 'starter'] || 5;

    res.json({
      ...result,
      credits_remaining: limit === Infinity ? -1 : Math.max(0, limit - (req.aiCreditsUsed || 0) - 1),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-marketing-plan — AI-powered quarterly plan
router.post('/generate-marketing-plan', checkAICredits, async (req, res) => {
  try {
    const { target_services, target_areas, budget, goals } = req.body;
    let services, areas;
    try { services = JSON.parse(target_services || '[]'); } catch { services = []; }
    try { areas = JSON.parse(target_areas || '[]'); } catch { areas = []; }

    // Get hot subdivisions for context
    let subQuery = db('subdivisions').whereNotNull('maintenance_urgency_score')
      .orderBy('maintenance_urgency_score', 'desc');
    if (areas.length > 0) subQuery = subQuery.whereIn('zip', areas);
    const hotSubs = await subQuery.limit(10);

    const aiPlan = await aiService.generateMarketingPlan({
      services, areas, budget, goals, hotSubdivisions: hotSubs,
    });

    // Increment AI credits
    await db('users').where('id', req.user.id).update({
      ai_credits_used: (req.aiCreditsUsed || 0) + 1,
    });

    if (!aiPlan) {
      // AI unavailable — fall back to hardcoded plan (same as existing campaigns.js logic)
      return res.status(503).json({ error: 'AI service unavailable. Try again later.' });
    }

    // Save plan to database
    const user = await db('users').where('id', req.user.id).first();
    const [id] = await db('marketing_plans').insert({
      name: `${services.join(' & ') || 'General'} Marketing Plan`,
      target_services: target_services,
      target_areas: target_areas,
      budget, goals,
      plan_content: JSON.stringify(aiPlan),
      user_id: req.user.id,
    });

    const saved = await db('marketing_plans').where('id', id).first();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
