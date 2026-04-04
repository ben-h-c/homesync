import { NavLink } from 'react-router-dom';
import { Send, FileText, CheckCircle } from 'lucide-react';

const tabs = [
  { to: '/email/compose', icon: Send, label: 'Compose' },
  { to: '/email/templates', icon: FileText, label: 'Templates' },
  { to: '/email/sent', icon: CheckCircle, label: 'Sent' },
];

export default function EmailNav() {
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-200">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`
          }
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
