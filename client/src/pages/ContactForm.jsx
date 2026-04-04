import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchAPI } from '../api/client';

const TYPES = [
  { value: 'hoa_board', label: 'HOA Board Member' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'other', label: 'Other' },
];

const SOURCES = ['manual', 'qpublic', 'nextdoor', 'referral', 'hoa_meeting'];

const SERVICE_OPTIONS = ['hvac', 'plumbing', 'roofing', 'pressure_washing', 'gutter_cleaning', 'exterior_paint', 'driveway_sealing', 'deck_staining', 'garage_door', 'electrical', 'landscaping'];

export default function ContactForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const preFillSubdivision = searchParams.get('subdivision') || '';

  const [form, setForm] = useState({
    type: 'hoa_board',
    first_name: '', last_name: '', email: '', phone: '',
    company: '', title: '', subdivision: preFillSubdivision, address: '',
    source: 'manual', notes: '',
    contractor_services: [],
    contractor_license_number: '',
    contractor_insurance_verified: false,
    contractor_rating: '',
    contractor_group_rate_discount: '',
  });
  const [subdivisions, setSubdivisions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAPI('/subdivisions').then((s) => setSubdivisions(s.map((x) => x.name))).catch(() => {});
    if (editId) {
      fetchAPI(`/contacts/${editId}`).then((c) => {
        let services = [];
        try { services = JSON.parse(c.contractor_services || '[]'); } catch {}
        setForm({ ...c, contractor_services: services });
      });
    }
  }, [editId]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (svc) => {
    const services = form.contractor_services.includes(svc)
      ? form.contractor_services.filter((s) => s !== svc)
      : [...form.contractor_services, svc];
    set('contractor_services', services);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.contractor_rating) payload.contractor_rating = parseFloat(payload.contractor_rating);
      if (payload.contractor_group_rate_discount) payload.contractor_group_rate_discount = parseFloat(payload.contractor_group_rate_discount);

      if (editId) {
        await fetchAPI(`/contacts/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        navigate(`/contacts/${editId}`);
      } else {
        const created = await fetchAPI('/contacts', { method: 'POST', body: JSON.stringify(payload) });
        navigate(`/contacts/${created.id}`);
      }
    } catch {} finally { setSaving(false); }
  };

  const isContractor = form.type === 'contractor';

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit Contact' : 'New Contact'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First Name *</label>
              <input required type="text" value={form.first_name} onChange={(e) => set('first_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last Name</label>
              <input type="text" value={form.last_name} onChange={(e) => set('last_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{isContractor ? 'Company' : 'Organization'}</label>
              <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder={isContractor ? 'Owner, Technician...' : 'Board President...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subdivision</label>
              <select value={form.subdivision} onChange={(e) => set('subdivision', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— none —</option>
                {subdivisions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Source</label>
              <select value={form.source} onChange={(e) => set('source', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Contractor-specific fields */}
          {isContractor && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-medium text-sm mb-3">Contractor Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((svc) => (
                      <button key={svc} type="button" onClick={() => toggleService(svc)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          form.contractor_services.includes(svc)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                        }`}>
                        {svc.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">License Number</label>
                    <input type="text" value={form.contractor_license_number} onChange={(e) => set('contractor_license_number', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rating (1-5)</label>
                    <input type="number" min="1" max="5" step="0.5" value={form.contractor_rating} onChange={(e) => set('contractor_rating', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Group Rate Discount (e.g. 0.30 = 30%)</label>
                    <input type="number" min="0" max="1" step="0.05" value={form.contractor_group_rate_discount} onChange={(e) => set('contractor_group_rate_discount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!form.contractor_insurance_verified} onChange={(e) => set('contractor_insurance_verified', e.target.checked)}
                        className="rounded border-gray-300" />
                      Insurance Verified
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
            <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}
