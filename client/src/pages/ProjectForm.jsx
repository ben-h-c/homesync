import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchAPI } from '../api/client';

const SERVICE_TYPES = [
  'hvac_tuneup', 'hvac_replacement', 'water_heater', 'roof_inspection',
  'pressure_washing', 'gutter_cleaning', 'exterior_paint', 'driveway_sealing', 'deck_staining',
];

export default function ProjectForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSubId = searchParams.get('subdivision_id');
  const preService = searchParams.get('service');

  const [subdivisions, setSubdivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subdivision_id: preSubId || '',
    service_type: preService || 'hvac_replacement',
    contractor_id: '',
    status: 'planning',
    retail_price: '',
    group_price: '',
    coordination_fee: '',
    total_eligible_homes: '',
    sign_up_deadline: '',
    service_start_date: '',
    service_end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchAPI('/subdivisions').then(setSubdivisions).catch(() => {});
    fetchAPI('/contacts?type=contractor').then(setContractors).catch(() => {});
  }, []);

  // Auto-generate name when subdivision + service changes
  useEffect(() => {
    if (form.subdivision_id && form.service_type) {
      const sub = subdivisions.find((s) => s.id === parseInt(form.subdivision_id));
      if (sub && !form.name) {
        setForm((f) => ({ ...f, name: `${sub.name} ${form.service_type.replace(/_/g, ' ')} 2026`.replace(/\b\w/g, (l) => l.toUpperCase()) }));
      }
    }
  }, [form.subdivision_id, form.service_type, subdivisions]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Convert numeric fields
      for (const k of ['subdivision_id', 'contractor_id', 'retail_price', 'group_price', 'coordination_fee', 'total_eligible_homes']) {
        if (payload[k]) payload[k] = Number(payload[k]);
        else delete payload[k];
      }
      if (payload.coordination_fee && payload.group_price) {
        payload.total_price_to_homeowner = payload.group_price + payload.coordination_fee;
      }
      const project = await fetchAPI('/projects', { method: 'POST', body: JSON.stringify(payload) });
      navigate(`/projects/${project.id}`);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Project Name *</label>
            <input required type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subdivision</label>
              <select value={form.subdivision_id} onChange={(e) => set('subdivision_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Select —</option>
                {subdivisions.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.total_homes} homes)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Service Type *</label>
              <select required value={form.service_type} onChange={(e) => set('service_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Contractor</label>
            <select value={form.contractor_id} onChange={(e) => set('contractor_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— Select —</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.company}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Retail Price ($)</label>
              <input type="number" value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group Price ($)</label>
              <input type="number" value={form.group_price} onChange={(e) => set('group_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Coordination Fee ($)</label>
              <input type="number" value={form.coordination_fee} onChange={(e) => set('coordination_fee', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Eligible Homes</label>
              <input type="number" value={form.total_eligible_homes} onChange={(e) => set('total_eligible_homes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sign-up Deadline</label>
              <input type="date" value={form.sign_up_deadline} onChange={(e) => set('sign_up_deadline', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Service Start</label>
              <input type="date" value={form.service_start_date} onChange={(e) => set('service_start_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-1.5">
            <Save size={16} /> {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
