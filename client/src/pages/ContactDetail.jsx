import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { fetchAPI } from '../api/client';
import ActivityFeed from '../components/ActivityFeed';
import LogActivityModal from '../components/LogActivityModal';

const TYPE_LABELS = { hoa_board: 'HOA Board', contractor: 'Contractor', homeowner: 'Homeowner', other: 'Other' };

const BASIC_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'title', label: 'Title' },
  { key: 'subdivision', label: 'Subdivision' },
  { key: 'address', label: 'Address' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
];

const CONTRACTOR_FIELDS = [
  { key: 'contractor_services', label: 'Services' },
  { key: 'contractor_license_number', label: 'License #' },
  { key: 'contractor_insurance_verified', label: 'Insurance Verified', type: 'boolean' },
  { key: 'contractor_rating', label: 'Rating (1-5)', type: 'number' },
  { key: 'contractor_group_rate_discount', label: 'Group Discount', type: 'number' },
];

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    fetchAPI(`/contacts/${id}`).then(setContact).catch(() => setError('Contact not found'));
    fetchAPI(`/activities?contact_id=${id}`).then(setActivities).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Deactivate this contact?')) return;
    await fetchAPI(`/contacts/${id}`, { method: 'DELETE' });
    navigate('/contacts');
  };

  if (error) return (
    <div>
      <button onClick={() => navigate('/contacts')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm"><ArrowLeft size={16} /> Contacts</button>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
    </div>
  );
  if (!contact) return <div className="text-gray-500">Loading...</div>;

  const isContractor = contact.type === 'contractor';
  let services = [];
  try { services = JSON.parse(contact.contractor_services || '[]'); } catch {}

  return (
    <div>
      <button onClick={() => navigate('/contacts')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm"><ArrowLeft size={16} /> Contacts</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{contact.first_name} {contact.last_name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              contact.type === 'hoa_board' ? 'bg-indigo-100 text-indigo-700' :
              contact.type === 'contractor' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>{TYPE_LABELS[contact.type] || contact.type}</span>
            {contact.title && <span>{contact.title}</span>}
            {contact.company && <span>at {contact.company}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/contacts/new?edit=${id}`)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">Edit</button>
          <button onClick={handleDelete} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-1"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold mb-4">Contact Info</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {BASIC_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm">{contact[key] || <span className="text-gray-300">—</span>}</div>
                </div>
              ))}
            </div>
          </div>

          {isContractor && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold mb-4">Contractor Details</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <div className="text-xs text-gray-500">Services</div>
                  <div className="text-sm">{services.length > 0 ? services.join(', ') : <span className="text-gray-300">—</span>}</div>
                </div>
                {CONTRACTOR_FIELDS.slice(1).map(({ key, label, type }) => (
                  <div key={key}>
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className="text-sm">
                      {type === 'boolean' ? (contact[key] ? 'Yes' : 'No') :
                       key === 'contractor_group_rate_discount' && contact[key] ? `${Math.round(contact[key] * 100)}%` :
                       key === 'contractor_rating' && contact[key] ? `${'★'.repeat(Math.round(contact[key]))}${'☆'.repeat(5 - Math.round(contact[key]))}` :
                       contact[key] || <span className="text-gray-300">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Activity sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Activity</h2>
              <button onClick={() => setShowLogModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">
                <Plus size={12} /> Log
              </button>
            </div>
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {showLogModal && (
        <LogActivityModal
          contactId={parseInt(id)}
          onClose={() => setShowLogModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
