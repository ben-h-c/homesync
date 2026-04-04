import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Map,
  MapPin,
  Users,
  GitBranch,
  FolderKanban,
  Wrench,
  Mail,
  FileText,
  Upload,
  Settings,
  X,
  LogOut,
  Lock,
  Compass,
  Receipt,
  Briefcase,
  Shield,
  MessageSquare,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../api/client';

const TIER_COLORS = { starter: 'bg-gray-500', pro: 'bg-blue-500', enterprise: 'bg-purple-500' };
const TIER_NAMES = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };

// Contractor-focused navigation
const contractorNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Compass, label: 'Leads & Map', activePrefix: '/opportunities' },
  { to: '/jobs', icon: Briefcase, label: 'Projects' },
  { to: '/leads', icon: GitBranch, label: 'Pipeline' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', badge: 'messages' },
  { to: '/invoices', icon: Receipt, label: 'Invoicing', activePrefix: '/invoices' },
  { to: '/email/compose', icon: Mail, label: 'Marketing', activePrefix: '/email', minTier: 'pro' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// Admin navigation (original)
const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Compass, label: 'Opportunities' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/subdivisions', icon: Map, label: 'Subdivisions' },
  { to: '/properties', icon: Home, label: 'Properties' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/leads', icon: GitBranch, label: 'Pipeline' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', badge: 'messages' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/contractors', icon: Wrench, label: 'Contractors' },
  { to: '/email/compose', icon: Mail, label: 'Email', activePrefix: '/email' },
  { to: '/reports/forecast', icon: FileText, label: 'Reports' },
  { to: '/import', icon: Upload, label: 'Import' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const hasTier = (t) => { const L={starter:1,pro:2,enterprise:3}; return (L[effectiveTier]||0) >= (L[t]||0); };

  // Unread message count
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!user) return;
    const load = () => fetchAPI('/jobs/messages/unread-count').then((d) => setUnreadMessages(d?.count || 0)).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayTier = viewAsTier || (user?.role === 'admin' ? 'admin' : (user?.subscription_tier || 'starter'));

  return (
    <aside className={`
      w-60 bg-navy text-white flex flex-col shrink-0 print:hidden
      fixed inset-y-0 left-0 z-40 transition-transform md:relative md:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">WeDone</span>DoIt
          </h1>
          <p className="text-xs text-white/50 mt-0.5">Contractor Platform</p>
        </div>
        <button onClick={onClose} className="md:hidden text-white/50 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {(user?.role === 'admin' && !viewAsTier ? adminNav : contractorNav).map(({ to, icon: Icon, label, activePrefix, minTier, badge }) => {
          const active = activePrefix
            ? pathname.startsWith(activePrefix)
            : to === '/'
              ? pathname === '/'
              : pathname.startsWith(to);
          const locked = minTier && !hasTier(minTier);
          const badgeCount = badge === 'messages' ? unreadMessages : 0;
          return (
            <NavLink
              key={to}
              to={locked ? '#' : to}
              end={to === '/'}
              onClick={(e) => { if (locked) { e.preventDefault(); return; } onClose(); }}
              className={
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-primary/20 text-primary border-r-2 border-primary font-medium'
                    : locked
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
              {locked && <Lock size={12} className="ml-auto text-white/30" />}
              {badgeCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold text-primary">
              {user.first_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.first_name} {user.last_name || ''}</p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                displayTier === 'admin' ? 'bg-red-500/20 text-red-300' :
                displayTier === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                displayTier === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {viewAsTier ? `viewing: ${displayTier}` : displayTier}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
