export default function MaintenanceBar({ system }) {
  const { display_name, pct_critical, pct_due_now, pct_upcoming, pct_ok,
    estimated_homes_needing_service, total_savings_potential } = system;

  const segments = [
    { pct: pct_critical, color: 'bg-red-500', label: 'Critical' },
    { pct: pct_due_now, color: 'bg-orange-400', label: 'Due Now' },
    { pct: pct_upcoming, color: 'bg-yellow-400', label: 'Upcoming' },
    { pct: pct_ok, color: 'bg-green-500', label: 'OK' },
  ];

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-semibold text-sm">{display_name}</h4>
        <div className="flex gap-3 text-xs text-gray-500">
          {segments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
              {seg.label} {seg.pct}%
            </span>
          ))}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="w-full h-7 rounded-full overflow-hidden flex bg-gray-100">
        {segments.map((seg) =>
          seg.pct > 0 ? (
            <div
              key={seg.label}
              className={`${seg.color} h-full flex items-center justify-center text-[10px] font-bold text-white transition-all`}
              style={{ width: `${seg.pct}%` }}
              title={`${seg.label}: ${seg.pct}%`}
            >
              {seg.pct >= 8 ? `${seg.pct}%` : ''}
            </div>
          ) : null
        )}
      </div>

      {/* Stats below bar */}
      <div className="flex gap-4 mt-1.5 text-xs text-gray-600">
        <span>
          <strong>{estimated_homes_needing_service}</strong> homes need service now
        </span>
        {total_savings_potential > 0 && (
          <span>
            Potential savings: <strong className="text-primary">${total_savings_potential.toLocaleString()}</strong> at group rates
          </span>
        )}
      </div>
    </div>
  );
}
