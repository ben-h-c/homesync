const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { generateAccessToken, generateRefreshToken, hashToken, getRefreshExpiry } = require('../utils/tokens');
const { authenticate } = require('../middleware/auth');
const { sendTemplatedEmail } = require('../services/emailService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, company_name, phone, zip_code, trade_category } = req.body;
    if (!email || !password || !first_name) {
      return res.status(400).json({ error: 'Email, password, and first name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await db('users').where('email', email.toLowerCase()).first();
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Geocode ZIP code for map centering
    let userLat = null, userLng = null;
    if (zip_code) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip_code)}&country=US&format=json&limit=1`, {
          headers: { 'User-Agent': 'WeDoneDoIt/1.0' },
        });
        const geoData = await geoRes.json();
        if (geoData[0]) { userLat = parseFloat(geoData[0].lat); userLng = parseFloat(geoData[0].lon); }
      } catch {} // geocoding is best-effort
    }

    const [id] = await db('users').insert({
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name: last_name || null,
      company_name: company_name || null,
      phone: phone || null,
      zip_code: zip_code || null,
      trade_category: trade_category || null,
      user_latitude: userLat,
      user_longitude: userLng,
      role: 'subscriber',
      subscription_tier: 'starter',
      subscription_status: 'trialing',
      trial_ends_at: trialEnds,
      metro_areas: '["atlanta"]',
    });

    const user = await db('users').where('id', id).first();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: getRefreshExpiry(),
    });

    // Send welcome email (best-effort)
    try {
      await sendTemplatedEmail('welcome', {
        first_name: first_name,
        app_url: process.env.CLIENT_URL || 'http://localhost:5173',
      }, { to_email: email.toLowerCase(), to_name: first_name });
    } catch {}

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db('users').where('email', email.toLowerCase()).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await db('users').where('id', user.id).update({ last_login_at: new Date().toISOString() });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: getRefreshExpiry(),
    });

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const tokenHash = hashToken(refreshToken);
    const stored = await db('refresh_tokens')
      .where('token_hash', tokenHash)
      .where('revoked', false)
      .where('expires_at', '>', new Date().toISOString())
      .first();

    if (!stored) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const user = await db('users').where('id', stored.user_id).first();
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Issue new access token but reuse same refresh token (no rotation)
    // This prevents React StrictMode double-mount from invalidating the session
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = refreshToken; // keep the same one

    res.json({
      user: sanitizeUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Revoke all refresh tokens for this user
    await db('refresh_tokens').where('user_id', req.user.id).update({ revoked: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db('users').where('id', req.user.id).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowed = [
      'first_name', 'last_name', 'company_name', 'phone', 'email',
      'address', 'city', 'state', 'zip_code', 'trade_category',
      'business_description', 'tagline', 'logo_url',
      'default_tax_rate', 'payment_terms', 'service_radius_miles',
      'license_number', 'insurance_verified',
      'notification_new_leads', 'notification_invoice_payments',
      'notification_client_messages', 'notification_project_updates',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.updated_at = new Date().toISOString();

    // Re-geocode if zip_code changed
    if (update.zip_code) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(update.zip_code)}&country=US&format=json&limit=1`, {
          headers: { 'User-Agent': 'WeDoneDoIt/1.0' },
        });
        const geoData = await geoRes.json();
        if (geoData[0]) {
          update.user_latitude = parseFloat(geoData[0].lat);
          update.user_longitude = parseFloat(geoData[0].lon);
        }
      } catch {} // geocoding is best-effort
    }

    await db('users').where('id', req.user.id).update(update);
    const user = await db('users').where('id', req.user.id).first();
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await db('users').where('id', req.user.id).first();
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await db('users').where('id', req.user.id).update({ password_hash, updated_at: new Date().toISOString() });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Always return success to prevent email enumeration
    const user = await db('users').where('email', email.toLowerCase()).first();
    if (!user) return res.json({ success: true });

    // Invalidate any existing reset tokens for this user
    await db('password_reset_tokens').where('user_id', user.id).whereNull('used_at').update({
      used_at: new Date().toISOString(),
    });

    // Generate reset token (64 bytes = 128 hex chars)
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await db('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/#/reset-password?token=${token}`;

    await sendTemplatedEmail('password_reset', {
      first_name: user.first_name || 'there',
      reset_url: resetUrl,
    }, { to_email: user.email, to_name: user.first_name });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await db('password_reset_tokens')
      .where('token_hash', tokenHash)
      .whereNull('used_at')
      .where('expires_at', '>', new Date().toISOString())
      .first();

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Mark token as used
    await db('password_reset_tokens').where('id', resetToken.id).update({
      used_at: new Date().toISOString(),
    });

    // Update password
    const password_hash = await bcrypt.hash(password, 12);
    await db('users').where('id', resetToken.user_id).update({
      password_hash,
      updated_at: new Date().toISOString(),
    });

    // Revoke all refresh tokens (force re-login everywhere)
    await db('refresh_tokens').where('user_id', resetToken.user_id).update({ revoked: true });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;
