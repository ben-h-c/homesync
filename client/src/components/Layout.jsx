import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import { isDemoMode, onDemoModeChange, fetchAPI } from '../api/client';
import { X, Eye, EyeOff, Bell, MessageSquare, Receipt, FileText, Globe, Check } from 'lucide-react';
import useAuthStore from '../store/authStore';

const VIEW_AS_OPTIONS = [
  { value: null, label: 'Admin (Full Access)', color: 'bg-red-500' },
  { value: 'starter', label: 'Starter ($99/mo)', color: 'bg-gray-500' },
  { value: 'pro', label: 'Pro ($249/mo)', color: 'bg-blue-500' },
  { value: 'enterprise', label: 'Enterprise ($499/mo)', color: 'bg-purple-500' },
];

const NOTIF_ICONS = {
  client_message: MessageSquare,
  invoice_paid: Receipt,
  invoice_viewed: Receipt,
  change_order_response: FileText,
  portal_accessed: Globe,
  new_lead: Bell,
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const load = () => {
      fetchAPI('/notifications/unread-count').then((d) => setUnreadCount(d?.count || 0)).catch(() => {});
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchAPI('/notifications?limit=15').then((d) => setNotifications(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    await fetchAPI(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetchAPI('/notifications/read-all', { method: 'POST' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const handleClick = (n) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-1.5 text-white/60 hover:text-white transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              notifications.map((n) => {
                const Icon = NOTIF_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      !n.read_at ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      !n.read_at ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!n.read_at ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read_at && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [demo, setDemo] = useState(isDemoMode());
  const [dismissed, setDismissed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const setViewAsTier = useAuthStore((s) => s.setViewAsTier);
  const isAdmin = user?.role === 'admin';

  useEffect(() => onDemoModeChange(setDemo), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin "View As" banner */}
        {isAdmin && viewAsTier && (
          <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>
                Previewing as <strong>{VIEW_AS_OPTIONS.find(o => o.value === viewAsTier)?.label}</strong> — you are seeing what a {viewAsTier} subscriber sees.
              </span>
            </div>
            <button onClick={() => setViewAsTier(null)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium">
              <EyeOff size={14} /> Exit Preview
            </button>
          </div>
        )}

        {/* Demo banner */}
        {demo && !dismissed && (
          <div className="bg-amber/90 text-white text-sm px-4 py-2 flex items-center justify-between shrink-0">
            <span>Demo Mode — sample data shown. Run the server locally for full functionality.</span>
            <button onClick={() => setDismissed(true)}><X size={16} /></button>
          </div>
        )}

        {/* Top header with search */}
        <div className="bg-navy px-4 py-2.5 flex items-center gap-3 shrink-0">
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span className="md:hidden font-bold text-white shrink-0"><span className="text-primary">Home</span>Sync</span>

          {/* Global search */}
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>

          {/* Notification bell */}
          <NotificationBell />

          {/* Admin: View As tier switcher */}
          {isAdmin && (
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Eye size={14} className="text-white/50" />
              {VIEW_AS_OPTIONS.map((opt) => {
                const active = viewAsTier === opt.value;
                return (
                  <button
                    key={opt.value || 'admin'}
                    onClick={() => setViewAsTier(opt.value)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      active
                        ? `${opt.color} text-white shadow-sm`
                        : 'text-white/40 hover:text-white/70 hover:bg-white/10'
                    }`}
                    title={`Preview as ${opt.label}`}
                  >
                    {opt.value ? opt.value.charAt(0).toUpperCase() + opt.value.slice(1) : 'Admin'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-off-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
