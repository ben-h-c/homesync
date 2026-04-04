const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'homesync-dev-secret-change-in-production';
const ACCESS_EXPIRY = '7d';
const REFRESH_EXPIRY_DAYS = 30;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tier: user.subscription_tier },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiry() {
  return new Date(Date.now() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

module.exports = { generateAccessToken, verifyAccessToken, generateRefreshToken, hashToken, getRefreshExpiry };
