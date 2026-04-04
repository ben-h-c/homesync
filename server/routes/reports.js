const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const { forecastSubdivision, CURRENT_YEAR } = require('../services/maintenanceEngine');

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [{ totalProperties }] = await db('properties').count('* as totalProperties');
    const [{ totalSubdivisions }] = await db('subdivisions').count('* as totalSubdivisions');
    const [{ activeProjects }] = await db('projects').whereIn('status', ['planning', 'sign_ups_open', 'scheduled', 'in_progress']).count('* as activeProjects');
    const [{ totalSignups }] = await db('projects').sum('homes_signed_up as totalSignups');
    const [{ pipelineActive }] = await db('subdivisions').whereIn('pipeline_stage', ['contacted', 'meeting_scheduled', 'pitched', 'approved', 'active']).count('* as pipelineActive');

    const hotSubdivisions = await db('subdivisions')
      .whereNotNull('maintenance_urgency_score')
      .orderBy('maintenance_urgency_score', 'desc')
      .limit(5);

    const byYear = await db('properties')
      .select('year_built')
      .count('* as count')
      .whereNotNull('year_built')
      .groupBy('year_built')
      .orderBy('year_built');

    const pipelineDistribution = await db('subdivisions')
      .select('pipeline_stage')
      .count('* as count')
      .groupBy('pipeline_stage');

    const recentActivities = await db('activities')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(10);

    // Follow-ups needed: last_contacted > 7 days in active stages
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const followUps = await db('subdivisions')
      .whereIn('pipeline_stage', ['contacted', 'meeting_scheduled', 'pitched', 'approved', 'active'])
      .where(function () {
        this.where('last_contacted', '<', sevenDaysAgo).orWhereNull('last_contacted');
      });

    const upcomingDeadlines = await db('projects')
      .whereIn('status', ['sign_ups_open', 'scheduled'])
      .where(function () {
        this.whereNotNull('sign_up_deadline').orWhereNotNull('service_start_date');
      })
      .orderBy('sign_up_deadline')
      .limit(5);

    res.json({
      totalProperties,
      totalSubdivisions,
      activeProjects,
      totalSignups: totalSignups || 0,
      pipelineActive,
      hotSubdivisions,
      byYear,
      pipelineDistribution,
      recentActivities,
      followUps,
      upcomingDeadlines,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/forecast/:subId/pdf
router.get('/forecast/:subId/pdf', async (req, res) => {
  try {
    const forecast = await forecastSubdivision(parseInt(req.params.subId));
    if (!forecast) return res.status(404).json({ error: 'Subdivision not found' });

    const sub = await db('subdivisions').where('id', req.params.subId).first();
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sub.name}-Maintenance-Forecast.pdf"`);
    doc.pipe(res);

    // Page 1: Cover
    doc.fontSize(12).fillColor('#0E7C7B').text('HomeSync', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Contractor Intelligence', { align: 'center' });
    doc.moveDown(3);
    doc.fontSize(28).fillColor('#0F3460').text('Maintenance Opportunity Report', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(22).text(sub.name, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666').text(`Prepared ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(3);

    doc.fontSize(11).fillColor('#333').text(
      `Based on public property records, the ${sub.total_homes} homes in ${sub.name} (built ${sub.year_built_min}–${sub.year_built_max}, primarily ${sub.year_built_mode}) are approaching key maintenance milestones. This report identifies which systems need attention, estimated job volumes, and potential revenue for your business.`,
      { align: 'left', lineGap: 4 }
    );
    doc.moveDown(1);
    doc.fontSize(13).fillColor('#0E7C7B').text(`Overall Maintenance Urgency Score: ${forecast.urgency_score}/100`, { align: 'center' });

    // Page 2: System breakdown
    doc.addPage();
    doc.fontSize(18).fillColor('#0F3460').text('System-by-System Analysis', { underline: true });
    doc.moveDown(1);

    const mainSystems = Object.entries(forecast.systems)
      .filter(([, s]) => !s.is_recurring)
      .sort((a, b) => b[1].estimated_homes_needing_service - a[1].estimated_homes_needing_service);

    for (const [, sys] of mainSystems) {
      doc.fontSize(13).fillColor('#0F3460').text(sys.display_name);
      doc.fontSize(10).fillColor('#333');

      const barY = doc.y + 2;
      const barWidth = 400;
      const barHeight = 14;
      // Draw stacked bar
      let x = 50;
      const segments = [
        { pct: sys.pct_critical, color: '#C0392B' },
        { pct: sys.pct_due_now, color: '#E67E22' },
        { pct: sys.pct_upcoming, color: '#F1C40F' },
        { pct: sys.pct_ok, color: '#27AE60' },
      ];
      for (const seg of segments) {
        const w = (seg.pct / 100) * barWidth;
        if (w > 0) {
          doc.rect(x, barY, w, barHeight).fill(seg.color);
          x += w;
        }
      }
      doc.y = barY + barHeight + 4;

      doc.fillColor('#666').text(
        `Critical: ${sys.pct_critical}%  |  Due Now: ${sys.pct_due_now}%  |  Upcoming: ${sys.pct_upcoming}%  |  OK: ${sys.pct_ok}%`
      );
      doc.text(`${sys.estimated_homes_needing_service} homes need service  |  Retail: $${sys.avg_cost_retail.toLocaleString()}  |  Group: $${sys.avg_cost_group.toLocaleString()}  |  Savings: $${sys.total_savings_potential.toLocaleString()}`);
      doc.moveDown(0.8);
    }

    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#0E7C7B').text(`Estimated Total Neighborhood Savings: $${forecast.estimated_total_savings.toLocaleString()}`, { align: 'center' });

    // Page 3: How it works
    doc.addPage();
    doc.fontSize(18).fillColor('#0F3460').text('How to Use This Report', { underline: true });
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#333');

    const steps = [
      '1. Identify which systems have the highest demand in this neighborhood.',
      '2. Use the data to craft targeted outreach — homeowners respond to specifics, not generic pitches.',
      '3. Reach out to homeowners or the HOA board with a data-backed proposal.',
      '4. Add this subdivision to your pipeline and track your progress through to close.',
    ];
    for (const step of steps) {
      doc.text(step, { lineGap: 4 });
      doc.moveDown(0.3);
    }

    doc.moveDown(1);
    doc.fontSize(14).fillColor('#0F3460').text('Next Steps');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333');
    doc.text('• Add this subdivision as a lead in your pipeline');
    doc.text('• Use the Marketing Hub to send a targeted email campaign');
    doc.text('• Create a project when you win the work');
    doc.text('• Track everything from lead to invoice in one place.');

    doc.moveDown(2);
    doc.fontSize(12).fillColor('#0E7C7B').text(process.env.BUSINESS_NAME || 'HomeSync', { align: 'center' });
    doc.fontSize(10).fillColor('#666');
    doc.text(process.env.OPERATOR_NAME || '', { align: 'center' });
    doc.text(process.env.OPERATOR_EMAIL || '', { align: 'center' });
    doc.text(process.env.OPERATOR_PHONE || '', { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
