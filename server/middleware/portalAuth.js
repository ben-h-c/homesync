const db = require('../db');
const { hashToken } = require('../utils/tokens');

async function authenticatePortalToken(req, res, next) {
  const token = req.params.token;
  if (!token) return res.status(401).json({ error: 'Portal token required' });

  try {
    const tokenHash = hashToken(token);
    const stored = await db('client_portal_tokens')
      .where('token_hash', tokenHash)
      .where('revoked', false)
      .where('expires_at', '>', new Date().toISOString())
      .first();

    if (!stored) return res.status(401).json({ error: 'Invalid or expired portal link' });

    // Track last accessed — notify contractor if first access in 24h+
    const lastAccess = stored.last_accessed_at ? new Date(stored.last_accessed_at).getTime() : 0;
    const now = Date.now();
    const isNewSession = (now - lastAccess) > 24 * 60 * 60 * 1000;

    await db('client_portal_tokens').where('id', stored.id).update({ last_accessed_at: new Date().toISOString() });

    if (isNewSession) {
      try {
        const { notifyPortalAccessed } = require('../services/notificationService');
        await notifyPortalAccessed({
          contractorUserId: stored.contractor_user_id,
          jobId: stored.job_id,
          clientName: stored.client_name || stored.client_email,
        });
      } catch {} // best-effort
    }

    req.portal = {
      tokenId: stored.id,
      jobId: stored.job_id,
      contractorUserId: stored.contractor_user_id,
      clientEmail: stored.client_email,
      clientName: stored.client_name,
    };

    next();
  } catch (err) {
    res.status(500).json({ error: 'Portal authentication failed' });
  }
}

module.exports = { authenticatePortalToken };
