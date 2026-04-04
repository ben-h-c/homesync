import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, MessageSquare, Receipt, LogOut } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export default function ClientProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const clientUser = JSON.parse(localStorage.getItem('clientUser') || 'null');
  const clientToken = localStorage.getItem('clientToken');

  useEffect(() => {
    if (!clientToken) { navigate('/portal/login'); return; }
    fetch(`${API_BASE}/portal/my-projects`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Auth failed'); return r.json(); })
      .then(setProjects)
      .catch(() => { localStorage.removeItem('clientToken'); localStorage.removeItem('clientUser'); navigate('/portal/login'); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    navigate('/portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-dark">Home</span><span className="text-primary">Sync</span>
          </h1>
          <p className="text-xs text-gray-500">Client Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, {clientUser?.first_name || clientUser?.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-6">Your Projects</h2>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No active projects found.</p>
            <p className="text-sm text-gray-400 mt-1">When a contractor shares a project portal with you, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.job_id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {p.contractor?.company || p.contractor?.name} &middot; {p.service_type}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{(p.status || 'active').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.unread_messages > 0 && (
                      <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                        <MessageSquare size={12} /> {p.unread_messages} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-sm text-primary font-medium">
                  Note: Use your original portal link to view full project details, invoices, and messages.
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
