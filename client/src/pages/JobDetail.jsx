import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import {
  ArrowLeft, Edit, Trash2, Plus, FileText, DollarSign, Clock,
  CheckCircle, AlertCircle, MessageSquare, ChevronDown, X,
} from 'lucide-react';

const STATUS_STYLES = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
  scheduled: 'bg-blue-100 text-blue-700',
};
const CO_STATUS = {
  proposed: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};
const ACTIVITY_ICONS = {
  status_change: CheckCircle,
  note: MessageSquare,
  change_order: FileText,
  invoice: DollarSign,
};

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showAddCO, setShowAddCO] = useState(false);
  const [coForm, setCoForm] = useState({ description: '', cost_impact: '', reason: '' });

  const load = () => {
    fetchAPI(`/jobs/${id}`).then(setProject).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    await fetchAPI(`/jobs/${id}/activity`, {
      method: 'POST', body: JSON.stringify({ type: 'note', description: noteText }),
    });
    setNoteText('');
    setShowAddNote(false);
    load();
  };

  const addChangeOrder = async () => {
    if (!coForm.description.trim()) return;
    await fetchAPI(`/jobs/${id}/change-orders`, {
      method: 'POST', body: JSON.stringify({
        description: coForm.description,
        cost_impact: coForm.cost_impact ? parseFloat(coForm.cost_impact) : 0,
        reason: coForm.reason,
      }),
    });
    setCoForm({ description: '', cost_impact: '', reason: '' });
    setShowAddCO(false);
    load();
  };

  const updateCOStatus = async (coId, status) => {
    await fetchAPI(`/jobs/${id}/change-orders/${coId}`, {
      method: 'PUT', body: JSON.stringify({ status }),
    });
    load();
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading project...</div>;
  if (!project) return <div className="py-12 text-center text-gray-500">Project not found</div>;

  const activities = project.activities || [];
  const changeOrders = project.changeOrders || [];
  const invoices = project.invoices || [];
  const totalCOApproved = changeOrders.filter(c => c.status === 'approved').reduce((s, c) => s + (c.cost_impact || 0), 0);

  return (
    <div>
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft size={14} /> Back to Projects
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title || `Project #${project.id}`}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[project.status] || STATUS_STYLES.not_started}`}>
              {project.status?.replace(/_/g, ' ')}
            </span>
            {project.service_type && <span className="text-sm text-gray-500 capitalize">{project.service_type.replace(/_/g, ' ')}</span>}
            {project.subdivision_name && <span className="text-sm text-gray-400">{project.subdivision_name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/jobs/${id}/edit`)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Edit size={14} /> Edit
          </button>
          <button onClick={() => navigate(`/invoices/new?job_id=${id}`)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <DollarSign size={14} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Client</span><p className="font-medium">{project.client_name || '—'}</p></div>
              <div><span className="text-gray-500">Phone</span><p className="font-medium">{project.client_phone || '—'}</p></div>
              <div><span className="text-gray-500">Email</span><p className="font-medium">{project.client_email || '—'}</p></div>
              <div><span className="text-gray-500">Address</span><p className="font-medium">{project.client_address || '—'}</p></div>
              <div><span className="text-gray-500">Start</span><p className="font-medium">{project.start_date || '—'}</p></div>
              <div><span className="text-gray-500">End</span><p className="font-medium">{project.end_date || '—'}</p></div>
              <div><span className="text-gray-500">Estimated Cost</span><p className="font-medium">{project.estimated_cost ? `$${project.estimated_cost.toLocaleString()}` : '—'}</p></div>
              <div><span className="text-gray-500">Homes</span><p className="font-medium">{project.total_homes || '—'}</p></div>
            </div>
            {project.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">Scope of Work</span>
                <p className="text-sm text-gray-700 mt-1">{project.description}</p>
              </div>
            )}
            {project.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">Notes</span>
                <p className="text-sm text-gray-700 mt-1">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Change Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Change Orders {changeOrders.length > 0 && <span className="text-gray-400">({changeOrders.length})</span>}
              </h2>
              <button onClick={() => setShowAddCO(true)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Plus size={12} /> New Change Order
              </button>
            </div>

            {showAddCO && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <input value={coForm.description} onChange={(e) => setCoForm({ ...coForm, description: e.target.value })}
                  placeholder="Description of change..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={coForm.cost_impact} onChange={(e) => setCoForm({ ...coForm, cost_impact: e.target.value })}
                    placeholder="Cost impact ($)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input value={coForm.reason} onChange={(e) => setCoForm({ ...coForm, reason: e.target.value })}
                    placeholder="Reason" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addChangeOrder} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium">Create</button>
                  <button onClick={() => setShowAddCO(false)} className="px-3 py-1.5 text-gray-500 text-xs">Cancel</button>
                </div>
              </div>
            )}

            {changeOrders.length === 0 && !showAddCO ? (
              <p className="text-sm text-gray-400">No change orders yet.</p>
            ) : (
              <div className="space-y-3">
                {changeOrders.map((co) => (
                  <div key={co.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{co.change_order_number}: {co.description}</p>
                        {co.reason && <p className="text-xs text-gray-500 mt-0.5">Reason: {co.reason}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${CO_STATUS[co.status] || CO_STATUS.proposed}`}>
                        {co.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-medium ${co.cost_impact > 0 ? 'text-red-600' : co.cost_impact < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {co.cost_impact > 0 ? '+' : ''}{co.cost_impact ? `$${co.cost_impact.toLocaleString()}` : '$0'}
                      </span>
                      {co.status === 'proposed' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateCOStatus(co.id, 'approved')} className="px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded font-medium">Approve</button>
                          <button onClick={() => updateCOStatus(co.id, 'rejected')} className="px-2 py-1 text-[10px] bg-red-100 text-red-600 rounded font-medium">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {totalCOApproved !== 0 && (
                  <div className="text-right text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Approved changes: </span>
                    <span className={`font-medium ${totalCOApproved > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalCOApproved > 0 ? '+' : ''}${totalCOApproved.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline / Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Activity Timeline</h2>
              <button onClick={() => setShowAddNote(!showAddNote)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Plus size={12} /> Add Note
              </button>
            </div>

            {showAddNote && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-2">
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addNote()} />
                <button onClick={addNote} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium">Add</button>
              </div>
            )}

            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] || Clock;
                  return (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-gray-50 rounded-lg shrink-0">
                        <Icon size={14} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{a.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Invoices + Summary */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Financials</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Cost</span>
                <span className="font-medium">{project.estimated_cost ? `$${project.estimated_cost.toLocaleString()}` : '—'}</span>
              </div>
              {totalCOApproved !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Change Orders</span>
                  <span className={`font-medium ${totalCOApproved > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalCOApproved > 0 ? '+' : ''}${totalCOApproved.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                <span className="text-gray-700 font-medium">Adjusted Total</span>
                <span className="font-bold">${((project.estimated_cost || 0) + totalCOApproved).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-gray-500">Invoiced</span>
                <span className="font-medium text-green-600">${invoices.reduce((s, i) => s + (i.total || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Linked Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Invoices</h2>
              <button onClick={() => navigate(`/invoices/new?job_id=${id}`)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Plus size={12} /> New
              </button>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices linked to this project.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-mono font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-400">{inv.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${(inv.total || 0).toLocaleString()}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Status Change */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {['not_started', 'in_progress', 'on_hold', 'completed'].map((status) => (
                <button key={status} disabled={project.status === status}
                  onClick={async () => {
                    await fetchAPI(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
                    load();
                  }}
                  className={`w-full py-2 text-xs font-medium rounded-lg transition-colors ${project.status === status
                    ? `${STATUS_STYLES[status]} cursor-default ring-2 ring-offset-1 ring-gray-300`
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } capitalize`}>
                  {status === project.status ? '● ' : ''}{status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
