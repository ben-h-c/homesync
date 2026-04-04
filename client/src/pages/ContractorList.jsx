import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronDown, ChevronUp, Phone, Mail, FileText } from 'lucide-react';
import { fetchAPI } from '../api/client';

export default function ContractorList() {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

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
    if (!s) return [];
    if (Array.isArray(s)) return s;
    try {
      let parsed = JSON.parse(s);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

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
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-8"></th>
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
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : contractors.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No contractors yet.</td></tr>
            ) : contractors.map((c, i) => {
              const services = parseServices(c.contractor_services);
              const isOpen = expanded === c.id;
              return (
                <React.Fragment key={c.id}>
                  <tr
                    className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    onClick={() => toggleExpand(c.id)}>
                    <td className="px-4 py-2.5 text-gray-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
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
                  {isOpen && (
                    <tr className="bg-gray-50/80">
                      <td colSpan={7} className="px-8 py-4">
                        <div className="grid grid-cols-2 gap-4 max-w-3xl">
                          {c.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <a href={`tel:${c.phone}`} className="text-primary hover:underline">{c.phone}</a>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail size={14} className="text-gray-400" />
                              <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a>
                            </div>
                          )}
                          {c.contractor_license_number && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText size={14} className="text-gray-400" />
                              <span>License: {c.contractor_license_number}</span>
                            </div>
                          )}
                          {c.contractor_insurance_verified && (
                            <div className="text-sm text-green-600 font-medium">Insurance Verified</div>
                          )}
                        </div>
                        {c.notes && (
                          <p className="mt-3 text-sm text-gray-600 max-w-3xl">{c.notes}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
