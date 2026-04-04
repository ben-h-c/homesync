import { useState, useEffect } from 'react';
import usePortalStore from '../../store/portalStore';
import { CheckCircle, X, AlertCircle, Clock } from 'lucide-react';

export default function PortalChangeOrders() {
  const { portalFetch } = usePortalStore();
  const [orders, setOrders] = useState([]);
  const [responding, setResponding] = useState(null);
  const [note, setNote] = useState('');

  const load = () => { portalFetch('/change-orders').then(setOrders).catch(() => {}); };
  useEffect(load, []);

  const respond = async (coId, status) => {
    setResponding(coId);
    try {
      await portalFetch(`/change-orders/${coId}/respond`, {
        method: 'POST', body: JSON.stringify({ status, note }),
      });
      setNote('');
      load();
    } catch (err) { alert(err.message); }
    finally { setResponding(null); }
  };

  const STATUS_ICONS = { proposed: Clock, approved: CheckCircle, rejected: X };
  const STATUS_STYLES = { proposed: 'bg-amber-50 border-amber-200', approved: 'bg-green-50 border-green-200', rejected: 'bg-red-50 border-red-200' };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Proposed Changes</h2>
      <p className="text-sm text-gray-500">Review and approve or reject changes proposed by your contractor.</p>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No change orders to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((co) => {
            const Icon = STATUS_ICONS[co.client_response || co.status] || Clock;
            const isPending = !co.client_response || co.client_response === 'pending';
            return (
              <div key={co.id} className={`bg-white rounded-xl border p-5 ${isPending ? 'border-amber-200 shadow-sm' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{co.change_order_number}: {co.description}</p>
                    {co.reason && <p className="text-sm text-gray-500 mt-0.5">Reason: {co.reason}</p>}
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[co.client_response || co.status] || 'bg-gray-100'}`}>
                    <Icon size={12} /> {co.client_response || co.status}
                  </span>
                </div>

                <div className="mb-4">
                  <span className={`text-lg font-bold ${(co.cost_impact || 0) > 0 ? 'text-red-600' : (co.cost_impact || 0) < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {(co.cost_impact || 0) > 0 ? '+' : ''}{co.cost_impact ? `$${co.cost_impact.toLocaleString()}` : 'No cost change'}
                  </span>
                </div>

                {isPending && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                      placeholder="Optional note or comments..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => respond(co.id, 'approved')} disabled={responding === co.id}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button onClick={() => respond(co.id, 'rejected')} disabled={responding === co.id}
                        className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {co.client_note && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Your note:</p>
                    <p className="text-sm text-gray-700">{co.client_note}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
