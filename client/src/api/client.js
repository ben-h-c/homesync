import properties from '../demo-data/properties.json';
import subdivisions from '../demo-data/subdivisions.json';
import contacts from '../demo-data/contacts.json';
import projects from '../demo-data/projects.json';
import activities from '../demo-data/activities.json';
import dashboardStats from '../demo-data/dashboard-stats.json';
import maintenanceForecasts from '../demo-data/maintenance-forecasts.json';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

let _demoMode = false;
const demoListeners = new Set();

export function isDemoMode() { return _demoMode; }
export function onDemoModeChange(fn) { demoListeners.add(fn); return () => demoListeners.delete(fn); }

function setDemoMode(val) {
  if (_demoMode !== val) {
    _demoMode = val;
    demoListeners.forEach((fn) => fn(val));
  }
}

export async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;

    // Attach auth token if available
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers, ...options });

    // Handle 401 — session expired, redirect to login
    if (response.status === 401 && token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }

    // Handle 403 upgrade_required — let caller handle it
    if (response.status === 403) {
      const data = await response.json();
      if (data.error === 'upgrade_required' || data.error === 'view_limit_reached') {
        const err = new Error(data.message || 'Upgrade required');
        err.upgradeRequired = true;
        err.requiredTier = data.required_tier;
        err.currentTier = data.current_tier;
        throw err;
      }
      throw new Error(data.error || 'Forbidden');
    }

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    setDemoMode(false);
    return response.json();
  } catch (err) {
    if (err.upgradeRequired) throw err;
    console.warn(`[HomeSync] API failed (${API_BASE}${endpoint}):`, err.message, '→ using demo data');
    setDemoMode(true);
    return getDemoData(endpoint, options);
  }
}

function getDemoData(endpoint, options = {}) {
  const method = options.method || 'GET';

  // Handle email preview in demo mode (POST that should return rendered content)
  if (endpoint === '/emails/preview' && method === 'POST') {
    try {
      const body = JSON.parse(options.body || '{}');
      const vars = body.variables || {};
      const templateId = body.template_id;
      const demoTemplates = [
        { id: 1, name: 'cold_outreach', subject_template: '{{home_count}} homes in {{subdivision_name}} may need {{service_type}} service', body_html_template: '<p>Hi {{name}},</p><p>I specialize in {{service_type}} in the {{area}} area. {{subdivision_name}} has homes built around {{year_built}} that may benefit from service soon.</p><p>Best,<br/>{{contractor_name}}<br/>{{company_name}}</p>' },
        { id: 2, name: 'quote_follow_up', subject_template: 'Following up on your {{service_type}} quote', body_html_template: '<p>Hi {{name}},</p><p>Following up on the {{service_type}} quote I sent over. Happy to answer questions.</p><p>Best,<br/>{{contractor_name}}<br/>{{company_name}}</p>' },
      ];
      const t = demoTemplates.find((x) => x.id === templateId);
      if (t) {
        let subject = t.subject_template;
        let body_html = t.body_html_template;
        for (const [key, val] of Object.entries(vars)) {
          const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          subject = subject.replace(re, val ?? '');
          body_html = body_html.replace(re, val ?? '');
        }
        return { subject, body_html };
      }
    } catch {}
    return { subject: '', body_html: '' };
  }

  // Only serve demo data for GET requests
  if (method !== 'GET') return { success: true, message: 'Demo mode — changes not saved' };

  // Health
  if (endpoint === '/health') return { status: 'ok', message: 'Demo Mode', version: '1.0.0' };

  // Dashboard
  if (endpoint === '/reports/dashboard-stats') return dashboardStats;

  // Properties
  if (endpoint.startsWith('/properties/stats')) {
    const byYear = {};
    for (const p of properties) { if (p.year_built) byYear[p.year_built] = (byYear[p.year_built] || 0) + 1; }
    const byZip = {};
    for (const p of properties) { byZip[p.zip] = (byZip[p.zip] || 0) + 1; }
    return {
      total: properties.length,
      subdivisions: new Set(properties.map((p) => p.subdivision)).size,
      byZip: Object.entries(byZip).map(([zip, count]) => ({ zip, count })),
      byYear: Object.entries(byYear).map(([year_built, count]) => ({ year_built: parseInt(year_built), count })).sort((a, b) => a.year_built - b.year_built),
    };
  }
  if (endpoint.match(/^\/properties\/\d+$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    return properties.find((p) => p.id === id) || properties[0];
  }
  if (endpoint.startsWith('/properties')) {
    const url = new URL(`http://x${endpoint}`);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const sub = url.searchParams.get('subdivision') || '';
    let filtered = properties;
    if (search) filtered = filtered.filter((p) => (p.address + p.owner_name + p.subdivision).toLowerCase().includes(search.toLowerCase()));
    if (sub) filtered = filtered.filter((p) => p.subdivision === sub);
    return {
      data: filtered.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
    };
  }

  // Subdivisions
  if (endpoint.match(/^\/subdivisions\/\d+\/contacts$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    const sub = subdivisions.find((s) => s.id === id);
    return sub ? contacts.filter((c) => c.subdivision === sub.name) : [];
  }
  if (endpoint.match(/^\/subdivisions\/\d+\/timeline$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    return activities.filter((a) => a.subdivision_id === id).slice(0, 20);
  }
  if (endpoint.match(/^\/subdivisions\/\d+\/properties$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    const sub = subdivisions.find((s) => s.id === id);
    return sub ? properties.filter((p) => p.subdivision === sub.name) : [];
  }
  if (endpoint.match(/^\/subdivisions\/\d+$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    return subdivisions.find((s) => s.id === id) || subdivisions[0];
  }
  if (endpoint.startsWith('/subdivisions')) return subdivisions;

  // Maintenance
  if (endpoint.match(/^\/maintenance\/forecast\/\d+$/)) {
    const id = endpoint.split('/').pop();
    return maintenanceForecasts[id] || Object.values(maintenanceForecasts)[0];
  }
  if (endpoint === '/maintenance/rules') {
    return [
      { id: 1, system_name: 'hvac', display_name: 'HVAC System', avg_lifespan_years: 15, warning_years_before: 2, critical_years_after: 2, avg_replacement_cost_low: 4000, avg_replacement_cost_high: 8000, group_discount_typical: 0.30, is_recurring: false },
      { id: 2, system_name: 'water_heater', display_name: 'Water Heater', avg_lifespan_years: 10, warning_years_before: 2, critical_years_after: 2, avg_replacement_cost_low: 1200, avg_replacement_cost_high: 2500, group_discount_typical: 0.35, is_recurring: false },
      { id: 3, system_name: 'roof', display_name: 'Roof (Asphalt Shingle)', avg_lifespan_years: 25, warning_years_before: 3, critical_years_after: 2, avg_replacement_cost_low: 8000, avg_replacement_cost_high: 20000, group_discount_typical: 0.25, is_recurring: false },
      { id: 4, system_name: 'exterior_paint', display_name: 'Exterior Paint', avg_lifespan_years: 8, warning_years_before: 1, critical_years_after: 2, avg_replacement_cost_low: 3000, avg_replacement_cost_high: 6000, group_discount_typical: 0.30, is_recurring: false },
    ];
  }
  if (endpoint === '/maintenance/hot-list') return [...subdivisions].sort((a, b) => (b.maintenance_urgency_score || 0) - (a.maintenance_urgency_score || 0)).slice(0, 10);

  // Contacts
  if (endpoint.match(/^\/contacts\/search/)) return contacts.slice(0, 5);
  if (endpoint.match(/^\/contacts\/\d+$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    return contacts.find((c) => c.id === id) || contacts[0];
  }
  if (endpoint.startsWith('/contacts')) {
    const url = new URL(`http://x${endpoint}`);
    const type = url.searchParams.get('type');
    let filtered = contacts;
    if (type) filtered = filtered.filter((c) => c.type === type);
    return filtered;
  }

  // Activities
  if (endpoint.startsWith('/activities/recent') || endpoint.startsWith('/activities')) {
    return activities.slice(0, 10);
  }

  // Projects
  if (endpoint.match(/^\/projects\/stats$/)) {
    return { total: projects.length, active: 1, total_revenue: 225, total_homes_signed_up: 27 };
  }
  if (endpoint.match(/^\/projects\/\d+\/signups$/)) return [];
  if (endpoint.match(/^\/projects\/\d+$/)) {
    const id = parseInt(endpoint.split('/')[2]);
    return projects.find((p) => p.id === id) || projects[0];
  }
  if (endpoint.startsWith('/projects')) return projects;

  // Emails
  if (endpoint === '/emails/templates') {
    return [
      { id: 1, name: 'cold_outreach', category: 'marketing', description: 'First contact to a potential lead', subject_template: '{{home_count}} homes in {{subdivision_name}} may need {{service_type}} service', body_html_template: '<p>Hi {{name}},</p><p>I specialize in {{service_type}} in the {{area}} area.</p>' },
      { id: 2, name: 'quote_follow_up', category: 'marketing', description: 'Follow-up after sending a quote', subject_template: 'Following up on your {{service_type}} quote', body_html_template: '<p>Hi {{name}},</p><p>Following up on the quote I sent.</p>' },
      { id: 3, name: 'seasonal_reminder', category: 'marketing', description: 'Seasonal maintenance reminder', subject_template: '{{season}} is here — time for {{service_type}} maintenance', body_html_template: '<p>Hi {{name}},</p><p>{{season}} is here — time for maintenance.</p>' },
      { id: 4, name: 'project_thank_you', category: 'marketing', description: 'Thank you after project completion', subject_template: 'Thank you for choosing {{company_name}}!', body_html_template: '<p>Hi {{name}},</p><p>Thank you for trusting us!</p>' },
      { id: 5, name: 'referral_request', category: 'marketing', description: 'Ask for referrals', subject_template: 'Know someone who needs a great {{service_type}} contractor?', body_html_template: '<p>Hi {{name}},</p><p>Would you refer us?</p>' },
    ];
  }
  if (endpoint.startsWith('/emails/sent')) return { data: [], pagination: { page: 1, limit: 50, total: 0 } };

  // Import
  if (endpoint === '/import/preview') return { headers: [], previewRows: [], suggestedMappings: {}, totalRows: 0 };

  return {};
}
