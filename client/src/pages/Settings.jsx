import { useState, useEffect } from 'react';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import {
  Save, User, Building, CreditCard, Users, Bell, Download,
  Shield, Check, Lock, Plus, Trash2, Mail, ChevronRight,
} from 'lucide-react';

const TRADES = ['Roofing', 'Painting', 'HVAC', 'Plumbing', 'Electrical', 'Garage Doors', 'Pressure Washing', 'Landscaping', 'General Contractor', 'Other'];
const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'subscription', label: 'Subscription', icon: CreditCard },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'export', label: 'Data Export', icon: Download },
];

// ── Profile Tab ──
function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    fetchAPI('/auth/me').then((u) => setForm({
      first_name: u.first_name || '', last_name: u.last_name || '', company_name: u.company_name || '',
      email: u.email || '', phone: u.phone || '', address: u.address || '',
      city: u.city || '', state: u.state || 'GA', zip_code: u.zip_code || '',
      trade_category: u.trade_category || '', tagline: u.tagline || '',
      business_description: u.business_description || '', license_number: u.license_number || '',
      default_tax_rate: u.default_tax_rate || 0, payment_terms: u.payment_terms || 'Net 30',
    })).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetchAPI('/auth/me', { method: 'PUT', body: JSON.stringify(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Update local user
      const updated = await fetchAPI('/auth/me');
      localStorage.setItem('user', JSON.stringify(updated));
      useAuthStore.setState({ user: updated });
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    try {
      await fetchAPI('/auth/change-password', {
        method: 'POST', body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      setPwMsg('Password updated!');
      setPwForm({ current: '', newPw: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) { setPwMsg(err.message); }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-6 max-w-3xl">
      {saved && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2"><Check size={16} /> Profile saved!</div>}

      {/* Business Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Business Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Business Name</label>
              <input value={form.company_name || ''} onChange={set('company_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trade / Specialty</label>
              <select value={form.trade_category || ''} onChange={set('trade_category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Select trade</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tagline</label>
            <input value={form.tagline || ''} onChange={set('tagline')} placeholder="Your business motto or specialty description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Business Description</label>
            <textarea value={form.business_description || ''} onChange={set('business_description')} rows={2}
              placeholder="Brief description of your services..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">License #</label>
              <input value={form.license_number || ''} onChange={set('license_number')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Default Tax Rate</label>
              <input type="number" step="0.001" value={form.default_tax_rate || 0} onChange={set('default_tax_rate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
              <select value={form.payment_terms || 'Net 30'} onChange={set('payment_terms')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Due on Receipt</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First Name</label>
              <input value={form.first_name || ''} onChange={set('first_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last Name</label>
              <input value={form.last_name || ''} onChange={set('last_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={set('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input type="tel" value={form.phone || ''} onChange={set('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input value={form.address || ''} onChange={set('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input value={form.city || ''} onChange={set('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <input value={form.state || ''} onChange={set('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ZIP</label>
              <input value={form.zip_code || ''} onChange={set('zip_code')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={saveProfile} disabled={saving}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
        <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {/* Password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Change Password</h2>
        {pwMsg && <p className={`text-sm mb-3 ${pwMsg.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            placeholder="Current password" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
            placeholder="New password (8+ chars)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <button onClick={changePassword} disabled={!pwForm.current || pwForm.newPw.length < 8}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
          Update Password
        </button>
      </div>
    </div>
  );
}

// ── Subscription Tab ──
function SubscriptionTab() {
  const user = useAuthStore((s) => s.user);
  const tier = user?.subscription_tier || 'starter';
  const [upgrading, setUpgrading] = useState(null);
  const [managingBilling, setManagingBilling] = useState(false);

  const tiers = [
    {
      key: 'starter', name: 'Starter', price: '$49', period: '/mo', priceEnv: 'starter',
      features: ['25 subdivision views/month', 'Basic pipeline', 'Invoice creation (5/mo)', '5 AI generations/mo', '1 user', 'Email support'],
    },
    {
      key: 'pro', name: 'Professional', price: '$149', period: '/mo', popular: true, priceEnv: 'pro',
      features: ['Unlimited subdivision views', 'Full pipeline + drag-drop', 'Unlimited invoices + PDF', '25 AI generations/mo', 'Email campaigns', 'Client portal', 'Marketing plan generator', 'Up to 5 users', 'Priority support'],
    },
    {
      key: 'enterprise', name: 'Business', price: '$299', period: '/mo', priceEnv: 'enterprise',
      features: ['Everything in Pro', 'Unlimited AI generations', 'Multi-market access', 'API access', 'Custom branding', 'Unlimited users', 'Dedicated account manager'],
    },
  ];

  const handleUpgrade = async (tierKey) => {
    setUpgrading(tierKey);
    try {
      const data = await fetchAPI('/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ price_id: tierKey }),
      });
      if (data?.url) window.location.href = data.url;
      else alert('Unable to start checkout. Please try again.');
    } catch (err) {
      alert(err.message || 'Checkout failed');
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const data = await fetchAPI('/billing/portal-session', { method: 'POST' });
      if (data?.url) window.location.href = data.url;
      else alert('Unable to open billing portal.');
    } catch (err) {
      alert(err.message || 'Failed to open billing portal');
    } finally {
      setManagingBilling(false);
    }
  };

  const trialDaysLeft = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Current Plan</h2>
            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{tier}</p>
            {user?.subscription_status === 'trialing' ? (
              <p className="text-sm text-amber-600 font-medium">
                Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </p>
            ) : (
              <p className="text-sm text-gray-500 capitalize">{user?.subscription_status || 'Active'}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${tier === 'enterprise' ? 'bg-purple-100 text-purple-700' : tier === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {tier}
            </span>
            {user?.stripe_customer_id && (
              <button onClick={handleManageBilling} disabled={managingBilling}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {managingBilling ? 'Opening...' : 'Manage Billing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div key={t.key} className={`bg-white rounded-xl border-2 p-6 ${tier === t.key ? 'border-primary shadow-md' : 'border-gray-100'} ${t.popular ? 'relative' : ''}`}>
            {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
            <h3 className="font-bold text-gray-900">{t.name}</h3>
            <p className="mt-1"><span className="text-3xl font-bold">{t.price}</span><span className="text-gray-500">{t.period}</span></p>
            <ul className="mt-4 space-y-2">
              {t.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-primary mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => tier !== t.key && handleUpgrade(t.priceEnv)}
              disabled={tier === t.key || upgrading === t.priceEnv}
              className={`w-full mt-4 py-2 rounded-lg text-sm font-medium ${tier === t.key ? 'bg-gray-100 text-gray-500 cursor-default' : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'}`}>
              {tier === t.key ? 'Current Plan' : upgrading === t.priceEnv ? 'Redirecting...' : `Upgrade to ${t.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Team Tab ──
function TeamTab() {
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const hasPro = effectiveTier !== 'starter';

  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('technician');

  useEffect(() => { fetchAPI('/settings/team').then(setInvites).catch(() => {}); }, []);

  const invite = async () => {
    if (!email) return;
    await fetchAPI('/settings/team/invite', { method: 'POST', body: JSON.stringify({ email, role }) });
    setEmail('');
    fetchAPI('/settings/team').then(setInvites);
  };

  const revoke = async (id) => {
    await fetchAPI(`/settings/team/${id}`, { method: 'DELETE' });
    fetchAPI('/settings/team').then(setInvites);
  };

  if (!hasPro) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <Lock size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">Team management requires Pro or Enterprise</p>
        <p className="text-sm text-gray-400 mt-1">Upgrade to invite team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Invite */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Invite Team Member</h2>
        <div className="flex gap-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="technician">Technician</option>
          </select>
          <button onClick={invite} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            <Plus size={14} className="inline mr-1" /> Invite
          </button>
        </div>
      </div>

      {/* Team list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Team Members</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-400">No team members invited yet.</p>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{inv.role} &middot; {inv.status}</p>
                </div>
                {inv.status === 'pending' && (
                  <button onClick={() => revoke(inv.id)} className="text-xs text-red-500 hover:underline">Revoke</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roles explanation */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Role Permissions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2"><Shield size={14} className="text-red-500 mt-0.5 shrink-0" /><div><span className="font-medium">Admin</span> — Full access including billing and team management</div></div>
          <div className="flex items-start gap-2"><Shield size={14} className="text-amber-500 mt-0.5 shrink-0" /><div><span className="font-medium">Manager</span> — All features except billing. Can manage projects and leads.</div></div>
          <div className="flex items-start gap-2"><Shield size={14} className="text-blue-500 mt-0.5 shrink-0" /><div><span className="font-medium">Technician</span> — View assigned projects and update job progress only.</div></div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications Tab ──
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    notification_new_leads: 'true',
    notification_invoice_payments: 'true',
    notification_client_messages: 'true',
    notification_project_updates: 'true',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAPI('/auth/me').then((u) => setPrefs({
      notification_new_leads: u.notification_new_leads || 'true',
      notification_invoice_payments: u.notification_invoice_payments || 'true',
      notification_client_messages: u.notification_client_messages || 'true',
      notification_project_updates: u.notification_project_updates || 'true',
    })).catch(() => {});
  }, []);

  const save = async () => {
    await fetchAPI('/auth/me', { method: 'PUT', body: JSON.stringify(prefs) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key) => setPrefs({ ...prefs, [key]: prefs[key] === 'true' ? 'false' : 'true' });

  const notifs = [
    { key: 'notification_new_leads', label: 'New Leads', desc: 'Get notified when new opportunities match your trade and area' },
    { key: 'notification_invoice_payments', label: 'Invoice Payments', desc: 'Get notified when a client views or pays an invoice' },
    { key: 'notification_client_messages', label: 'Client Messages', desc: 'Get notified when a client sends a message through the portal' },
    { key: 'notification_project_updates', label: 'Project Updates', desc: 'Get notified about project status changes and milestones' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {saved && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2"><Check size={16} /> Preferences saved!</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Email Notifications</h2>
        <div className="space-y-4">
          {notifs.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{n.label}</p>
                <p className="text-xs text-gray-500">{n.desc}</p>
              </div>
              <button onClick={() => toggle(n.key)}
                className={`w-12 h-6 rounded-full transition-colors ${prefs[n.key] === 'true' ? 'bg-primary' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${prefs[n.key] === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={save} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          <Save size={14} className="inline mr-1" /> Save Preferences
        </button>
      </div>
    </div>
  );
}

// ── Export Tab ──
function ExportTab() {
  const downloadExport = async (type) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/settings/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const exports = [
    { type: 'projects', label: 'Projects', desc: 'All projects with client info, status, dates, and financials' },
    { type: 'invoices', label: 'Invoices', desc: 'All invoices with amounts, status, and payment details' },
    { type: 'leads', label: 'Leads', desc: 'All leads with subdivision, stage, value, and notes' },
    { type: 'clients', label: 'Clients', desc: 'Unique client contact information from your projects' },
  ];

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Export Data as CSV</h2>
        <div className="space-y-3">
          {exports.map((exp) => (
            <div key={exp.type} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{exp.label}</p>
                <p className="text-xs text-gray-500">{exp.desc}</p>
              </div>
              <button onClick={() => downloadExport(exp.type)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                <Download size={12} /> Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ──
export default function Settings() {
  const [tab, setTab] = useState('profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 max-w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'subscription' && <SubscriptionTab />}
      {tab === 'team' && <TeamTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'export' && <ExportTab />}
    </div>
  );
}
