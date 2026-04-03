import { Mail, Phone, Calendar, Megaphone, RotateCcw, StickyNote, ArrowRightLeft, Wrench } from 'lucide-react';

const TYPE_CONFIG = {
  email_sent: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Email Sent' },
  phone_call: { icon: Phone, color: 'text-green-500', bg: 'bg-green-50', label: 'Phone Call' },
  meeting: { icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Meeting' },
  pitch: { icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pitch' },
  follow_up: { icon: RotateCcw, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Follow Up' },
  note: { icon: StickyNote, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Note' },
  status_change: { icon: ArrowRightLeft, color: 'text-teal-500', bg: 'bg-teal-50', label: 'Status Change' },
  project_update: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Project Update' },
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityFeed({ activities, emptyMessage = 'No activities yet.' }) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-gray-400">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note;
        const Icon = config.icon;
        return (
          <div key={activity.id} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon size={14} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">{config.label}</span>
                <span className="text-xs text-gray-400">{formatTime(activity.created_at)}</span>
              </div>
              {activity.subject && (
                <div className="text-sm font-medium mt-0.5">{activity.subject}</div>
              )}
              {activity.description && (
                <div className="text-sm text-gray-600 mt-0.5">{activity.description}</div>
              )}
              {activity.outcome && (
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  activity.outcome === 'positive' ? 'bg-green-100 text-green-700' :
                  activity.outcome === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.outcome}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
