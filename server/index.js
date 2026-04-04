const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Security: Validate critical environment variables
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set in production. Exiting.');
  process.exit(1);
}
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET should be at least 32 characters for security.');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({ contentSecurityPolicy: false })); // CSP off for SPA compatibility

// Rate limiting on auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// CORS: support comma-separated origins for production + dev
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(null, false);
  },
}));
// Stripe webhook needs raw body — MUST be before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), require('./routes/billing').webhookHandler);

app.use(express.json({ limit: '10mb' }));

const { authenticate, optionalAuth, requireTier, requireAdmin, checkSubdivisionViewLimit } = require('./middleware/auth');

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HomeSync API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Public routes — no auth required
app.use('/api/auth', require('./routes/auth'));
app.use('/api/portal', require('./routes/client-portal'));

// Protected routes — require authentication
app.use('/api/properties', authenticate, require('./routes/properties'));
app.use('/api/subdivisions', authenticate, require('./routes/subdivisions'));
app.use('/api/import', authenticate, requireTier('pro', 'enterprise'), require('./routes/import'));
app.use('/api/maintenance', authenticate, require('./routes/maintenance'));
app.use('/api/contacts', authenticate, require('./routes/contacts'));
app.use('/api/activities', authenticate, require('./routes/activities'));
app.use('/api/emails', authenticate, requireTier('pro', 'enterprise'), require('./routes/emails'));
app.use('/api/campaigns', authenticate, requireTier('pro', 'enterprise'), require('./routes/campaigns'));
app.use('/api/projects', authenticate, require('./routes/projects'));
app.use('/api/reports', authenticate, require('./routes/reports'));

// Contractor routes
app.use('/api/contractor', authenticate, require('./routes/contractor-dashboard'));
app.use('/api/leads', authenticate, require('./routes/contractor-leads'));
app.use('/api/proposals', authenticate, require('./routes/proposals'));
app.use('/api/jobs', authenticate, require('./routes/contractor-jobs'));
app.use('/api/invoices', authenticate, require('./routes/invoices'));
app.use('/api/notifications', authenticate, require('./routes/notifications'));
app.use('/api/billing', authenticate, require('./routes/billing'));
app.use('/api/ai', authenticate, require('./routes/ai'));
app.use('/api/settings', authenticate, require('./routes/settings'));

// Admin routes
app.use('/api/admin', authenticate, requireAdmin, require('./routes/admin'));

// In production, serve the built React app
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HomeSync server running on http://localhost:${PORT}`);
});
