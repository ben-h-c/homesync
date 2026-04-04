import { Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';

const TIER_NAMES = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const TIER_COLORS = { starter: 'bg-gray-100 text-gray-600', pro: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' };

export function TierBadge({ tier }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[tier] || TIER_COLORS.starter}`}>
      {TIER_NAMES[tier] || tier}
    </span>
  );
}

export default function TierGate({ requiredTier, featureName, children }) {
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const LEVELS = { starter: 1, pro: 2, enterprise: 3 };
  const hasAccess = (LEVELS[effectiveTier] || 0) >= (LEVELS[requiredTier] || 0);

  if (hasAccess) return children;

  return (
    <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <Lock size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700">
          {featureName || 'This feature'} requires <TierBadge tier={requiredTier} />
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Upgrade your plan to access {featureName || 'this feature'}.
          {requiredTier === 'pro' && ' Pro gives you unlimited subdivision views, email outreach, CRM pipeline, and project management.'}
          {requiredTier === 'enterprise' && ' Enterprise gives you multi-metro access, API access, and team seats.'}
        </p>
        <button className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          Upgrade to {TIER_NAMES[requiredTier]}
        </button>
      </div>
    </div>
  );
}
