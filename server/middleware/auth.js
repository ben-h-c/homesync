const { verifyAccessToken } = require('../utils/tokens');
const db = require('../db');

const TIER_LEVELS = { starter: 1, pro: 2, enterprise: 3 };

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = verifyAccessToken(header.split(' ')[1]);
    req.user = payload;

    // Refresh tier from DB (ensures Stripe webhook changes are reflected immediately)
    const currentUser = await db('users').where('id', payload.id)
      .select('subscription_tier', 'subscription_status', 'trial_ends_at', 'stripe_subscription_id').first();
    if (currentUser) {
      req.user.tier = currentUser.subscription_tier;
      req.user.subscription_status = currentUser.subscription_status;

      // Enforce trial expiration
      if (currentUser.subscription_status === 'trialing' && !currentUser.stripe_subscription_id) {
        if (currentUser.trial_ends_at && new Date(currentUser.trial_ends_at) < new Date()) {
          return res.status(403).json({
            error: 'trial_expired',
            message: 'Your free trial has expired. Please subscribe to continue using HomeSync.',
          });
        }
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.split(' ')[1]);
    } catch { /* ignore invalid tokens */ }
  }
  next();
}

function requireTier(...tiers) {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    if (!tiers.includes(req.user.tier)) {
      const minTier = tiers.sort((a, b) => TIER_LEVELS[a] - TIER_LEVELS[b])[0];
      return res.status(403).json({
        error: 'upgrade_required',
        required_tier: minTier,
        current_tier: req.user.tier,
        message: `This feature requires a ${minTier} plan or higher.`,
      });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function checkSubdivisionViewLimit(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (req.user.tier !== 'starter') return next();

  const user = await db('users').where('id', req.user.id).first();
  if (!user) return res.status(401).json({ error: 'User not found' });

  // Reset monthly counter if needed
  const now = new Date();
  const resetAt = user.subdivision_views_reset_at ? new Date(user.subdivision_views_reset_at) : null;
  if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
    await db('users').where('id', user.id).update({
      subdivision_views_used: 0,
      subdivision_views_reset_at: now.toISOString(),
    });
    user.subdivision_views_used = 0;
  }

  if (user.subdivision_views_used >= 5) {
    return res.status(403).json({
      error: 'view_limit_reached',
      message: 'Starter plan allows 5 subdivision views per month. Upgrade to Pro for unlimited.',
      views_used: user.subdivision_views_used,
      views_limit: 5,
    });
  }

  await db('users').where('id', user.id).update({
    subdivision_views_used: user.subdivision_views_used + 1,
  });

  next();
}

async function checkAICredits(req, res, next) {
  if (req.user.role === 'admin') return next();

  const user = await db('users').where('id', req.user.id).first();
  if (!user) return res.status(401).json({ error: 'User not found' });

  const tier = user.subscription_tier || 'starter';
  const limits = { starter: 5, pro: 25, enterprise: Infinity };
  const limit = limits[tier] || 5;

  // Reset monthly counter
  const now = new Date();
  const resetAt = user.ai_credits_reset_at ? new Date(user.ai_credits_reset_at) : null;
  if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
    await db('users').where('id', user.id).update({ ai_credits_used: 0, ai_credits_reset_at: now.toISOString() });
    user.ai_credits_used = 0;
  }

  if (user.ai_credits_used >= limit) {
    return res.status(403).json({
      error: 'ai_credits_exhausted',
      message: `You've used all ${limit} AI generations this month. Upgrade for more.`,
      credits_used: user.ai_credits_used,
      credits_limit: limit,
    });
  }

  req.aiCreditsUsed = user.ai_credits_used;
  req.aiCreditsLimit = limit;
  next();
}

module.exports = { authenticate, optionalAuth, requireTier, requireAdmin, checkSubdivisionViewLimit, checkAICredits, TIER_LEVELS };
