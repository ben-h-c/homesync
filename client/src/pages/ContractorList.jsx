import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { fetchAPI } from '../api/client';

export default function ContractorList() {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'contractor' });
    if (search) params.set('search', search);
    try {
      const data = await fetchAPI(`/contacts?${params.toString()}`);
      setContractors(data);
    } catch { setContractors([]); }
    finally { setLoading(false); }
  };

  const parseServices = (s) => {
    try { return JSON.parse(s || '[]'); } catch { return []; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <button onClick={() => navigate('/contacts/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
          <Plus size={16} /> Add Contractor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contractors..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Company</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Services</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rating</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Group Discount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : contractors.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No contractors yet.</td></tr>
            ) : contractors.map((c, i) => {
              const services = parseServices(c.contractor_services);
              return (
                <tr key={c.id}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  onClick={() => navigate(`/contacts/${c.id}`)}>
                  <td className="px-4 py-2.5 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.company || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {services.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">{s.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.contractor_rating ? `${'★'.repeat(Math.round(c.contractor_rating))}${'☆'.repeat(5 - Math.round(c.contractor_rating))}` : '—'}
                  </td>
                  <td className="px-4 py-2.5">{c.contractor_group_rate_discount ? `${Math.round(c.contractor_group_rate_discount * 100)}%` : '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.phone || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
