import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { fetchAPI } from '../api/client';

const FIELDS = [
  { key: 'parcel_id', label: 'Parcel ID', readOnly: true },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
  { key: 'subdivision', label: 'Subdivision' },
  { key: 'owner_name', label: 'Owner Name' },
  { key: 'owner_mailing_address', label: 'Mailing Address' },
  { key: 'property_type', label: 'Property Type' },
  { key: 'year_built', label: 'Year Built', type: 'number' },
  { key: 'square_footage', label: 'Square Footage', type: 'number' },
  { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
  { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
  { key: 'assessed_value', label: 'Assessed Value', type: 'number' },
  { key: 'lot_size_acres', label: 'Lot Size (acres)', type: 'number' },
  { key: 'hvac_year_installed', label: 'HVAC Year Installed', type: 'number' },
  { key: 'water_heater_year', label: 'Water Heater Year', type: 'number' },
  { key: 'roof_year', label: 'Roof Year', type: 'number' },
  { key: 'exterior_paint_year', label: 'Exterior Paint Year', type: 'number' },
  { key: 'notes', label: 'Notes', multiline: true },
];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAPI(`/properties/${id}`)
      .then((p) => { setProperty(p); setForm(p); })
      .catch(() => setError('Property not found'));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await fetchAPI(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProperty(updated);
      setForm(updated);
      setEditing(false);
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this property?')) return;
    try {
      await fetchAPI(`/properties/${id}`, { method: 'DELETE' });
      navigate('/properties');
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  if (error && !property) {
    return (
      <div>
        <button onClick={() => navigate('/properties')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={18} /> Back to Properties
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  if (!property) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/properties')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={18} /> Back to Properties
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{property.address}</h1>
          <p className="text-gray-500">{property.subdivision} &middot; {property.city}, {property.state} {property.zip}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(property); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 flex items-center gap-1.5">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
                Edit
              </button>
              <button onClick={handleDelete} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-1.5">
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {FIELDS.map(({ key, label, type, readOnly, multiline }) => (
            <div key={key} className={multiline ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              {editing && !readOnly ? (
                multiline ? (
                  <textarea
                    value={form[key] ?? ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                ) : (
                  <input
                    type={type || 'text'}
                    value={form[key] ?? ''}
                    onChange={(e) => setForm({ ...form, [key]: type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                )
              ) : (
                <div className="text-sm py-1.5">
                  {key === 'assessed_value' && form[key] ? `$${Number(form[key]).toLocaleString()}` :
                   key === 'square_footage' && form[key] ? Number(form[key]).toLocaleString() :
                   form[key] ?? <span className="text-gray-300">—</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
