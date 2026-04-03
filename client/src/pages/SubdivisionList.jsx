import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';

const PIPELINE_COLORS = {
  research: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  meeting_scheduled: 'bg-indigo-100 text-indigo-700',
  pitched: 'bg-purple-100 text-purple-700',
  approved: 'bg-teal-100 text-teal-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-200 text-green-800',
  declined: 'bg-red-100 text-red-700',
};

function PipelineBadge({ stage }) {
  const label = (stage || 'research').replace(/_/g, ' ');
  const color = PIPELINE_COLORS[stage] || PIPELINE_COLORS.research;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {label}
    </span>
  );
}


export default function SubdivisionList() {
  const navigate = useNavigate();
  const [subdivisions, setSubdivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('maintenance_urgency_score');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    load();
  }, [sort, order]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/subdivisions?sort=${sort}&order=${order}`);
      setSubdivisions(data);
    } catch {
      setSubdivisions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return <span className="text-gray-300 ml-1">&#x21C5;</span>;
    return <span className="text-primary ml-1">{order === 'asc' ? '&#x25B2;' : '&#x25BC;'}</span>;
  };

  const cols = [
    { key: 'name', label: 'Name', width: '30%' },
    { key: 'total_homes', label: 'Homes', width: '12%' },
    { key: 'year_built_mode', label: 'Built (Mode)', width: '14%' },
    { key: 'avg_assessed_value', label: 'Avg Value', width: '15%' },
    { key: 'maintenance_urgency_score', label: 'Urgency', width: '12%' },
    { key: 'pipeline_stage', label: 'Pipeline', width: '17%' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subdivisions</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {cols.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon field={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : subdivisions.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-gray-500">No subdivisions yet. Import property data first.</td></tr>
            ) : (
              subdivisions.map((sub, i) => (
                <tr
                  key={sub.id}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  onClick={() => navigate(`/subdivisions/${sub.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{sub.name}</td>
                  <td className="px-4 py-3">{sub.total_homes}</td>
                  <td className="px-4 py-3">{sub.year_built_mode || '—'}</td>
                  <td className="px-4 py-3">{sub.avg_assessed_value ? `$${sub.avg_assessed_value.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3"><UrgencyBadge score={sub.maintenance_urgency_score} size="sm" /></td>
                  <td className="px-4 py-3"><PipelineBadge stage={sub.pipeline_stage} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
