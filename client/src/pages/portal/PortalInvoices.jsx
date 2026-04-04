import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePortalStore from '../../store/portalStore';
import { Download, DollarSign } from 'lucide-react';

const STATUS_STYLES = {
  sent: 'bg-blue-100 text-blue-700', viewed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
};

export default function PortalInvoices() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { portalFetch, portalFetchBlob } = usePortalStore();
  const [invoices, setInvoices] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => { portalFetch('/invoices').then(setInvoices).catch(() => {}); }, []);

  const downloadPdf = async (invoiceId, number) => {
    const res = await portalFetchBlob(`/invoices/${invoiceId}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${number || 'invoice'}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const viewDetail = async (id) => {
    const inv = await portalFetch(`/invoices/${id}`);
    setDetail(inv);
  };

  if (detail) {
    const items = detail.line_items || [];
    return (
      <div className="space-y-6">
        <button onClick={() => setDetail(null)} className="text-sm text-gray-500 hover:text-primary">&larr; Back to invoices</button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-mono">{detail.invoice_number}</h2>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[detail.status] || 'bg-gray-100 text-gray-600'}`}>{detail.status}</span>
            </div>
            <button onClick={() => downloadPdf(detail.id, detail.invoice_number)}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Download size={14} /> Download PDF
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><span className="text-gray-400">Issue Date</span><p className="font-medium">{detail.issue_date}</p></div>
            <div><span className="text-gray-400">Due Date</span><p className="font-medium">{detail.due_date}</p></div>
          </div>

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
                  <td className="py-2 font-medium">{li.service}</td>
                  <td className="py-2 text-gray-500">{li.description}</td>
                  <td className="py-2 text-right">{li.quantity}</td>
                  <td className="py-2 text-right">${(li.unit_price || 0).toLocaleString()}</td>
                  <td className="py-2 text-right font-medium">${(li.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-56 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${(detail.subtotal || 0).toLocaleString()}</span></div>
              {detail.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${detail.tax_amount.toLocaleString()}</span></div>}
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Total</span><span className="font-bold text-lg">${(detail.total || 0).toLocaleString()}</span></div>
            </div>
          </div>

          {detail.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-600">{detail.notes}</p></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Invoices</h2>
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} onClick={() => viewDetail(inv.id)}
              className="bg-white rounded-lg border border-gray-100 p-4 cursor-pointer hover:shadow-sm flex items-center justify-between">
              <div>
                <p className="font-mono font-medium text-sm">{inv.invoice_number}</p>
                <p className="text-xs text-gray-500">{inv.issue_date} &middot; Due {inv.due_date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${(inv.total || 0).toLocaleString()}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
