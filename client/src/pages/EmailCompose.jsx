import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Eye, Loader2 } from 'lucide-react';
import { fetchAPI } from '../api/client';
import EmailNav from '../components/EmailNav';

export default function EmailCompose() {
  const [searchParams] = useSearchParams();
  const preContactId = searchParams.get('contact_id');
  const preSubdivisionId = searchParams.get('subdivision_id');
  const preTemplate = searchParams.get('template');

  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    to_email: '',
    to_name: '',
    contact_id: null,
    subject: '',
    body_html: '',
    template_used: null,
    related_subdivision_id: null,
  });

  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAPI('/emails/templates').then(setTemplates).catch(() => {});
    loadPresets();
  }, []);

  const loadPresets = async () => {
    if (preContactId) {
      try {
        const c = await fetchAPI(`/contacts/${preContactId}`);
        setForm((f) => ({ ...f, to_email: c.email || '', to_name: `${c.first_name} ${c.last_name}`, contact_id: parseInt(preContactId) }));
        setContactSearch(`${c.first_name} ${c.last_name}`);
      } catch {}
    }
    if (preSubdivisionId) {
      setForm((f) => ({ ...f, related_subdivision_id: parseInt(preSubdivisionId) }));
    }
  };

  // Load template when preTemplate is set and templates are loaded
  useEffect(() => {
    if (preTemplate && templates.length > 0) {
      const t = templates.find((x) => x.name === preTemplate);
      if (t) applyTemplate(t.id);
    }
  }, [preTemplate, templates]);

  const searchContacts = async (q) => {
    setContactSearch(q);
    if (q.length < 2) { setShowSuggestions(false); return; }
    try {
      const results = await fetchAPI(`/contacts/search?q=${encodeURIComponent(q)}`);
      setContacts(results);
      setShowSuggestions(true);
    } catch {}
  };

  const selectContact = (c) => {
    setForm({ ...form, to_email: c.email || '', to_name: `${c.first_name} ${c.last_name}`, contact_id: c.id });
    setContactSearch(`${c.first_name} ${c.last_name}`);
    setShowSuggestions(false);
  };

  const applyTemplate = async (templateId) => {
    const t = templates.find((x) => x.id === parseInt(templateId));
    if (!t) return;

    // Build variables from context
    const vars = {
      your_name: 'Your Name',
      your_phone: '(770) 555-0123',
      business_name: 'HomeSync',
      contact_first_name: form.to_name?.split(' ')[0] || '',
    };

    if (form.related_subdivision_id) {
      try {
        const sub = await fetchAPI(`/subdivisions/${form.related_subdivision_id}`);
        const forecast = await fetchAPI(`/maintenance/forecast/${form.related_subdivision_id}`);
        Object.assign(vars, {
          subdivision_name: sub.name,
          year_built: sub.year_built_mode,
          total_homes: sub.total_homes,
          urgency_score: forecast.urgency_score,
          top_service_needed: forecast.top_system_display || '',
          num_homes_needing_service: forecast.top_system_homes || 0,
          estimated_savings_per_home: forecast.top_system_savings_per_home || 0,
          estimated_total_savings: forecast.estimated_total_savings || 0,
        });
      } catch {}
    }

    try {
      const rendered = await fetchAPI('/emails/preview', {
        method: 'POST',
        body: JSON.stringify({ template_id: t.id, variables: vars }),
      });
      setForm((f) => ({
        ...f,
        subject: rendered.subject,
        body_html: rendered.body_html,
        template_used: t.name,
      }));
    } catch {}
  };

  const handlePreview = () => {
    setPreview(preview ? null : form.body_html);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await fetchAPI('/emails/send', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch (err) {
      setError('Send failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <div>
      <EmailNav />
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-lg font-semibold text-success mb-2">Email Sent</h2>
        <p className="text-gray-500 mb-4">To: {form.to_name || form.to_email}</p>
        <button onClick={() => { setSent(false); setForm({ to_email: '', to_name: '', contact_id: null, subject: '', body_html: '', template_used: null, related_subdivision_id: null }); setContactSearch(''); }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Compose Another</button>
      </div>
    </div>
  );

  return (
    <div>
      <EmailNav />

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl">
        <div className="space-y-4">
          {/* To */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="text" value={contactSearch} onChange={(e) => searchContacts(e.target.value)}
              onFocus={() => contacts.length > 0 && setShowSuggestions(true)}
              placeholder="Search contacts or type email..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {showSuggestions && contacts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {contacts.map((c) => (
                  <div key={c.id} onClick={() => selectContact(c)}
                    className="px-3 py-2 text-sm hover:bg-teal-tint cursor-pointer border-b border-gray-100 last:border-0">
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                    <span className="text-gray-400 ml-2">{c.email}</span>
                  </div>
                ))}
              </div>
            )}
            {form.to_email && (
              <div className="text-xs text-gray-400 mt-1">{form.to_email}</div>
            )}
          </div>

          {/* Template */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Template</label>
            <select onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— No template —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.description || t.name} ({t.category})</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Body (HTML)</label>
              <button onClick={handlePreview} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Eye size={12} /> {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {preview ? (
              <div className="border border-gray-300 rounded-lg p-4 text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: form.body_html }} />
            ) : (
              <textarea value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                rows={12} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2">
            <button onClick={handleSend} disabled={sending || !form.to_email || !form.subject || !form.body_html}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
