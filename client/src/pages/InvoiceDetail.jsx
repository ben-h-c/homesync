import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import { ArrowLeft, Download, Send, Edit, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const TERMS_LABEL = { net_15: 'Net 15', net_30: 'Net 30', net_45: 'Net 45', due_on_receipt: 'Due on Receipt' };

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('');

  const load = () => {
    fetchAPI(`/invoices/${id}`).then(setInvoice).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const sendInvoice = async () => {
    await fetchAPI(`/invoices/${id}/send`, { method: 'POST' });
    load();
  };

  const markPaid = async () => {
    await fetchAPI(`/invoices/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ payment_method: payMethod }) });
    setShowPayModal(false);
    load();
  };

  const markOverdue = async () => {
    await fetchAPI(`/invoices/${id}/mark-overdue`, { method: 'POST' });
    load();
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading invoice...</div>;
  if (!invoice) return <div className="py-12 text-center text-gray-500">Invoice not found</div>;

  const items = invoice.line_items || [];
  const history = invoice.status_history || [];
  const discount = invoice.discount_type === 'percent' ? (invoice.subtotal * (invoice.discount_amount || 0) / 100) : (invoice.discount_amount || 0);

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/invoices')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoice_number}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[invoice.status] || STATUS_STYLES.draft}`}>
              {invoice.status}
            </span>
            <span className="text-sm text-gray-500">{invoice.customer_name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <>
              <button onClick={() => navigate(`/invoices/${id}/edit`)}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Edit size={14} /> Edit
              </button>
              <button onClick={sendInvoice}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
                <Send size={14} /> Send Invoice
              </button>
            </>
          )}
          {['sent', 'overdue'].includes(invoice.status) && (
            <>
              <button onClick={() => setShowPayModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                <CheckCircle size={14} /> Mark Paid
              </button>
              {invoice.status === 'sent' && (
                <button onClick={markOverdue}
                  className="flex items-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                  <AlertTriangle size={14} /> Mark Overdue
                </button>
              )}
            </>
          )}
          <button onClick={async () => {
              try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`http://localhost:3001/api/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${invoice.invoice_number || 'invoice'}.pdf`; a.click();
                URL.revokeObjectURL(url);
              } catch { alert('Failed to download PDF'); }
            }}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* From / To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">From</p>
                <p className="font-bold text-gray-900">{user?.company_name || 'HomeSync'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {user?.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                <p className="font-bold text-gray-900">{invoice.customer_name}</p>
                {invoice.customer_address && <p className="text-xs text-gray-500">{invoice.customer_address}</p>}
                {invoice.customer_email && <p className="text-xs text-gray-500">{invoice.customer_email}</p>}
                {invoice.customer_phone && <p className="text-xs text-gray-500">{invoice.customer_phone}</p>}
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex gap-6 text-xs text-gray-500 mb-6 pb-4 border-b border-gray-100">
              <div><span className="text-gray-400">Invoice #</span><br /><span className="font-medium text-gray-700 font-mono">{invoice.invoice_number}</span></div>
              <div><span className="text-gray-400">Issued</span><br /><span className="font-medium text-gray-700">{invoice.issue_date}</span></div>
              <div><span className="text-gray-400">Due</span><br /><span className="font-medium text-gray-700">{invoice.due_date}</span></div>
              <div><span className="text-gray-400">Terms</span><br /><span className="font-medium text-gray-700">{TERMS_LABEL[invoice.payment_terms] || invoice.payment_terms}</span></div>
            </div>

            {/* Line Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2">Service</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((li, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{li.service}</td>
                    <td className="py-2.5 text-gray-500">{li.description}</td>
                    <td className="py-2.5 text-right">{li.quantity}</td>
                    <td className="py-2.5 text-right">${(li.unit_price || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right font-medium">${(li.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${(invoice.subtotal || 0).toLocaleString()}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-500">-${discount.toLocaleString()}</span></div>
                )}
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Tax ({(invoice.tax_rate * 100).toFixed(1)}%)</span><span>${(invoice.tax_amount || 0).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl">${(invoice.total || 0).toLocaleString()}</span>
                </div>
                {invoice.status === 'paid' && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Paid</span>
                    <span className="font-medium">${(invoice.amount_paid || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status History + Details */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Status History</h2>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700">
                        {h.from_status && <><span className="capitalize">{h.from_status}</span> → </>}
                        <span className="font-medium capitalize">{h.to_status}</span>
                      </p>
                      {h.note && <p className="text-[10px] text-gray-500">{h.note}</p>}
                      <p className="text-[10px] text-gray-400">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No history yet.</p>
            )}
          </div>

          {/* Payment Info (if paid) */}
          {invoice.status === 'paid' && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <h2 className="text-sm font-semibold text-green-800 mb-2">Payment Received</h2>
              <div className="text-sm text-green-700 space-y-1">
                <p>Amount: <span className="font-medium">${(invoice.amount_paid || 0).toLocaleString()}</span></p>
                {invoice.payment_method && <p>Method: <span className="font-medium capitalize">{invoice.payment_method}</span></p>}
                {invoice.paid_at && <p>Date: <span className="font-medium">{new Date(invoice.paid_at).toLocaleDateString()}</span></p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark Paid Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Invoice {invoice.invoice_number} — ${(invoice.total || 0).toLocaleString()}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select method</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button onClick={markPaid}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
