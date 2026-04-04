import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import { Plus, Download, Search, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search) params.set('search', search);
    const [inv, st] = await Promise.all([
      fetchAPI(`/invoices?${params.toString()}`).catch(() => []),
      fetchAPI('/invoices/stats').catch(() => null),
    ]);
    setInvoices(inv);
    setStats(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const outstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => navigate('/invoices/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-500" />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <p className="text-xl font-bold text-green-600">${paidTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-blue-600">${outstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-xs text-gray-500">Overdue</span>
          </div>
          <p className="text-xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-primary" />
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${(stats?.monthlyRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search invoices..."
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        {['', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Project</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Due</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center">
                <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No invoices yet</p>
                <button onClick={() => navigate('/invoices/new')} className="mt-2 text-primary text-sm hover:underline">Create your first invoice</button>
              </td></tr>
            ) : invoices.map((inv, i) => (
              <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}
                className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-gray-700">{inv.customer_name || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{inv.project_title || '—'}</td>
                <td className="px-4 py-3 font-medium">${(inv.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{inv.issue_date || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{inv.due_date || '—'}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={async () => {
                      try {
                        const token = localStorage.getItem('accessToken');
                        const res = await fetch(`http://localhost:3001/api/invoices/${inv.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${inv.invoice_number || 'invoice'}.pdf`; a.click();
                        URL.revokeObjectURL(url);
                      } catch { alert('Failed to download PDF'); }
                    }}
                    className="text-gray-400 hover:text-primary" title="Download PDF">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
