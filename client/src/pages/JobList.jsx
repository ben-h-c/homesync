import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import { Plus, Search, Briefcase } from 'lucide-react';

const STATUS_STYLES = {
  not_started: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (serviceFilter) params.set('service_type', serviceFilter);
    if (search) params.set('search', search);
    try {
      const data = await fetchAPI(`/jobs?${params.toString()}`);
      setProjects(data);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, serviceFilter]);

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['in_progress', 'scheduled'].includes(p.status)).length,
    revenue: projects.reduce((s, p) => s + (p.total_revenue || 0), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} total &middot; {stats.active} active &middot; ${stats.revenue.toLocaleString()} revenue
          </p>
        </div>
        <button onClick={() => navigate('/jobs/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search projects or clients..."
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Services</option>
          <option value="roofing">Roofing</option>
          <option value="painting">Painting</option>
          <option value="hvac">HVAC</option>
          <option value="plumbing">Plumbing</option>
          <option value="general">General</option>
        </select>
        <button onClick={load} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Search</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Project</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Service</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Budget</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Dates</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No projects yet</p>
                <button onClick={() => navigate('/jobs/new')} className="mt-2 text-primary text-sm hover:underline">Create your first project</button>
              </td></tr>
            ) : projects.map((p, i) => (
              <tr key={p.id} onClick={() => navigate(`/jobs/${p.id}`)}
                className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.title || `Project #${p.id}`}</p>
                  {p.subdivision_name && <p className="text-xs text-gray-400">{p.subdivision_name}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.client_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs capitalize">{p.service_type?.replace('_', ' ') || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.not_started}`}>
                    {p.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{p.estimated_cost ? `$${p.estimated_cost.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {p.start_date || '—'} {p.end_date ? `→ ${p.end_date}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
