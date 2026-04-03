import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Save, X, Users, Clock, Plus } from 'lucide-react';
import { fetchAPI } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import MaintenanceBar from '../components/MaintenanceBar';
import ActivityFeed from '../components/ActivityFeed';
import LogActivityModal from '../components/LogActivityModal';

const PIPELINE_COLORS = {
  research: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  meeting_scheduled: 'bg-indigo-100 text-indigo-700',
  pitched: 'bg-purple-100 text-purple-700',
  approved: 'bg-teal-100 text-teal-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-200 text-green-800',
  declined: 'bg-red-100 text-red-700',
};

const PIPELINE_OPTIONS = ['research', 'contacted', 'meeting_scheduled', 'pitched', 'approved', 'active', 'completed', 'declined'];

const HOA_FIELDS = [
  { key: 'hoa_name', label: 'HOA Name' },
  { key: 'hoa_management_company', label: 'Management Company' },
  { key: 'hoa_contact_name', label: 'HOA Contact' },
  { key: 'hoa_contact_email', label: 'HOA Email' },
  { key: 'hoa_contact_phone', label: 'HOA Phone' },
  { key: 'hoa_meeting_schedule', label: 'Meeting Schedule' },
  { key: 'hoa_website', label: 'HOA Website' },
  { key: 'hoa_dues_monthly', label: 'Monthly Dues ($)', type: 'number' },
];

export default function SubdivisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [subContacts, setSubContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editingHOA, setEditingHOA] = useState(false);
  const [hoaForm, setHoaForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const loadData = () => {
    fetchAPI(`/subdivisions/${id}`).then((s) => { setSub(s); setHoaForm(s); }).catch(() => {});
    fetchAPI(`/maintenance/forecast/${id}`).then(setForecast).catch(() => {});
    fetchAPI(`/subdivisions/${id}/contacts`).then(setSubContacts).catch(() => {});
    fetchAPI(`/subdivisions/${id}/timeline`).then(setActivities).catch(() => {});
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSaveHOA = async () => {
    setSaving(true);
    try {
      const fields = {};
      for (const f of HOA_FIELDS) fields[f.key] = hoaForm[f.key] ?? null;
      fields.pipeline_stage = hoaForm.pipeline_stage;
      fields.pipeline_notes = hoaForm.pipeline_notes;
      const updated = await fetchAPI(`/subdivisions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      setSub(updated);
      setHoaForm(updated);
      setEditingHOA(false);
    } finally {
      setSaving(false);
    }
  };

  if (!sub) return <div className="text-gray-500">Loading...</div>;

  // Sort non-recurring systems first by homes needing service desc
  const mainSystems = forecast
    ? Object.entries(forecast.systems)
        .filter(([, s]) => !s.is_recurring)
        .sort((a, b) => b[1].estimated_homes_needing_service - a[1].estimated_homes_needing_service)
    : [];
  const recurringSystems = forecast
    ? Object.entries(forecast.systems).filter(([, s]) => s.is_recurring)
    : [];

  const stageColor = PIPELINE_COLORS[sub.pipeline_stage] || PIPELINE_COLORS.research;
  const stageLabel = (sub.pipeline_stage || 'research').replace(/_/g, ' ');

  return (
    <div>
      {/* Back nav */}
      <button onClick={() => navigate('/subdivisions')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft size={16} /> Subdivisions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{sub.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-500">{sub.zip}</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${stageColor}`}>{stageLabel}</span>
            {forecast && <UrgencyBadge score={forecast.urgency_score} />}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/reports/forecast/${id}`)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <FileText size={16} /> Generate Report
          </button>
          <button
            onClick={() => navigate('/email/compose')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <Mail size={16} /> Send Pitch Email
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Subdivision Info</h2>
          {editingHOA ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditingHOA(false); setHoaForm(sub); }} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1"><X size={14} /> Cancel</button>
              <button onClick={handleSaveHOA} disabled={saving} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90 flex items-center gap-1"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
            </div>
          ) : (
            <button onClick={() => setEditingHOA(true)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">Edit</button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-6">
          <div>
            <div className="text-xs text-gray-500">Total Homes</div>
            <div className="text-lg font-semibold">{sub.total_homes}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Year Built Range</div>
            <div className="text-lg font-semibold">{sub.year_built_min}–{sub.year_built_max} <span className="text-sm font-normal text-gray-500">(Mode: {sub.year_built_mode})</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Square Footage</div>
            <div className="text-lg font-semibold">{sub.avg_square_footage?.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Assessed Value</div>
            <div className="text-lg font-semibold">${sub.avg_assessed_value?.toLocaleString()}</div>
          </div>
        </div>

        {/* Pipeline stage */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Pipeline Stage</div>
          {editingHOA ? (
            <select
              value={hoaForm.pipeline_stage || 'research'}
              onChange={(e) => setHoaForm({ ...hoaForm, pipeline_stage: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              {PIPELINE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
              ))}
            </select>
          ) : (
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${stageColor}`}>{stageLabel}</span>
          )}
        </div>

        {/* HOA fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 border-t border-gray-100 pt-4">
          {HOA_FIELDS.map(({ key, label, type }) => (
            <div key={key}>
              <div className="text-xs text-gray-500 mb-0.5">{label}</div>
              {editingHOA ? (
                <input
                  type={type || 'text'}
                  value={hoaForm[key] ?? ''}
                  onChange={(e) => setHoaForm({ ...hoaForm, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              ) : (
                <div className="text-sm">
                  {key === 'hoa_dues_monthly' && sub[key] ? `$${sub[key]}` : sub[key] || <span className="text-gray-300">—</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Forecast Panel */}
      {forecast && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Maintenance Forecast</h2>
            <div className="text-sm text-gray-500">
              Est. total savings: <strong className="text-primary">${forecast.estimated_total_savings.toLocaleString()}</strong>
            </div>
          </div>

          {/* Main systems */}
          {mainSystems.map(([key, system]) => (
            <MaintenanceBar key={key} system={system} />
          ))}

          {/* Recurring services (collapsed) */}
          {recurringSystems.length > 0 && (
            <details className="mt-4 border-t border-gray-100 pt-4">
              <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">
                Recurring Services ({recurringSystems.length})
              </summary>
              <div className="mt-3">
                {recurringSystems.map(([key, system]) => (
                  <MaintenanceBar key={key} system={system} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* TOP RECOMMENDATION */}
      {forecast && forecast.top_recommendation && (
        <div className="bg-teal-tint border-2 border-primary/30 rounded-lg p-6 mb-6">
          <h3 className="text-base font-bold text-primary mb-2">TOP OPPORTUNITY: {forecast.top_system_display}</h3>
          <p className="text-sm text-gray-700 mb-3">
            {forecast.top_system_homes} of {forecast.total_homes} homes ({Math.round(forecast.top_system_homes / forecast.total_homes * 100)}%) have {forecast.top_system_display?.toLowerCase()} systems at or past end-of-life.
            At group rates, each homeowner saves ~${forecast.top_system_savings_per_home.toLocaleString()}.
            <br />
            <strong>Total savings potential: ${forecast.top_system_savings.toLocaleString()}</strong>
          </p>
          <button
            onClick={() => navigate('/projects/new')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Create Project for This →
          </button>
        </div>
      )}

      {/* Contacts section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users size={18} /> HOA Contacts</h2>
          <button onClick={() => navigate('/contacts/new')} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"><Plus size={12} /> Add Contact</button>
        </div>
        {subContacts.length === 0 ? (
          <p className="text-sm text-gray-400">No contacts linked to this subdivision yet.</p>
        ) : (
          <div className="space-y-2">
            {subContacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded" onClick={() => navigate(`/contacts/${c.id}`)}>
                <div>
                  <span className="font-medium text-sm">{c.first_name} {c.last_name}</span>
                  {c.title && <span className="text-xs text-gray-500 ml-2">{c.title}</span>}
                  <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.type === 'hoa_board' ? 'bg-indigo-100 text-indigo-700' :
                    c.type === 'contractor' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{c.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-xs text-gray-500">{c.email || c.phone || ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Clock size={18} /> Activity Timeline</h2>
          <button onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">
            <Plus size={12} /> Log Activity
          </button>
        </div>
        <ActivityFeed activities={activities} />
      </div>

      {showLogModal && (
        <LogActivityModal
          subdivisionId={parseInt(id)}
          onClose={() => setShowLogModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
