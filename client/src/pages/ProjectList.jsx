import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchAPI } from '../api/client';

const STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-700',
  sign_ups_open: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [subdivisions, setSubdivisions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAPI('/projects'),
      fetchAPI('/subdivisions'),
    ]).then(([p, s]) => {
      setProjects(p);
      const subMap = {};
      for (const sub of s) subMap[sub.id] = sub.name;
      setSubdivisions(subMap);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => navigate('/projects/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subdivision</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Service</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sign-ups</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Dates</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No projects yet.</td></tr>
            ) : projects.map((p, i) => (
              <tr key={p.id}
                className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                onClick={() => navigate(`/projects/${p.id}`)}>
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{subdivisions[p.subdivision_id] || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600 capitalize">{(p.service_type || '').replace(/_/g, ' ')}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.planning}`}>
                    {(p.status || 'planning').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-2.5">{p.homes_signed_up || 0}{p.total_eligible_homes ? ` / ${p.total_eligible_homes}` : ''}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(p.service_start_date)} – {formatDate(p.service_end_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
