import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import { Save, ArrowLeft } from 'lucide-react';

const STATUSES = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const SERVICES = ['roofing', 'painting', 'hvac', 'plumbing', 'electrical', 'garage_door', 'pressure_washing', 'landscaping', 'general', 'other'];

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id && id !== 'new';
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState([]);

  const [form, setForm] = useState({
    title: '', client_name: '', client_email: '', client_phone: '', client_address: '',
    service_type: 'general', description: '', start_date: '', end_date: '',
    estimated_cost: '', total_revenue: '', status: 'not_started',
    total_homes: '', lead_id: searchParams.get('lead_id') || '', subdivision_id: '',
    notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchAPI(`/jobs/${id}`).then((data) => {
        const job = data.activities ? data : data; // handle both detail and simple response
        setForm({
          title: job.title || '', client_name: job.client_name || '', client_email: job.client_email || '',
          client_phone: job.client_phone || '', client_address: job.client_address || '',
          service_type: job.service_type || 'general', description: job.description || '',
          start_date: job.start_date || '', end_date: job.end_date || '',
          estimated_cost: job.estimated_cost || '', total_revenue: job.total_revenue || '',
          status: job.status || 'not_started', total_homes: job.total_homes || '',
          lead_id: job.lead_id || '', subdivision_id: job.subdivision_id || '', notes: job.notes || '',
        });
      });
    }
    fetchAPI('/leads').then(setLeads).catch(() => {});
  }, [id]);

  const handleLeadSelect = (leadId) => {
    const lead = leads.find((l) => String(l.id) === String(leadId));
    if (lead) {
      setForm((f) => ({
        ...f, lead_id: lead.id, subdivision_id: lead.subdivision_id,
        service_type: lead.service_type || f.service_type,
        total_homes: lead.estimated_homes || f.total_homes,
        estimated_cost: lead.estimated_value || f.estimated_cost,
        title: f.title || `${lead.subdivision_name || 'Subdivision'} — ${(lead.service_type || 'service').replace(/_/g, ' ')}`,
      }));
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
        total_revenue: form.total_revenue ? parseFloat(form.total_revenue) : null,
        total_homes: form.total_homes ? parseInt(form.total_homes) : null,
        lead_id: form.lead_id ? parseInt(form.lead_id) : null,
        subdivision_id: form.subdivision_id ? parseInt(form.subdivision_id) : null,
      };
      if (isEdit) {
        await fetchAPI(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        navigate(`/jobs/${id}`);
      } else {
        const job = await fetchAPI('/jobs', { method: 'POST', body: JSON.stringify(payload) });
        navigate(`/jobs/${job.id || ''}`);
      }
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(isEdit ? `/jobs/${id}` : '/jobs')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft size={14} /> {isEdit ? 'Back to Project' : 'Back to Projects'}
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Project' : 'New Project'}</h1>

      <div className="space-y-6">
        {/* Link to Lead */}
        {!isEdit && leads.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <label className="block text-xs font-medium text-blue-700 mb-1">Create from Lead (optional)</label>
            <select value={form.lead_id} onChange={(e) => { set('lead_id')(e); handleLeadSelect(e.target.value); }}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white">
              <option value="">— Start fresh —</option>
              {leads.filter((l) => l.stage !== 'lost').map((l) => (
                <option key={l.id} value={l.id}>{l.subdivision_name || `Lead #${l.id}`} — {l.service_type} (${(l.estimated_value || 0).toLocaleString()})</option>
              ))}
            </select>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project Name *</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. Creekstone Estates — HVAC Replacement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
                <select value={form.service_type} onChange={set('service_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  {SERVICES.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={set('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description / Scope of Work</label>
              <textarea value={form.description} onChange={set('description')} rows={3}
                placeholder="Describe the project scope, deliverables, and any special requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Cost ($)</label>
                <input type="number" value={form.estimated_cost} onChange={set('estimated_cost')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" value={form.start_date} onChange={set('start_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input type="date" value={form.end_date} onChange={set('end_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Homes / Units</label>
              <input type="number" value={form.total_homes} onChange={set('total_homes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Client Name</label>
              <input value={form.client_name} onChange={set('client_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.client_email} onChange={set('client_email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" value={form.client_phone} onChange={set('client_phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input value={form.client_address} onChange={set('client_address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Notes</h2>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Internal notes, reminders..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
          </button>
          <button onClick={() => navigate(isEdit ? `/jobs/${id}` : '/jobs')} className="text-sm text-gray-500 hover:underline">Cancel</button>
        </div>
      </div>
    </div>
  );
}
