import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import { Plus, Lock } from 'lucide-react';
import UrgencyBadge from '../components/UrgencyBadge';
import useAuthStore from '../store/authStore';

const STARTER_LIMIT = 10;

export default function Opportunities() {
  const navigate = useNavigate();
  const [subdivisions, setSubdivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const isStarter = effectiveTier === 'starter';

  useEffect(() => {
    fetchAPI('/subdivisions?sort=maintenance_urgency_score&order=desc')
      .then(setSubdivisions).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const visibleSubs = isStarter ? subdivisions.slice(0, STARTER_LIMIT) : subdivisions;
  const hiddenCount = isStarter ? Math.max(0, subdivisions.length - STARTER_LIMIT) : 0;

  const addToLeads = async (sub, e) => {
    e.stopPropagation();
    try {
      await fetchAPI('/leads', {
        method: 'POST',
        body: JSON.stringify({
          subdivision_id: sub.id,
          service_type: 'general',
          estimated_homes: sub.total_homes,
          estimated_value: Math.round(sub.total_homes * 500),
          stage: 'new',
        }),
      });
      alert(`${sub.name} added to your pipeline!`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Opportunities</h1>
      <p className="text-sm text-gray-500 mb-6">Subdivisions with homes needing maintenance — sorted by urgency</p>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subdivision</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Homes</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Built</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Avg Value</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Urgency</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ZIP</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : visibleSubs.map((sub, i) => (
              <tr key={sub.id}
                className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                onClick={() => navigate(`/subdivisions/${sub.id}`)}>
                <td className="px-4 py-3 font-medium">{sub.name}</td>
                <td className="px-4 py-3">{sub.total_homes}</td>
                <td className="px-4 py-3">{sub.year_built_mode || '—'}</td>
                <td className="px-4 py-3">{sub.avg_assessed_value ? `$${sub.avg_assessed_value.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3"><UrgencyBadge score={sub.maintenance_urgency_score} size="sm" /></td>
                <td className="px-4 py-3 text-gray-500">{sub.zip}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => addToLeads(sub, e)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                    <Plus size={12} /> Add Lead
                  </button>
                </td>
              </tr>
            ))}
            {hiddenCount > 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center bg-gradient-to-b from-white to-gray-50">
                  <div className="flex flex-col items-center gap-2">
                    <Lock size={20} className="text-gray-400" />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">{hiddenCount} more subdivisions</span> available on Pro
                    </p>
                    <button className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90">
                      Upgrade to Pro — $249/mo
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
