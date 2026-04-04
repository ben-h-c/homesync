const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/contractor/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db('users').where('id', userId).first();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Opportunities — top subdivisions matching trade with high urgency
    const tradeColumn = {
      hvac: 'hvac_pct_due', roofing: 'roof_pct_due', roof: 'roof_pct_due',
      plumbing: 'water_heater_pct_due', water_heater: 'water_heater_pct_due',
      painting: 'paint_pct_due', exterior_paint: 'paint_pct_due',
    };
    const urgencyCol = tradeColumn[user.trade_category] || 'maintenance_urgency_score';

    const opportunities = await db('subdivisions')
      .whereNotNull('maintenance_urgency_score')
      .orderBy(urgencyCol, 'desc')
      .limit(10);

    // Lead stats
    const leadsByStage = await db('contractor_leads').where('user_id', userId)
      .select('stage').count('* as count').groupBy('stage');
    const recentLeads = await db('contractor_leads').where('user_id', userId)
      .leftJoin('subdivisions', 'contractor_leads.subdivision_id', 'subdivisions.id')
      .select('contractor_leads.*', 'subdivisions.name as subdivision_name')
      .orderBy('contractor_leads.updated_at', 'desc').limit(5);

    // Revenue this month
    const [{ revenue }] = await db('invoices').where('user_id', userId)
      .where('status', 'paid')
      .where('paid_at', '>=', monthStart)
      .sum('total as revenue');

    // Total outstanding
    const [{ outstanding }] = await db('invoices').where('user_id', userId)
      .whereIn('status', ['sent', 'overdue'])
      .sum('total as outstanding');

    // Upcoming jobs
    const upcomingJobs = await db('contractor_jobs').where('user_id', userId)
      .whereIn('status', ['scheduled', 'in_progress'])
      .leftJoin('subdivisions', 'contractor_jobs.subdivision_id', 'subdivisions.id')
      .select('contractor_jobs.*', 'subdivisions.name as subdivision_name')
      .orderBy('start_date').limit(5);

    // Proposals stats
    const [{ activeProposals }] = await db('proposals').where('user_id', userId)
      .whereIn('status', ['draft', 'sent']).count('* as activeProposals');
    const [{ proposalValue }] = await db('proposals').where('user_id', userId)
      .where('status', 'sent').sum('total_amount as proposalValue');

    // Invoice stats
    const invoicesByStatus = await db('invoices').where('user_id', userId)
      .select('status').count('* as count').sum('total as total').groupBy('status');

    res.json({
      opportunities,
      leadsByStage,
      recentLeads,
      revenueThisMonth: revenue || 0,
      outstanding: outstanding || 0,
      upcomingJobs,
      activeProposals: activeProposals || 0,
      proposalValue: proposalValue || 0,
      invoicesByStatus,
      trade: user.trade_category || 'general',
      company: user.company_name,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
