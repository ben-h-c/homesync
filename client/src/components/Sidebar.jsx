import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Map,
  Users,
  GitBranch,
  FolderKanban,
  Wrench,
  Mail,
  FileText,
  Upload,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subdivisions', icon: Map, label: 'Subdivisions' },
  { to: '/properties', icon: Home, label: 'Properties' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/contractors', icon: Wrench, label: 'Contractors' },
  { to: '/email/compose', icon: Mail, label: 'Email' },
  { to: '/reports/forecast', icon: FileText, label: 'Reports' },
  { to: '/import', icon: Upload, label: 'Import' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-navy text-white flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">Home</span>Sync
        </h1>
        <p className="text-xs text-white/50 mt-0.5">Predictive Maintenance</p>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary border-r-2 border-primary font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
