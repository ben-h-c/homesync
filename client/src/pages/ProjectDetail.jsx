import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Download } from 'lucide-react';
import { fetchAPI } from '../api/client';

const SIGNUP_STATUSES = ['signed_up', 'scheduled', 'completed', 'cancelled', 'no_show'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [signups, setSignups] = useState([]);
  const [subName, setSubName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ homeowner_name: '', homeowner_email: '', homeowner_phone: '', address: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const load = () => {
    fetchAPI(`/projects/${id}`).then((p) => {
      setProject(p);
      setEditForm(p);
      if (p.subdivision_id) fetchAPI(`/subdivisions/${p.subdivision_id}`).then((s) => setSubName(s.name)).catch(() => {});
    }).catch(() => {});
    fetchAPI(`/projects/${id}/signups`).then(setSignups).catch(() => {});
  };
  useEffect(() => { load(); }, [id]);

  const handleAddSignup = async () => {
    await fetchAPI(`/projects/${id}/signups`, { method: 'POST', body: JSON.stringify(addForm) });
    setShowAdd(false);
    setAddForm({ homeowner_name: '', homeowner_email: '', homeowner_phone: '', address: '' });
    load();
  };

  const updateSignup = async (sid, updates) => {
    await fetchAPI(`/projects/${id}/signups/${sid}`, { method: 'PUT', body: JSON.stringify(updates) });
    load();
  };

  const handleSaveProject = async () => {
    await fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
    setEditing(false);
    load();
  };

  const exportSignups = () => {
    const headers = ['homeowner_name', 'address', 'homeowner_email', 'homeowner_phone', 'status', 'payment_status', 'amount_charged'];
    const csv = [headers.join(','), ...signups.map((s) => headers.map((h) => `"${(s[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project?.name || 'signups'}.csv`; a.click();
  };

  if (!project) return <div className="text-gray-500">Loading...</div>;

  const completed = signups.filter((s) => s.status === 'completed').length;
  const revenue = signups.filter((s) => s.payment_status === 'paid').reduce((sum, s) => sum + (s.amount_charged || 0), 0);

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 text-sm"><ArrowLeft size={16} /> Projects</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500 text-sm">{subName} &middot; {(project.service_type || '').replace(/_/g, ' ')} &middot; <span className="capitalize">{(project.status || '').replace(/_/g, ' ')}</span></p>
        </div>
        <button onClick={() => setEditing(!editing)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">{editing ? 'Cancel' : 'Edit Project'}</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{project.homes_signed_up || 0}</div>
          <div className="text-xs text-gray-500">Signed Up</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">${revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{project.total_eligible_homes || '—'}</div>
          <div className="text-xs text-gray-500">Eligible Homes</div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold mb-4">Edit Project</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'status', label: 'Status', type: 'select', options: ['planning', 'sign_ups_open', 'scheduled', 'in_progress', 'completed', 'cancelled'] },
              { key: 'total_eligible_homes', label: 'Eligible Homes', type: 'number' },
              { key: 'retail_price', label: 'Retail Price', type: 'number' },
              { key: 'group_price', label: 'Group Price', type: 'number' },
              { key: 'coordination_fee', label: 'Coordination Fee', type: 'number' },
              { key: 'sign_up_deadline', label: 'Sign-up Deadline', type: 'date' },
              { key: 'service_start_date', label: 'Service Start', type: 'date' },
              { key: 'service_end_date', label: 'Service End', type: 'date' },
            ].map(({ key, label, type, options }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                {type === 'select' ? (
                  <select value={editForm[key] || ''} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </select>
                ) : (
                  <input type={type} value={editForm[key] || ''} onChange={(e) => setEditForm({ ...editForm, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                )}
              </div>
            ))}
          </div>
          <button onClick={handleSaveProject} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">Save</button>
        </div>
      )}

      {/* Sign-ups */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold">Sign-ups ({signups.length})</h2>
          <div className="flex gap-2">
            <button onClick={exportSignups} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"><Download size={12} /> CSV</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs"><Plus size={12} /> Add</button>
          </div>
        </div>

        {showAdd && (
          <div className="p-4 bg-teal-tint border-b border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <input placeholder="Name *" value={addForm.homeowner_name} onChange={(e) => setAddForm({ ...addForm, homeowner_name: e.target.value })} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
              <input placeholder="Address *" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
              <input placeholder="Email" value={addForm.homeowner_email} onChange={(e) => setAddForm({ ...addForm, homeowner_email: e.target.value })} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
              <div className="flex gap-2">
                <input placeholder="Phone" value={addForm.homeowner_phone} onChange={(e) => setAddForm({ ...addForm, homeowner_phone: e.target.value })} className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <button onClick={handleAddSignup} disabled={!addForm.homeowner_name || !addForm.address} className="px-3 py-1.5 bg-primary text-white rounded text-xs disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Address</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Contact</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Payment</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {signups.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sign-ups yet.</td></tr>
            ) : signups.map((s, i) => (
              <tr key={s.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-2">{s.homeowner_name}</td>
                <td className="px-4 py-2 text-gray-600">{s.address}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{s.homeowner_email || s.homeowner_phone || '—'}</td>
                <td className="px-4 py-2">
                  <select value={s.status} onChange={(e) => updateSignup(s.id, { status: e.target.value })}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs">
                    {SIGNUP_STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={s.payment_status} onChange={(e) => updateSignup(s.id, { payment_status: e.target.value })}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs">
                    {PAYMENT_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={s.amount_charged || ''} onChange={(e) => updateSignup(s.id, { amount_charged: parseFloat(e.target.value) || 0 })}
                    className="w-20 border border-gray-200 rounded px-1.5 py-0.5 text-xs" placeholder="$0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
