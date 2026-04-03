import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download } from 'lucide-react';
import { fetchAPI } from '../api/client';

const TYPE_LABELS = {
  hoa_board: 'HOA Board',
  contractor: 'Contractor',
  homeowner: 'Homeowner',
  other: 'Other',
};

const TYPE_COLORS = {
  hoa_board: 'bg-indigo-100 text-indigo-700',
  contractor: 'bg-orange-100 text-orange-700',
  homeowner: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function ContactList() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subdivisionFilter, setSubdivisionFilter] = useState('');
  const [subdivisions, setSubdivisions] = useState([]);

  useEffect(() => {
    fetchAPI('/subdivisions').then((s) => setSubdivisions(s.map((x) => x.name))).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [typeFilter, subdivisionFilter]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (subdivisionFilter) params.set('subdivision', subdivisionFilter);
    if (search) params.set('search', search);
    try {
      const data = await fetchAPI(`/contacts?${params.toString()}`);
      setContacts(data);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <button onClick={() => { const h=['first_name','last_name','type','email','phone','company','subdivision']; const csv=[h.join(','),...contacts.map(c=>h.map(k=>`"${(c[k]??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); const b=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='contacts.csv'; a.click(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
          <button onClick={() => navigate('/contacts/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, company..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={subdivisionFilter} onChange={(e) => setSubdivisionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Subdivisions</option>
            {subdivisions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Company / Subdivision</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Last Contacted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No contacts found.</td></tr>
            ) : contacts.map((c, i) => (
              <tr key={c.id}
                className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                onClick={() => navigate(`/contacts/${c.id}`)}>
                <td className="px-4 py-2.5 font-medium">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.type] || TYPE_COLORS.other}`}>
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{c.company || c.subdivision || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{c.email || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{c.phone || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{formatDate(c.last_contacted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
