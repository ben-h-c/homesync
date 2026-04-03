import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Map, FolderKanban, GitBranch, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchAPI } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import ActivityFeed from '../components/ActivityFeed';

const PIPELINE_COLORS_MAP = {
  research: '#6B7280',
  contacted: '#3B82F6',
  meeting_scheduled: '#6366F1',
  pitched: '#8B5CF6',
  approved: '#0E7C7B',
  active: '#27AE60',
  completed: '#166534',
  declined: '#C0392B',
};

function MetricCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-teal-tint flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
      {sub && <div className="text-xs text-gray-400 mt-2">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAPI('/reports/dashboard-stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Failed to load: {error}</div>
    </div>
  );
  if (!stats) return <div className="text-gray-500">Loading dashboard...</div>;

  const pipelineData = stats.pipelineDistribution.map((p) => ({
    name: (p.pipeline_stage || 'research').replace(/_/g, ' '),
    value: p.count,
    fill: PIPELINE_COLORS_MAP[p.pipeline_stage] || '#6B7280',
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Home} label="Total Properties" value={stats.totalProperties} />
        <MetricCard icon={Map} label="Subdivisions Tracked" value={stats.totalSubdivisions} />
        <MetricCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects}
          sub={stats.totalSignups > 0 ? `${stats.totalSignups} homes signed up` : null} />
        <MetricCard icon={GitBranch} label="Pipeline Active" value={stats.pipelineActive}
          sub="HOAs in active stages" />
      </div>

      {/* Hot subdivisions */}
      {stats.hotSubdivisions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="font-semibold mb-3">Hot Subdivisions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs">
                <th className="py-2 text-left">Subdivision</th>
                <th className="py-2 text-left">Homes</th>
                <th className="py-2 text-left">Built</th>
                <th className="py-2 text-left">Urgency</th>
                <th className="py-2 text-left">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {stats.hotSubdivisions.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 cursor-pointer hover:bg-teal-tint"
                  onClick={() => navigate(`/subdivisions/${s.id}`)}>
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2">{s.total_homes}</td>
                  <td className="py-2">{s.year_built_mode}</td>
                  <td className="py-2"><UrgencyBadge score={s.maintenance_urgency_score} size="sm" /></td>
                  <td className="py-2 capitalize text-xs">{(s.pipeline_stage || 'research').replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {stats.byYear.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold mb-3">Homes by Build Year</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byYear}>
                <XAxis dataKey="year_built" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0E7C7B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {pipelineData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold mb-3">Pipeline Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={90} paddingAngle={2} label={({ name, value }) => `${name} (${value})`}
                  fontSize={11}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom row: Activity + Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          <ActivityFeed activities={stats.recentActivities} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber" /> Action Items</h2>
          {stats.followUps.length === 0 && stats.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-gray-400">No action items right now.</p>
          ) : (
            <div className="space-y-2">
              {stats.followUps.map((s) => (
                <div key={`fu-${s.id}`} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-teal-tint rounded px-1"
                  onClick={() => navigate(`/subdivisions/${s.id}`)}>
                  <div className="text-sm"><span className="font-medium">{s.name}</span> — needs follow-up</div>
                  <span className="text-xs text-gray-400 capitalize">{(s.pipeline_stage || '').replace(/_/g, ' ')}</span>
                </div>
              ))}
              {stats.upcomingDeadlines.map((p) => (
                <div key={`dl-${p.id}`} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-teal-tint rounded px-1"
                  onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="text-sm"><span className="font-medium">{p.name}</span></div>
                  <span className="text-xs text-gray-400">{p.sign_up_deadline ? `Deadline: ${new Date(p.sign_up_deadline).toLocaleDateString()}` : p.service_start_date ? `Starts: ${new Date(p.service_start_date).toLocaleDateString()}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
