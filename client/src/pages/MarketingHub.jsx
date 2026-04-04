import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import {
  Mail, FileText, Megaphone, Target, Plus, Send, Clock, CheckCircle,
  BarChart3, ArrowRight, ChevronDown, Sparkles, Users, Calendar, X,
} from 'lucide-react';

const TABS = [
  { key: 'compose', label: 'Compose', icon: Mail },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'plan', label: 'Marketing Plan', icon: Target },
  { key: 'sent', label: 'Sent', icon: CheckCircle },
];

// ── Compose Tab ──
function ComposeTab() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSubdivision, setAiSubdivision] = useState('');
  const [aiServiceType, setAiServiceType] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiCredits, setAiCredits] = useState(null);

  useEffect(() => {
    fetchAPI('/emails/templates').then(setTemplates).catch(() => {});
    fetchAPI('/subdivisions?has_coords=true').then((d) => setSubdivisions(Array.isArray(d) ? d : [])).catch(() => {});
    fetchAPI('/ai/credits').then(setAiCredits).catch(() => {});
  }, []);

  const loadTemplate = (id) => {
    setSelectedTemplate(id);
    const t = templates.find((t) => String(t.id) === String(id));
    if (t) { setSubject(t.subject_template); setBody(t.body_html_template); }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const data = await fetchAPI('/ai/generate-email', {
        method: 'POST',
        body: JSON.stringify({
          subdivision_id: aiSubdivision || null,
          service_type: aiServiceType || null,
          tone: aiTone,
        }),
      });
      if (data.subject) setSubject(data.subject);
      if (data.body_html) setBody(data.body_html);
      if (data.credits_remaining !== undefined) setAiCredits((prev) => ({ ...prev, credits_remaining: data.credits_remaining }));
      setShowAiPanel(false);
    } catch (err) {
      alert(err.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!to || !subject) return;
    setSending(true);
    try {
      await fetchAPI('/emails/send', {
        method: 'POST',
        body: JSON.stringify({ to_email: to, subject, body_html: body, template_used: selectedTemplate || null }),
      });
      setSent(true);
      setTimeout(() => { setTo(''); setSubject(''); setBody(''); setSent(false); }, 2000);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-3xl space-y-4">
      {sent && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Email sent successfully!</div>}

      {/* AI Assist Panel */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/20 rounded-xl p-4">
        <button onClick={() => setShowAiPanel(!showAiPanel)} className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles size={16} /> AI Email Assistant
          {aiCredits && aiCredits.credits_remaining >= 0 && (
            <span className="text-xs text-gray-500 font-normal ml-2">({aiCredits.credits_remaining} generations left this month)</span>
          )}
          <ChevronDown size={14} className={`ml-auto transition-transform ${showAiPanel ? 'rotate-180' : ''}`} />
        </button>
        {showAiPanel && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Neighborhood</label>
                <select value={aiSubdivision} onChange={(e) => setAiSubdivision(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Any / general</option>
                  {subdivisions.slice(0, 50).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Service</label>
                <select value={aiServiceType} onChange={(e) => setAiServiceType(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Auto-detect</option>
                  <option value="roofing">Roofing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="painting">Painting</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tone</label>
                <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="urgent">Urgent</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
            <button onClick={generateWithAI} disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              <Sparkles size={14} /> {generating ? 'Generating...' : 'Generate Email with AI'}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Template (optional)</label>
        <select value={selectedTemplate} onChange={(e) => loadTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">— Start from scratch —</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.description || t.name} ({t.category})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">To *</label>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-xs"
          placeholder="Write your email here... or use AI to generate it." />
      </div>
      <p className="text-xs text-gray-400">Available merge fields: {'{{contact_name}}, {{subdivision_name}}, {{service_type}}, {{your_name}}, {{business_name}}, {{your_phone}}'}</p>
      <button onClick={sendEmail} disabled={sending || !to || !subject}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
        <Send size={16} /> {sending ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  );
}

// ── Templates Tab ──
function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'outreach', description: '', subject_template: '', body_html_template: '' });

  useEffect(() => { fetchAPI('/emails/templates').then(setTemplates).catch(() => {}); }, []);

  const save = async () => {
    if (editing) {
      await fetchAPI(`/emails/templates/${editing}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await fetchAPI('/emails/templates', { method: 'POST', body: JSON.stringify(form) });
    }
    setEditing(null);
    setForm({ name: '', category: 'outreach', description: '', subject_template: '', body_html_template: '' });
    fetchAPI('/emails/templates').then(setTemplates);
  };

  const startEdit = (t) => {
    setEditing(t.id);
    setForm({ name: t.name, category: t.category, description: t.description || '', subject_template: t.subject_template, body_html_template: t.body_html_template });
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Template editor */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{editing ? 'Edit Template' : 'Create New Template'}</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="outreach">Outreach</option>
            <option value="follow_up">Follow-up</option>
            <option value="hoa">HOA</option>
            <option value="homeowner">Homeowner</option>
          </select>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <input value={form.subject_template} onChange={(e) => setForm({ ...form, subject_template: e.target.value })} placeholder="Subject line..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3" />
        <textarea value={form.body_html_template} onChange={(e) => setForm({ ...form, body_html_template: e.target.value })}
          rows={5} placeholder="Email body (HTML)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-xs mb-3" />
        <div className="flex gap-2">
          <button onClick={save} disabled={!form.name || !form.subject_template}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {editing ? 'Update' : 'Save Template'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: '', category: 'outreach', description: '', subject_template: '', body_html_template: '' }); }}
            className="px-4 py-2 text-gray-500 text-sm">Cancel</button>}
        </div>
      </div>

      {/* Template list by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">{cat.replace('_', ' ')}</h3>
          <div className="space-y-2">
            {templates.filter(t => t.category === cat).map((t) => (
              <div key={t.id} className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => startEdit(t)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t.description || t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Subject: {t.subject_template}</p>
                  </div>
                  <span className="text-xs text-gray-400">Click to edit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Campaigns Tab ──
function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: '', subject: '', body_html: '', template_id: '', recipient_source: 'leads' });
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  useEffect(() => {
    fetchAPI('/campaigns').then(setCampaigns).catch(() => {});
    fetchAPI('/emails/templates').then(setTemplates).catch(() => {});
    fetchAPI('/leads').then(setLeads).catch(() => {});
  }, []);

  const loadTemplate = (id) => {
    const t = templates.find(t => String(t.id) === String(id));
    if (t) setForm(f => ({ ...f, template_id: id, subject: t.subject_template, body_html: t.body_html_template }));
  };

  const createAndSend = async () => {
    try {
      const campaign = await fetchAPI('/campaigns', { method: 'POST', body: JSON.stringify(form) });
      // Add recipients from leads
      const recipients = leads.filter(l => l.subdivision_email || l.contact_email).map(l => ({
        email: l.contact_email || l.subdivision_email || '',
        name: l.subdivision_name || '',
      })).filter(r => r.email);

      if (recipients.length > 0) {
        await fetchAPI(`/campaigns/${campaign.id}/add-recipients`, { method: 'POST', body: JSON.stringify({ recipients }) });
      }
      await fetchAPI(`/campaigns/${campaign.id}/send`, { method: 'POST' });
      setShowCreate(false);
      fetchAPI('/campaigns').then(setCampaigns);
    } catch (err) { alert(err.message); }
  };

  const STATUS_ICONS = { draft: Clock, sending: Send, sent: CheckCircle, cancelled: X };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{campaigns.length} campaigns</p>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Campaign</h3>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Use Template</label>
            <select value={form.template_id} onChange={(e) => loadTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">— Custom —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.description || t.name}</option>)}
            </select>
          </div>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject line"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <textarea value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} rows={6}
            placeholder="Email body..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-xs" />
          <p className="text-xs text-gray-400">Recipients: {leads.length} leads in your pipeline</p>
          <div className="flex gap-2">
            <button onClick={createAndSend} disabled={!form.name || !form.subject}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <Send size={14} className="inline mr-1" /> Create & Send
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No campaigns yet. Create one to reach multiple leads at once.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const Icon = STATUS_ICONS[c.status] || Clock;
            return (
              <div key={c.id} className="bg-white rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${c.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      <Icon size={12} /> {c.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span><Users size={12} className="inline mr-1" />{c.total_recipients} recipients</span>
                  <span><Send size={12} className="inline mr-1" />{c.total_sent} sent</span>
                  {c.sent_at && <span><Calendar size={12} className="inline mr-1" />{new Date(c.sent_at).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Marketing Plan Tab ──
function PlanTab() {
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [genForm, setGenForm] = useState({
    services: [user?.trade_category || 'General'],
    areas: [],
    budget: '$500-1000/quarter',
    goals: 'Win 5 new HOA contracts this year',
  });

  useEffect(() => { fetchAPI('/campaigns/plans/list').then(setPlans).catch(() => {}); }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const plan = await fetchAPI('/campaigns/plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          target_services: JSON.stringify(genForm.services),
          target_areas: JSON.stringify(genForm.areas),
          budget: genForm.budget,
          goals: genForm.goals,
        }),
      });
      setActivePlan(plan);
      setShowGenerator(false);
      fetchAPI('/campaigns/plans/list').then(setPlans);
    } catch (err) { alert(err.message); }
    finally { setGenerating(false); }
  };

  const planContent = activePlan?.plan_content ? JSON.parse(activePlan.plan_content) : null;

  const PRIORITY_COLORS = { high: 'bg-red-50 text-red-700 border-red-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', low: 'bg-gray-50 text-gray-600 border-gray-200' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{plans.length} plans created</p>
        <button onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          <Sparkles size={14} /> Generate New Plan
        </button>
      </div>

      {/* Generator */}
      {showGenerator && (
        <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-xl border border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-semibold text-gray-900">Marketing Plan Generator</h3>
          </div>
          <p className="text-sm text-gray-600">Answer a few questions and we'll create a quarterly marketing plan tailored to your business.</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">What services do you offer?</label>
            <input value={genForm.services.join(', ')} onChange={(e) => setGenForm({ ...genForm, services: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="Roofing, HVAC, Painting..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target ZIP codes (leave blank for all Atlanta)</label>
            <input value={genForm.areas.join(', ')} onChange={(e) => setGenForm({ ...genForm, areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="30041, 30097, 30075..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quarterly marketing budget</label>
              <select value={genForm.budget} onChange={(e) => setGenForm({ ...genForm, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option>Under $250/quarter</option>
                <option>$250-500/quarter</option>
                <option>$500-1000/quarter</option>
                <option>$1000-2500/quarter</option>
                <option>$2500+/quarter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Primary goal</label>
              <input value={genForm.goals} onChange={(e) => setGenForm({ ...genForm, goals: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <button onClick={generatePlan} disabled={generating}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
            <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate My Plan'}
          </button>
        </div>
      )}

      {/* Active Plan Display */}
      {planContent && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-2">{activePlan.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{planContent.summary}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span><Calendar size={12} className="inline mr-1" />Frequency: {planContent.email_frequency}</span>
              <span><Clock size={12} className="inline mr-1" />Best time: {planContent.best_send_times}</span>
            </div>
          </div>

          {/* Quarterly Breakdown */}
          {planContent.quarters?.map((q, qi) => (
            <div key={qi} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{q.quarter}</h4>
                  <p className="text-xs text-gray-500">{q.focus}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{q.actions?.length} actions</span>
              </div>

              <div className="space-y-2 mb-4">
                {q.actions?.map((a, ai) => (
                  <div key={ai} className={`flex items-start gap-3 p-3 rounded-lg border ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.medium}`}>
                    <input type="checkbox" className="mt-0.5 rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.description}</p>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">{a.type}</span>
                    </div>
                    <span className="text-[10px] font-medium uppercase">{a.priority}</span>
                  </div>
                ))}
              </div>

              {q.target_subdivisions?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target subdivisions:</p>
                  <div className="flex flex-wrap gap-2">
                    {q.target_subdivisions.map((s, si) => (
                      <span key={si} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {s.name} ({s.homes} homes, urgency {s.urgency})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Recommended Subdivisions */}
          {planContent.recommended_subdivisions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Recommended Target Subdivisions</h4>
              <div className="grid grid-cols-2 gap-2">
                {planContent.recommended_subdivisions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.homes} homes &middot; {s.zip}</p>
                    </div>
                    <span className={`text-xs font-bold ${s.urgency >= 80 ? 'text-red-600' : s.urgency >= 60 ? 'text-amber-600' : 'text-green-600'}`}>
                      {s.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Plans */}
      {plans.length > 0 && !planContent && (
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} onClick={() => setActivePlan(p)}
              className="bg-white rounded-lg border border-gray-100 p-4 cursor-pointer hover:shadow-sm">
              <p className="font-medium text-sm text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sent Tab ──
function SentTab() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/emails/sent').then((data) => setEmails(data.data || data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? <p className="text-gray-400 py-8 text-center">Loading...</p> : emails.length === 0 ? (
        <div className="text-center py-12">
          <Mail size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No emails sent yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sent</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={e.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.to_name || e.to_email}</p>
                    {e.to_name && <p className="text-xs text-gray-400">{e.to_email}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{e.sent_at ? new Date(e.sent_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Marketing Hub ──
export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Marketing</h1>
      <p className="text-sm text-gray-500 mb-6">Email outreach, campaigns, and marketing planning</p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 max-w-fit">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'compose' && <ComposeTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'campaigns' && <CampaignsTab />}
      {activeTab === 'plan' && <PlanTab />}
      {activeTab === 'sent' && <SentTab />}
    </div>
  );
}
