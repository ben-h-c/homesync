import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import { Plus, Trash2, Save, Send, Download, ArrowLeft } from 'lucide-react';

const emptyItem = { service: '', description: '', quantity: 1, unit_price: 0 };
const TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
];

function dueDate(issueDate, terms) {
  if (!issueDate) return '';
  const d = new Date(issueDate);
  const days = { net_15: 15, net_30: 30, net_45: 45, due_on_receipt: 0 };
  d.setDate(d.getDate() + (days[terms] ?? 30));
  return d.toISOString().split('T')[0];
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id && id !== 'new';
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    invoice_number: '', customer_name: '', customer_email: '', customer_address: '', customer_phone: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: dueDate(new Date().toISOString().split('T')[0], 'net_30'),
    tax_rate: user?.default_tax_rate || 0,
    discount_amount: 0, discount_type: 'flat',
    payment_terms: 'net_30', notes: '', status: 'draft', job_id: searchParams.get('job_id') || '',
  });
  const [items, setItems] = useState([{ ...emptyItem }]);

  useEffect(() => {
    if (isEdit) {
      fetchAPI(`/invoices/${id}`).then((inv) => {
        const { line_items, status_history, ...rest } = inv;
        setForm(rest);
        setItems(line_items?.length > 0 ? line_items : [{ ...emptyItem }]);
      });
    } else {
      fetchAPI('/invoices/next-number').then((d) => setForm((f) => ({ ...f, invoice_number: d.invoice_number })));
    }
    fetchAPI('/jobs').then(setProjects).catch(() => {});
  }, [id]);

  // Auto-fill from project
  useEffect(() => {
    const jobId = form.job_id || searchParams.get('job_id');
    if (jobId && projects.length > 0 && !isEdit) {
      const project = projects.find((p) => String(p.id) === String(jobId));
      if (project) {
        setForm((f) => ({
          ...f, job_id: project.id,
          customer_name: f.customer_name || project.client_name || '',
          customer_email: f.customer_email || project.client_email || '',
          customer_phone: f.customer_phone || project.client_phone || '',
          customer_address: f.customer_address || project.client_address || '',
        }));
      }
    }
  }, [projects, form.job_id]);

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };
  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, li) => s + (li.quantity || 0) * (li.unit_price || 0), 0);
  const discount = form.discount_type === 'percent' ? subtotal * (form.discount_amount || 0) / 100 : (form.discount_amount || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(afterDiscount * (form.tax_rate || 0) * 100) / 100;
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

  const handleTermsChange = (terms) => {
    setForm((f) => ({ ...f, payment_terms: terms, due_date: dueDate(f.issue_date, terms) }));
  };

  const handleSave = async (sendAfter = false) => {
    setSaving(true);
    try {
      const payload = { ...form, line_items: items, discount_amount: parseFloat(form.discount_amount) || 0 };
      let result;
      if (isEdit) {
        result = await fetchAPI(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        result = await fetchAPI('/invoices', { method: 'POST', body: JSON.stringify(payload) });
      }
      if (sendAfter && result.id) {
        await fetchAPI(`/invoices/${result.id}/send`, { method: 'POST' });
      }
      navigate('/invoices');
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/invoices')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft size={14} /> Back to Invoices
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? `Edit ${form.invoice_number}` : 'New Invoice'}</h1>

      <div className="space-y-6">
        {/* From (contractor info) */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">{user?.company_name || 'Your Business'}</p>
              <p className="text-xs text-gray-500">{user?.email} {user?.phone ? `• ${user.phone}` : ''}</p>
            </div>
            <span className="text-xs text-gray-400">From your account settings</span>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice #</label>
              <input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value, due_date: dueDate(e.target.value, form.payment_terms) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
              <select value={form.payment_terms} onChange={(e) => handleTermsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          {/* Link to Project */}
          {projects.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Linked Project (optional)</label>
              <select value={form.job_id || ''} onChange={(e) => setForm({ ...form, job_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">— No project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || `Project #${p.id}`} ({p.client_name || 'No client'})</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Bill To */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Bill To</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Customer name *" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <input placeholder="Email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Address" value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 w-1/4">Service</th>
                  <th className="text-left py-2 w-1/3">Description</th>
                  <th className="text-left py-2 w-16">Qty</th>
                  <th className="text-left py-2 w-24">Price</th>
                  <th className="text-right py-2 w-24">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-2">
                      <input value={item.service} onChange={(e) => updateItem(i, 'service', e.target.value)}
                        placeholder="e.g. Roof Replacement" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Details..." className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="py-1.5 text-right font-medium text-gray-700">${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}</td>
                    <td className="py-1.5 pl-2">
                      {items.length > 1 && <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            <Plus size={14} /> Add line item
          </button>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-end">
            <div className="w-80 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">${subtotal.toLocaleString()}</span></div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Discount</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="0" step="0.01" value={form.discount_amount}
                    onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right" />
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="px-1 py-1 border border-gray-200 rounded text-xs bg-white">
                    <option value="flat">$</option>
                    <option value="percent">%</option>
                  </select>
                  <span className="font-medium text-red-500 w-20 text-right">-${discount.toLocaleString()}</span>
                </div>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Tax</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="1" step="0.001" value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right" placeholder="0.07" />
                  <span className="text-xs text-gray-400">rate</span>
                  <span className="font-medium w-20 text-right">${taxAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Notes</h2>
          <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2} placeholder="Payment instructions, thank you message, special terms..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || !form.customer_name}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            <Send size={16} /> Save & Send
          </button>
          <button onClick={() => navigate('/invoices')} className="text-sm text-gray-500 hover:underline ml-auto">Cancel</button>
        </div>
      </div>
    </div>
  );
}
