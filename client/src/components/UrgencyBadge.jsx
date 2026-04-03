export default function UrgencyBadge({ score, size = 'md' }) {
  const s = score ?? 0;
  let color = 'bg-green-500 text-white';
  let label = 'OK';
  if (s >= 80) { color = 'bg-red-600 text-white'; label = 'CRITICAL'; }
  else if (s >= 60) { color = 'bg-orange-500 text-white'; label = 'DUE NOW'; }
  else if (s >= 40) { color = 'bg-yellow-400 text-gray-900'; label = 'UPCOMING'; }

  if (size === 'sm') {
    return (
      <span className={`inline-block w-10 text-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
        {Math.round(s)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${color}`}>
      {Math.round(s)} <span className="font-medium text-xs opacity-80">{label}</span>
    </span>
  );
}
