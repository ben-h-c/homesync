import usePortalStore from '../../store/portalStore';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Calendar, Phone, Mail } from 'lucide-react';

const STATUS_LABELS = {
  not_started: 'Not Started', scheduled: 'Scheduled', in_progress: 'In Progress',
  on_hold: 'On Hold', completed: 'Completed', cancelled: 'Cancelled',
};
const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-blue-100 text-blue-700', on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-500',
};

export default function PortalDashboard() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, portalFetch } = usePortalStore();
  const [timeline, setTimeline] = useState([]);

  useEffect(() => { portalFetch('/timeline').then(setTimeline).catch(() => {}); }, []);

  if (!data) return null;
  const { job, contractor } = data;
  const progress = job.total_homes ? Math.round((job.homes_completed / job.total_homes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] || STATUS_COLORS.not_started}`}>
              {STATUS_LABELS[job.status] || job.status}
            </span>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="capitalize">{job.service_type?.replace(/_/g, ' ')}</p>
            {job.total_homes && <p>{job.total_homes} homes</p>}
          </div>
        </div>

        {/* Progress bar */}
        {job.total_homes > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{job.homes_completed || 0} of {job.total_homes} homes ({progress}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {job.start_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400" />
              <span>Start: <span className="font-medium">{job.start_date}</span></span>
            </div>
          )}
          {job.end_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400" />
              <span>Est. completion: <span className="font-medium">{job.end_date}</span></span>
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Scope of Work</p>
            <p className="text-sm text-gray-700">{job.description}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Recent Updates</h2>
          {timeline.length > 0 ? (
            <div className="space-y-3">
              {timeline.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{a.description}</p>
                    <p className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No updates yet.</p>
          )}
        </div>

        {/* Contractor Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Your Contractor</h2>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-gray-900">{contractor.company || contractor.name}</p>
              {contractor.company && <p className="text-sm text-gray-500">{contractor.name}</p>}
            </div>
            {contractor.phone && (
              <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone size={14} /> {contractor.phone}
              </a>
            )}
            {contractor.email && (
              <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail size={14} /> {contractor.email}
              </a>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <button onClick={() => navigate(`/portal/${token}/invoices`)}
              className="w-full py-2 text-sm font-medium bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-700">View Invoices</button>
            <button onClick={() => navigate(`/portal/${token}/changes`)}
              className="w-full py-2 text-sm font-medium bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-700">Review Changes</button>
            <button onClick={() => navigate(`/portal/${token}/messages`)}
              className="w-full py-2 text-sm font-medium bg-primary/10 rounded-lg hover:bg-primary/20 text-primary">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}
