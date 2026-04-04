import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import {
  Compass, GitBranch, DollarSign, Briefcase, FileText, TrendingUp,
  ArrowRight, Lock, Plus, Mail, MapPin, Clock, CalendarDays, ChevronRight,
} from 'lucide-react';
import UrgencyBadge from '../components/UrgencyBadge';
import useAuthStore from '../store/authStore';

const STAGE_COLORS = {
  new: 'bg-gray-200 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  proposal_sent: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const isStarter = effectiveTier === 'starter';
  const hasTier = (t) => { const L = { starter: 1, pro: 2, enterprise: 3 }; return (L[effectiveTier] || 0) >= (L[t] || 0); };

  useEffect(() => {
    fetchAPI('/contractor/dashboard').then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const totalLeads = (data.leadsByStage || []).reduce((s, l) => s + l.count, 0);
  const pipelineValue = data.proposalValue || 0;
  const visibleOpps = isStarter ? (data.opportunities || []).slice(0, 3) : (data.opportunities || []).slice(0, 6);

  // Pipeline stage counts for mini summary
  const stageCounts = {};
  (data.leadsByStage || []).forEach((s) => { stageCounts[s.stage] = s.count; });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.company_name || data.company || 'Your Business'}
          {(user?.trade_category || data.trade) && <> &middot; <span className="capitalize">{user?.trade_category || data.trade}</span></>}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/jobs')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Briefcase size={18} className="text-blue-600" /></div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.upcomingJobs?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active Projects</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/leads')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 rounded-lg"><GitBranch size={18} className="text-amber-600" /></div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending Leads</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-50 rounded-lg"><DollarSign size={18} className="text-green-600" /></div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-green-600">${(data.revenueThisMonth || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Revenue This Month</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/leads')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp size={18} className="text-purple-600" /></div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${pipelineValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pipeline Value</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Create Project', icon: Plus, to: '/jobs', color: 'bg-blue-600 text-white hover:bg-blue-700' },
          { label: 'New Invoice', icon: FileText, to: '/invoices/new', color: 'bg-green-600 text-white hover:bg-green-700' },
          { label: 'Send Campaign', icon: Mail, to: '/email/compose', color: 'bg-purple-600 text-white hover:bg-purple-700', minTier: 'pro' },
          { label: 'View Map', icon: MapPin, to: '/map', color: 'bg-gray-700 text-white hover:bg-gray-800' },
        ].map((action) => {
          const locked = action.minTier && !hasTier(action.minTier);
          return (
            <button key={action.label} onClick={() => !locked && navigate(action.to)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : action.color}`}>
              {locked ? <Lock size={14} /> : <action.icon size={14} />}
              {action.label}
              {locked && <span className="text-[10px] bg-gray-300 px-1.5 py-0.5 rounded">PRO</span>}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Activity + Opportunities (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mini Pipeline Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pipeline Overview</h2>
              <button onClick={() => navigate('/leads')} className="text-xs text-primary hover:underline flex items-center gap-1">
                Full pipeline <ArrowRight size={12} />
              </button>
            </div>
            {totalLeads > 0 ? (
              <>
                {/* Stage bar */}
                <div className="flex rounded-full overflow-hidden h-3 bg-gray-100 mb-3">
                  {['new', 'contacted', 'proposal_sent', 'negotiating', 'won'].map((stage) => {
                    const count = stageCounts[stage] || 0;
                    if (count === 0) return null;
                    const pct = (count / totalLeads) * 100;
                    const colors = { new: 'bg-gray-400', contacted: 'bg-blue-400', proposal_sent: 'bg-purple-400', negotiating: 'bg-amber-400', won: 'bg-green-500' };
                    return <div key={stage} className={`${colors[stage]} transition-all`} style={{ width: `${pct}%` }} title={`${stage}: ${count}`} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-3">
                  {['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost'].map((stage) => {
                    const count = stageCounts[stage] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={stage} className="flex items-center gap-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-600'}`}>
                          {stage.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">No leads in pipeline. <button onClick={() => navigate('/opportunities')} className="text-primary hover:underline">Find opportunities</button> to get started.</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {/* Invoice activity */}
              {(data.invoicesByStatus || []).filter(s => s.count > 0).map((inv) => (
                <div key={inv.status} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`p-1.5 rounded-lg ${inv.status === 'paid' ? 'bg-green-50' : inv.status === 'sent' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <DollarSign size={14} className={inv.status === 'paid' ? 'text-green-500' : inv.status === 'sent' ? 'text-blue-500' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{inv.count}</span> invoice{inv.count !== 1 ? 's' : ''} {inv.status}
                    </p>
                    <p className="text-xs text-gray-400">Total: ${(inv.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {/* Lead activity */}
              {data.recentLeads?.slice(0, 3).map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="p-1.5 rounded-lg bg-amber-50"><GitBranch size={14} className="text-amber-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">Lead: <span className="font-medium">{lead.subdivision_name || 'Unknown'}</span></p>
                    <p className="text-xs text-gray-400">{lead.service_type} &middot; ${(lead.estimated_value || 0).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STAGE_COLORS[lead.stage] || 'bg-gray-100 text-gray-600'}`}>{lead.stage?.replace('_', ' ')}</span>
                </div>
              ))}
              {/* Job activity */}
              {data.upcomingJobs?.slice(0, 2).map((job) => (
                <div key={job.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="p-1.5 rounded-lg bg-blue-50"><Briefcase size={14} className="text-blue-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">Job: <span className="font-medium">{job.title || job.subdivision_name}</span></p>
                    <p className="text-xs text-gray-400">{job.homes_completed || 0}/{job.total_homes || 0} homes &middot; {job.status?.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
              {/* Empty state */}
              {!data.recentLeads?.length && !data.upcomingJobs?.length && !(data.invoicesByStatus || []).some(s => s.count > 0) && (
                <p className="text-sm text-gray-400 py-2">No recent activity. Start by browsing opportunities or creating an invoice.</p>
              )}
            </div>
          </div>

          {/* Top Opportunities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Top Opportunities</h2>
              <button onClick={() => navigate('/opportunities')} className="text-xs text-primary hover:underline flex items-center gap-1">
                Browse all <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {visibleOpps.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/subdivisions/${sub.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-500">{sub.total_homes} homes &middot; Built {sub.year_built_mode} &middot; {sub.zip}</p>
                  </div>
                  <UrgencyBadge score={sub.maintenance_urgency_score} size="sm" />
                </div>
              ))}
              {isStarter && (data.opportunities || []).length > 3 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-400 mb-1">{(data.opportunities || []).length - 3} more available on Pro</p>
                  <button className="text-xs text-primary font-medium hover:underline">Upgrade to Pro</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tasks + Jobs */}
        <div className="space-y-6">
          {/* Upcoming Tasks / Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Upcoming</h2>
            {data.upcomingJobs?.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingJobs.map((job) => (
                  <div key={job.id} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-blue-50 rounded-lg shrink-0">
                      <CalendarDays size={14} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.title || job.subdivision_name}</p>
                      <p className="text-xs text-gray-500">{job.service_type}</p>
                      {job.start_date && (
                        <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> Starts {job.start_date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No upcoming deadlines</p>
                <p className="text-xs text-gray-300 mt-0.5">Jobs and follow-ups will appear here</p>
              </div>
            )}
          </div>

          {/* Outstanding Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Invoices</h2>
              <button onClick={() => navigate('/invoices')} className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Revenue this month</span>
                <span className="text-sm font-bold text-green-600">${(data.revenueThisMonth || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">Outstanding</span>
                <span className="text-sm font-bold text-amber-600">${(data.outstanding || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <span className="text-sm text-gray-600">Active proposals</span>
                <span className="text-sm font-bold text-gray-900">{data.activeProposals || 0}</span>
              </div>
            </div>
            <button onClick={() => navigate('/invoices/new')}
              className="w-full mt-3 py-2 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={12} /> New Invoice
            </button>
          </div>

          {/* Follow-ups Needed */}
          {data.recentLeads?.filter(l => l.next_follow_up)?.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-3">Follow-ups Needed</h2>
              <div className="space-y-2">
                {data.recentLeads.filter(l => l.next_follow_up).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <span className="text-sm text-amber-900 font-medium">{lead.subdivision_name}</span>
                    <span className="text-xs text-amber-600">{lead.next_follow_up}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
