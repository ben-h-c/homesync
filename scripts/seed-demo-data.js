#!/usr/bin/env node
/**
 * Seed rich demo data for screenshots and demos.
 * Run: node scripts/seed-demo-data.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const db = require('../server/db');

async function seed() {
  console.log('Seeding demo data...');

  // Get or create a demo contractor user
  let user = await db('users').where('role', 'admin').first();
  if (!user) {
    const bcrypt = require('bcryptjs');
    const [id] = await db('users').insert({
      email: 'demo@homesynctoday.com', password_hash: bcrypt.hashSync('demo1234', 12),
      first_name: 'Ben', last_name: 'Cody', company_name: 'Cody Home Services',
      phone: '(770) 555-0142', role: 'admin', subscription_tier: 'enterprise',
      subscription_status: 'active', trade_category: 'General Contractor',
      zip_code: '30004', metro_areas: '["atlanta"]',
      address: '123 Main St', city: 'Alpharetta', state: 'GA',
    });
    user = await db('users').where('id', id).first();
  }
  // Update company info if missing
  if (!user.company_name) {
    await db('users').where('id', user.id).update({ company_name: 'Cody Home Services', phone: '(770) 555-0142', trade_category: 'General Contractor' });
  }
  const userId = user.id;

  // ── Leads ──
  // Get some real subdivision IDs for linking leads
  const subs = await db('subdivisions').whereNotNull('latitude').orderBy('maintenance_urgency_score', 'desc').limit(12);
  const existingLeads = await db('contractor_leads').where('user_id', userId).count('* as c').then(r => r[0].c);
  if (existingLeads < 5 && subs.length > 0) {
    console.log('Creating leads...');
    const leads = [
      { subdivision_id: subs[0]?.id, service_type: 'Roofing', stage: 'new', estimated_value: 48000, estimated_homes: 40, notes: 'High-urgency neighborhood. 40+ homes with 20-year-old roofs. Great opportunity for door-to-door outreach.' },
      { subdivision_id: subs[1]?.id, service_type: 'HVAC', stage: 'contacted', estimated_value: 8500, estimated_homes: 1, notes: 'Has 15-year-old Carrier system. Wants quote for replacement.' },
      { subdivision_id: subs[2]?.id, service_type: 'Painting', stage: 'quoted', estimated_value: 6800, estimated_homes: 1, notes: 'Exterior repaint, 3200 sqft colonial. Sent quote $6,800.' },
      { subdivision_id: subs[3]?.id, service_type: 'Plumbing', stage: 'negotiating', estimated_value: 12000, estimated_homes: 1, notes: 'Whole-house repipe. Comparing with 2 other contractors.' },
      { subdivision_id: subs[4]?.id, service_type: 'Roofing', stage: 'won', estimated_value: 96000, estimated_homes: 8, notes: 'Signed contract for 8 homes. Starting next month.', won_date: daysAgo(10) },
      { subdivision_id: subs[5]?.id, service_type: 'HVAC', stage: 'new', estimated_value: 450, estimated_homes: 1, notes: 'Referred by neighbor. Needs full system tune-up.' },
      { subdivision_id: subs[6]?.id, service_type: 'Roofing', stage: 'contacted', estimated_value: 62500, estimated_homes: 25, notes: 'Board president. Wants to discuss bulk pricing for 25 homes.' },
      { subdivision_id: subs[7]?.id, service_type: 'Painting', stage: 'new', estimated_value: 3200, estimated_homes: 1, notes: 'Interior paint, 4 bedrooms + living room. Move-in ready by March.' },
      { subdivision_id: subs[8]?.id, service_type: 'HVAC', stage: 'quoted', estimated_value: 14200, estimated_homes: 1, notes: 'Dual zone system. Sent quote for $14,200 installed.' },
      { subdivision_id: subs[9]?.id, service_type: 'Plumbing', stage: 'lost', estimated_value: 4500, estimated_homes: 1, notes: 'Went with cheaper competitor. Follow up in 6 months.', lost_reason: 'Price too high' },
      { subdivision_id: subs[10]?.id, service_type: 'Electrical', stage: 'new', estimated_value: 2800, estimated_homes: 1, notes: 'Panel upgrade from 100A to 200A. Old Forsyth County home.' },
      { subdivision_id: subs[11]?.id, service_type: 'Roofing', stage: 'contacted', estimated_value: 15000, estimated_homes: 1, notes: 'Storm damage assessment needed. Insurance claim in progress.' },
    ];
    for (const lead of leads) {
      if (lead.subdivision_id) {
        await db('contractor_leads').insert({ ...lead, user_id: userId, created_at: randomDate(60) });
      }
    }
  }

  // ── Jobs/Projects ──
  const existingJobs = await db('contractor_jobs').where('user_id', userId).count('* as c').then(r => r[0].c);
  if (existingJobs < 5) {
    console.log('Creating jobs...');
    const jobs = [
      { title: 'Creekstone Estates — Roof Replacement (Phase 1)', status: 'in_progress', service_type: 'Roofing', client_name: 'Sarah Mitchell', client_email: 'sarah.m@email.com', client_phone: '(770) 555-1001', description: 'Group roof replacement for 12 homes in Creekstone Estates. Architectural shingles, 30-year warranty.', estimated_cost: 144000, start_date: '2026-03-15', end_date: '2026-05-01' },
      { title: 'Park Residence — Full HVAC Replacement', status: 'in_progress', service_type: 'HVAC', client_name: 'Jennifer Park', client_email: 'jpark@email.com', client_phone: '(770) 555-1005', description: 'Replace 15-year Trane system with new Carrier Infinity 2-stage. Include ductwork inspection.', estimated_cost: 12500, start_date: '2026-03-20', end_date: '2026-03-25' },
      { title: 'Rodriguez Home — Exterior Paint', status: 'pending', service_type: 'Painting', client_name: 'Maria Rodriguez', client_email: 'maria.r@email.com', client_phone: '(770) 555-1003', description: 'Full exterior repaint. Sherwin-Williams Duration. Pressure wash, scrape, prime, 2 coats.', estimated_cost: 6800, start_date: '2026-04-10', end_date: '2026-04-18' },
      { title: 'Thompson Residence — Whole House Repipe', status: 'pending', service_type: 'Plumbing', client_name: 'David Thompson', client_email: 'dthompson@email.com', client_phone: '(770) 555-1004', description: 'Replace all polybutylene piping with PEX. 2800 sqft, 3.5 bath home.', estimated_cost: 12000, start_date: '2026-04-15', end_date: '2026-04-22' },
      { title: 'Windermere — Roof Inspections', status: 'completed', service_type: 'Roofing', client_name: 'Jennifer Park', client_email: 'jpark@email.com', client_phone: '(770) 555-1005', description: 'Free roof inspections for 8 homes. Generated 6 paid contracts.', estimated_cost: 0, start_date: '2026-02-01', end_date: '2026-02-15' },
      { title: 'Foster Home — Dual Zone HVAC Install', status: 'completed', service_type: 'HVAC', client_name: 'Amanda Foster', client_email: 'afoster@email.com', client_phone: '(770) 555-1009', description: 'New Lennox dual zone system. 2 condensers, variable speed handlers.', estimated_cost: 14200, start_date: '2026-01-10', end_date: '2026-01-18' },
      { title: 'Bethany Oaks — Gutter Replacement', status: 'in_progress', service_type: 'General Contractor', client_name: 'Lisa Anderson', client_email: 'lisa.a@email.com', client_phone: '(770) 555-1007', description: 'Seamless aluminum gutters for 10 homes. Include leaf guards.', estimated_cost: 35000, start_date: '2026-03-25', end_date: '2026-04-15' },
    ];
    for (const job of jobs) {
      const [jobId] = await db('contractor_jobs').insert({ ...job, user_id: userId, created_at: randomDate(90) });
      // Add activities
      await db('job_activities').insert([
        { job_id: jobId, user_id: userId, type: 'status_change', description: `Project created — ${job.status}`, created_at: randomDate(60) },
        { job_id: jobId, user_id: userId, type: 'note', description: 'Initial client consultation completed.', created_at: randomDate(45) },
      ]);
    }
  }

  // ── Invoices ──
  const existingInvoices = await db('invoices').where('user_id', userId).count('* as c').then(r => r[0].c);
  if (existingInvoices < 5) {
    console.log('Creating invoices...');
    const invoices = [
      { invoice_number: 'INV-2026-010', customer_name: 'Sarah Mitchell', customer_email: 'sarah.m@email.com', status: 'paid', total: 36000, subtotal: 36000, tax_rate: 0, tax_amount: 0, issue_date: '2026-02-15', due_date: '2026-03-15', paid_at: '2026-03-10', payment_method: 'bank_transfer', payment_terms: 'net_30', notes: 'Phase 1 deposit — 4 homes completed' },
      { invoice_number: 'INV-2026-011', customer_name: 'Jennifer Park', customer_email: 'jpark@email.com', status: 'paid', total: 12500, subtotal: 12500, tax_rate: 0, tax_amount: 0, issue_date: '2026-03-25', due_date: '2026-04-10', paid_at: '2026-04-02', payment_method: 'card', payment_terms: 'net_15', notes: 'Full HVAC replacement — paid in full' },
      { invoice_number: 'INV-2026-012', customer_name: 'Amanda Foster', customer_email: 'afoster@email.com', status: 'paid', total: 14200, subtotal: 14200, tax_rate: 0, tax_amount: 0, issue_date: '2026-01-18', due_date: '2026-02-01', paid_at: '2026-01-28', payment_method: 'check', payment_terms: 'net_15' },
      { invoice_number: 'INV-2026-013', customer_name: 'Sarah Mitchell', customer_email: 'sarah.m@email.com', status: 'sent', total: 72000, subtotal: 72000, tax_rate: 0, tax_amount: 0, issue_date: '2026-04-01', due_date: '2026-05-01', sent_at: '2026-04-01', payment_terms: 'net_30', notes: 'Phase 1 balance — remaining 8 homes' },
      { invoice_number: 'INV-2026-014', customer_name: 'Maria Rodriguez', customer_email: 'maria.r@email.com', status: 'draft', total: 6800, subtotal: 6120, tax_rate: 0.07, tax_amount: 428.40, discount_amount: 0, issue_date: '2026-04-03', due_date: '2026-04-18', payment_terms: 'net_15', notes: 'Exterior paint — deposit due before start' },
      { invoice_number: 'INV-2026-015', customer_name: 'Lisa Anderson', customer_email: 'lisa.a@email.com', status: 'sent', total: 17500, subtotal: 17500, tax_rate: 0, tax_amount: 0, issue_date: '2026-03-28', due_date: '2026-04-28', sent_at: '2026-03-28', payment_terms: 'net_30', notes: 'Bethany Oaks gutters — 50% upfront' },
      { invoice_number: 'INV-2026-016', customer_name: 'David Thompson', customer_email: 'dthompson@email.com', status: 'overdue', total: 6000, subtotal: 6000, tax_rate: 0, tax_amount: 0, issue_date: '2026-02-20', due_date: '2026-03-06', sent_at: '2026-02-20', payment_terms: 'net_15', notes: 'Repipe deposit — past due, follow up' },
    ];
    for (const inv of invoices) {
      const [invId] = await db('invoices').insert({ ...inv, user_id: userId, amount_paid: inv.status === 'paid' ? inv.total : 0, created_at: inv.issue_date });
      // Add line items
      if (inv.invoice_number === 'INV-2026-010') {
        await db('invoice_line_items').insert([
          { invoice_id: invId, service: 'Roof Replacement', description: 'Architectural shingles, 30-yr warranty — 4 homes', quantity: 4, unit_price: 9000, amount: 36000, sort_order: 1 },
        ]);
      } else if (inv.invoice_number === 'INV-2026-014') {
        await db('invoice_line_items').insert([
          { invoice_id: invId, service: 'Pressure Washing', description: 'Full exterior pressure wash prep', quantity: 1, unit_price: 620, amount: 620, sort_order: 1 },
          { invoice_id: invId, service: 'Exterior Paint', description: 'Sherwin-Williams Duration, 2 coats', quantity: 1, unit_price: 4800, amount: 4800, sort_order: 2 },
          { invoice_id: invId, service: 'Trim & Detail', description: 'Window trim, shutters, doors', quantity: 1, unit_price: 700, amount: 700, sort_order: 3 },
        ]);
      }
      // Status history
      await db('invoice_status_history').insert({ invoice_id: invId, from_status: 'draft', to_status: inv.status, note: 'Created', created_at: inv.issue_date });
    }
  }

  // ── Change Orders ──
  const jobs = await db('contractor_jobs').where('user_id', userId);
  if (jobs.length > 0) {
    const existingCOs = await db('change_orders').whereIn('job_id', jobs.map(j=>j.id)).count('* as c').then(r=>r[0].c);
    if (existingCOs < 2) {
      console.log('Creating change orders...');
      await db('change_orders').insert([
        { job_id: jobs[0].id, user_id: userId, change_order_number: 'CO-01', description: 'Add ridge vent to 4 homes — client requested improved attic ventilation during roof replacement.', reason: 'Client request', cost_impact: 2400, status: 'approved', client_response: 'approved', approved_by: 'Sarah Mitchell', approved_at: randomDate(15), created_at: randomDate(30) },
        { job_id: jobs[0].id, user_id: userId, change_order_number: 'CO-02', description: 'Upgrade to impact-resistant shingles on 2 corner lot homes.', reason: 'Client upgrade request', cost_impact: 3200, status: 'proposed', created_at: randomDate(5) },
      ]);
    }
  }

  // ── Messages ──
  if (jobs.length > 0) {
    const existingMsgs = await db('client_messages').count('* as c').then(r => r[0].c);
    if (existingMsgs < 5) {
      console.log('Creating messages...');
      const msgJob = jobs[0];
      await db('client_messages').insert([
        { job_id: msgJob.id, sender_type: 'client', sender_name: 'Sarah Mitchell', message: 'Hi! Just wanted to check — are we still on track for starting next Monday?', created_at: daysAgo(3) },
        { job_id: msgJob.id, sender_type: 'contractor', sender_name: 'Cody Home Services', message: 'Absolutely! The crew will be there at 8am Monday. We\'ll start with the first 4 homes on Lanier Springs Dr.', created_at: daysAgo(3, 2) },
        { job_id: msgJob.id, sender_type: 'client', sender_name: 'Sarah Mitchell', message: 'Perfect. A few neighbors asked if you could avoid parking on the grass. The community is pretty particular about that.', created_at: daysAgo(2) },
        { job_id: msgJob.id, sender_type: 'contractor', sender_name: 'Cody Home Services', message: 'Of course — we always park on driveways and street. I\'ll remind the crew. Also, I sent over change order CO-02 for the impact-resistant shingle upgrade. Let me know if you have questions.', created_at: daysAgo(2, 1) },
        { job_id: msgJob.id, sender_type: 'client', sender_name: 'Sarah Mitchell', message: 'Got it, I\'ll review and get back to you by end of day. Thanks for being so responsive!', created_at: daysAgo(1) },
      ]);
      if (jobs.length > 1) {
        await db('client_messages').insert([
          { job_id: jobs[1].id, sender_type: 'client', sender_name: 'Jennifer Park', message: 'The new system is working great! House has never been this comfortable. Thank you!', created_at: daysAgo(5) },
          { job_id: jobs[1].id, sender_type: 'contractor', sender_name: 'Cody Home Services', message: 'So glad to hear that! Remember to change the filter every 3 months. I\'ll send you a reminder. If you know anyone who needs HVAC work, we\'d appreciate a referral!', created_at: daysAgo(5, 1) },
        ]);
      }
    }
  }

  // ── Notifications ──
  const existingNotifs = await db('notifications').where('user_id', userId).count('* as c').then(r => r[0].c);
  if (existingNotifs < 3) {
    console.log('Creating notifications...');
    await db('notifications').insert([
      { user_id: userId, type: 'client_message', title: 'New message from Sarah Mitchell', message: 'Sarah Mitchell sent a message on "Creekstone Estates — Roof Replacement"', link: '/messages?job=1', created_at: daysAgo(1) },
      { user_id: userId, type: 'invoice_paid', title: 'Invoice INV-2026-002 paid!', message: 'Jennifer Park paid $12,500 on invoice INV-2026-002.', link: '/invoices/2', created_at: daysAgo(2) },
      { user_id: userId, type: 'change_order_response', title: 'Change order CO-01 approved', message: 'Sarah Mitchell approved change order CO-01 on "Creekstone Estates — Roof Replacement".', link: '/jobs/1', created_at: daysAgo(3) },
      { user_id: userId, type: 'portal_accessed', title: 'Jennifer Park viewed their portal', message: 'Jennifer Park accessed the client portal for "Park Residence — Full HVAC Replacement".', link: '/jobs/2', created_at: daysAgo(4) },
      { user_id: userId, type: 'invoice_viewed', title: 'Invoice INV-2026-004 viewed', message: 'Sarah Mitchell viewed invoice INV-2026-004.', link: '/invoices/4', created_at: daysAgo(1, 3) },
    ]);
  }

  // ── Campaigns ──
  const existingCampaigns = await db('campaigns').where('user_id', userId).count('* as c').then(r => r[0].c);
  if (existingCampaigns < 2) {
    console.log('Creating campaigns...');
    const [c1] = await db('campaigns').insert({
      user_id: userId, name: 'Spring Roofing Season Kickoff', subject: 'Is your roof ready for spring storms?',
      body_html: '<p>Hi {{name}},</p><p>Spring storm season is approaching. Homes built before 2005 in your area may be due for a roof inspection.</p><p>We\'re offering <strong>free inspections</strong> this month. Reply to schedule yours.</p>',
      status: 'sent', sent_at: daysAgo(14), total_recipients: 45, total_sent: 43, total_opened: 18, total_clicked: 7,
      created_at: daysAgo(15),
    });
    await db('campaigns').insert({
      user_id: userId, name: 'HVAC Summer Prep', subject: '{{name}}, is your AC ready for Georgia summer?',
      body_html: '<p>Hi {{name}},</p><p>Georgia summers are brutal. A tune-up now prevents expensive emergency repairs in July.</p><p>Book your pre-season tune-up: <strong>$149</strong> (regular $249).</p>',
      status: 'draft', total_recipients: 0,
      created_at: daysAgo(2),
    });
  }

  console.log('Demo data seeded successfully!');

  // Print summary
  const counts = await Promise.all([
    db('contractor_leads').where('user_id', userId).count('* as c').then(r => r[0].c),
    db('contractor_jobs').where('user_id', userId).count('* as c').then(r => r[0].c),
    db('invoices').where('user_id', userId).count('* as c').then(r => r[0].c),
    db('client_messages').count('* as c').then(r => r[0].c),
    db('notifications').where('user_id', userId).count('* as c').then(r => r[0].c),
    db('campaigns').where('user_id', userId).count('* as c').then(r => r[0].c),
  ]);
  console.log(`Leads: ${counts[0]}, Jobs: ${counts[1]}, Invoices: ${counts[2]}, Messages: ${counts[3]}, Notifications: ${counts[4]}, Campaigns: ${counts[5]}`);

  process.exit(0);
}

function randomDate(daysBack, hoursOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(d.getHours() - hoursOffset);
  return d.toISOString();
}

function daysAgo(days, hoursExtra = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursExtra);
  return d.toISOString();
}

seed().catch(err => { console.error(err); process.exit(1); });
