import { useEffect } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import usePortalStore from '../../store/portalStore';
import { FileText, MessageSquare, ClipboardCheck, Home, AlertCircle } from 'lucide-react';

export default function PortalLayout() {
  const { token } = useParams();
  const location = useLocation();
  const { data, loading, error, loadPortal } = usePortalStore();

  useEffect(() => { if (token) loadPortal(token); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-4">Contact your contractor for a new portal link.</p>
        </div>
      </div>
    );
  }

  const contractor = data?.contractor;
  const job = data?.job;
  const basePath = `/portal/${token}`;
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const nav = [
    { to: basePath, label: 'Overview', icon: Home, exact: true },
    { to: `${basePath}/invoices`, label: 'Invoices', icon: FileText },
    { to: `${basePath}/changes`, label: 'Changes', icon: ClipboardCheck },
    { to: `${basePath}/messages`, label: 'Messages', icon: MessageSquare, badge: data?.unreadMessages },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{contractor?.company || 'HomeSync'}</p>
            <p className="text-xs text-gray-500">Client Portal</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-700">{data?.clientName || data?.clientEmail}</p>
            <p className="text-xs text-gray-400">{job?.title}</p>
          </div>
        </div>

        {/* Nav */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 -mb-px">
          {nav.map((item) => {
            const active = item.exact ? location.pathname === item.to : isActive(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <item.icon size={14} />
                {item.label}
                {item.badge > 0 && <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-6 mt-8 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Powered by HomeSync &middot; {contractor?.company} &middot; {contractor?.phone}
        </p>
      </footer>
    </div>
  );
}
