const express = require('express');
const router = express.Router();
const db = require('../db');

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch {}

const PRICE_TO_TIER = {};
if (process.env.STRIPE_PRICE_STARTER) PRICE_TO_TIER[process.env.STRIPE_PRICE_STARTER] = 'starter';
if (process.env.STRIPE_PRICE_PRO) PRICE_TO_TIER[process.env.STRIPE_PRICE_PRO] = 'pro';
if (process.env.STRIPE_PRICE_ENTERPRISE) PRICE_TO_TIER[process.env.STRIPE_PRICE_ENTERPRISE] = 'enterprise';

// Map tier names to Stripe price IDs
const TIER_PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Payment system not configured' });

    // Accept either a Stripe price_id or a tier name (starter/pro/enterprise)
    let price_id = req.body.price_id;
    if (TIER_PRICE_MAP[price_id]) price_id = TIER_PRICE_MAP[price_id];
    if (!price_id) return res.status(400).json({ error: 'Price ID is required' });

    const user = await db('users').where('id', req.user.id).first();

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        metadata: { user_id: String(user.id) },
      });
      customerId = customer.id;
      await db('users').where('id', user.id).update({ stripe_customer_id: customerId });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${clientUrl}/#/settings?billing=success`,
      cancel_url: `${clientUrl}/#/settings?billing=cancelled`,
      metadata: { user_id: String(user.id) },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/portal-session
router.post('/portal-session', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Payment system not configured' });

    const user = await db('users').where('id', req.user.id).first();
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${clientUrl}/#/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/status
router.get('/status', async (req, res) => {
  try {
    const user = await db('users').where('id', req.user.id)
      .select('subscription_tier', 'subscription_status', 'trial_ends_at',
        'stripe_customer_id', 'stripe_subscription_id',
        'subscription_started_at', 'subscription_ends_at')
      .first();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Webhook handler (mounted separately with raw body parser) ──

async function webhookHandler(req, res) {
  if (!stripe) return res.status(503).send('Not configured');

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = PRICE_TO_TIER[priceId] || 'starter';

        await db('users').where('id', parseInt(userId)).update({
          stripe_subscription_id: session.subscription,
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log(`[Stripe] User ${userId} subscribed to ${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await db('users').where('stripe_subscription_id', subscription.id).first();
        if (!user) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = PRICE_TO_TIER[priceId] || user.subscription_tier;
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'cancelled'
          : user.subscription_status;

        await db('users').where('id', user.id).update({
          subscription_tier: tier,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        });
        console.log(`[Stripe] User ${user.id} subscription updated: ${tier} (${status})`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await db('users').where('stripe_subscription_id', subscription.id).first();
        if (!user) break;

        await db('users').where('id', user.id).update({
          subscription_status: 'cancelled',
          subscription_ends_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log(`[Stripe] User ${user.id} subscription cancelled`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await db('users').where('stripe_customer_id', invoice.customer).first();
        if (!user) break;

        await db('users').where('id', user.id).update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        });
        console.log(`[Stripe] User ${user.id} payment failed`);
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe] Webhook processing error:', err.message);
  }

  res.json({ received: true });
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
