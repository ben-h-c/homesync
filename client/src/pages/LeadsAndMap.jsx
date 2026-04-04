import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Tooltip, useMap } from 'react-leaflet';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import UrgencyBadge from '../components/UrgencyBadge';
import { MapPin, List, Filter, Plus, X, ChevronDown, Search, Home, Calendar, DollarSign, Bookmark, ArrowUpDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const TRADES = ['All', 'Roofing', 'HVAC', 'Painting', 'Plumbing', 'General'];
const TRADE_API_MAP = { Roofing: 'roofing', HVAC: 'hvac', Painting: 'painting', Plumbing: 'plumbing' };

function getColor(score) {
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#EA580C';
  if (score >= 40) return '#EAB308';
  return '#16A34A';
}
function getRadius(homes) {
  if (homes >= 1000) return 16;
  if (homes >= 500) return 13;
  if (homes >= 200) return 10;
  if (homes >= 100) return 8;
  return 6;
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) map.fitBounds(positions, { padding: [30, 30] });
  }, [map, positions]);
  return null;
}

// ── Create Lead Modal ──
function CreateLeadModal({ subdivision, onClose, onCreated }) {
  const [serviceType, setServiceType] = useState('general');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchAPI('/leads', {
        method: 'POST',
        body: JSON.stringify({
          subdivision_id: subdivision.id,
          service_type: serviceType,
          estimated_homes: subdivision.total_homes,
          estimated_value: Math.round(subdivision.total_homes * 500),
          stage: 'new',
          notes,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Create Lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{subdivision.name}</p>
            <p className="text-xs text-gray-500">{subdivision.total_homes} homes &middot; Built {subdivision.year_built_mode} &middot; {subdivision.zip}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="general">General</option>
              <option value="roofing">Roofing</option>
              <option value="hvac">HVAC</option>
              <option value="painting">Painting</option>
              <option value="plumbing">Plumbing</option>
              <option value="pressure_washing">Pressure Washing</option>
              <option value="garage_door">Garage Door</option>
              <option value="landscaping">Landscaping</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Any initial notes about this opportunity..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
            <span>Est. value: <span className="font-medium text-gray-700">${(subdivision.total_homes * 500).toLocaleString()}</span></span>
            <span>Stage: <span className="font-medium text-blue-600">New</span></span>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 text-sm">
            {saving ? 'Creating...' : 'Add to Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function LeadsAndMap() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const isStarter = effectiveTier === 'starter';

  const [subdivisions, setSubdivisions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('map'); // map | list
  const [showFilters, setShowFilters] = useState(false);
  const [createLeadSub, setCreateLeadSub] = useState(null);

  // Filters
  const [trade, setTrade] = useState('All');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [zipFilter, setZipFilter] = useState('');
  const [urgencyMin, setUrgencyMin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [listSort, setListSort] = useState('maintenance_urgency_score');
  const [listOrder, setListOrder] = useState('desc');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: 'maintenance_urgency_score', order: 'desc' });
      if (trade !== 'All' && TRADE_API_MAP[trade]) params.set('trade', TRADE_API_MAP[trade]);
      if (yearMin) params.set('year_min', yearMin);
      if (yearMax) params.set('year_max', yearMax);
      if (zipFilter) params.set('zip', zipFilter);
      if (urgencyMin) params.set('urgency_min', urgencyMin);

      const [subs, leadsData] = await Promise.all([
        fetchAPI(`/subdivisions?${params.toString()}`),
        fetchAPI('/leads').catch(() => []),
      ]);
      setSubdivisions(subs);
      setLeads(leadsData);
    } catch { setSubdivisions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [trade, yearMin, yearMax, zipFilter, urgencyMin]);

  const leadSubIds = new Set(leads.map((l) => l.subdivision_id));

  // Filtered for search
  const filtered = useMemo(() => {
    let result = subdivisions;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.zip?.includes(q));
    }
    return result;
  }, [subdivisions, searchTerm]);

  // Map markers
  const markers = useMemo(() => filtered.filter((s) => s.latitude && s.longitude), [filtered]);
  const positions = markers.map((m) => [m.latitude, m.longitude]);

  // List data (apply tier limit)
  const listData = isStarter ? filtered.slice(0, 10) : filtered;
  const hiddenCount = isStarter ? Math.max(0, filtered.length - 10) : 0;

  // Sort for list view
  const sortedList = useMemo(() => {
    return [...listData].sort((a, b) => {
      const aVal = a[listSort] ?? 0;
      const bVal = b[listSort] ?? 0;
      return listOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [listData, listSort, listOrder]);

  const toggleSort = (field) => {
    if (listSort === field) setListOrder(listOrder === 'desc' ? 'asc' : 'desc');
    else { setListSort(field); setListOrder('desc'); }
  };

  // Unique zips for filter dropdown
  const zips = useMemo(() => [...new Set(subdivisions.map((s) => s.zip).filter(Boolean))].sort(), [subdivisions]);

  const stats = useMemo(() => ({
    total: markers.length,
    homes: markers.reduce((s, m) => s + (m.total_homes || 0), 0),
    critical: markers.filter((m) => (m.maintenance_urgency_score || 0) >= 80).length,
  }), [markers]);

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 mr-2">Leads & Map</h1>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subdivisions..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <MapPin size={14} className="inline mr-1" />Map
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <List size={14} className="inline mr-1" />List
          </button>
        </div>

        {/* Filter Toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          <Filter size={14} /> Filters
          {(trade !== 'All' || yearMin || yearMax || zipFilter || urgencyMin) && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {/* Stats */}
        <div className="ml-auto text-xs text-gray-500 hidden md:flex items-center gap-3">
          <span><span className="font-semibold text-gray-700">{stats.total}</span> subdivisions</span>
          <span><span className="font-semibold text-gray-700">{stats.homes.toLocaleString()}</span> homes</span>
          <span className="text-red-600"><span className="font-semibold">{stats.critical}</span> critical</span>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-end shrink-0 z-10">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Trade</label>
            <select value={trade} onChange={(e) => setTrade(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Year Built</label>
            <div className="flex items-center gap-1">
              <input type="number" placeholder="Min" value={yearMin} onChange={(e) => setYearMin(e.target.value)}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
              <span className="text-gray-400">-</span>
              <input type="number" placeholder="Max" value={yearMax} onChange={(e) => setYearMax(e.target.value)}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">ZIP Code</label>
            <select value={zipFilter} onChange={(e) => setZipFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All</option>
              {zips.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Min Urgency</label>
            <input type="number" placeholder="0" value={urgencyMin} onChange={(e) => setUrgencyMin(e.target.value)}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={() => { setTrade('All'); setYearMin(''); setYearMax(''); setZipFilter(''); setUrgencyMin(''); }}
            className="text-xs text-gray-500 hover:text-primary underline self-end pb-1.5">
            Clear all
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="text-sm text-gray-400 animate-pulse">Loading subdivisions...</div>
          </div>
        )}

        {/* ── MAP VIEW ── */}
        {view === 'map' && (
          <MapContainer center={[user?.user_latitude || 33.95, user?.user_longitude || -84.30]} zoom={10} style={{ height: '100%', width: '100%' }}
            zoomControl={true} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {positions.length > 0 && !user?.user_latitude && <FitBounds positions={positions} />}

            {/* Tier-based radius overlay */}
            {user?.user_latitude && user?.user_longitude && effectiveTier !== 'enterprise' && (() => {
              const radiusMap = { starter: 15, pro: 50 };
              const miles = radiusMap[effectiveTier] || 15;
              return (
                <Circle center={[user.user_latitude, user.user_longitude]}
                  radius={miles * 1609.34}
                  pathOptions={{ color: '#0E7C7B', fillColor: '#0E7C7B', fillOpacity: 0.04, weight: 1.5, dashArray: '6,4' }} />
              );
            })()}

            {markers.map((sub) => {
              const score = sub.maintenance_urgency_score || 0;
              const hasLead = leadSubIds.has(sub.id);
              return (
                <CircleMarker key={sub.id}
                  center={[sub.latitude, sub.longitude]}
                  radius={getRadius(sub.total_homes)}
                  fillColor={getColor(score)}
                  fillOpacity={0.8}
                  color={hasLead ? '#2563EB' : 'white'}
                  weight={hasLead ? 3 : 1.5}
                  opacity={1}>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <div className="text-xs">
                      <div className="font-bold">{sub.name}</div>
                      <div>{sub.total_homes} homes &middot; Built {sub.year_built_mode}</div>
                      <div>Urgency: {score}/100</div>
                      {hasLead && <div className="text-blue-600 font-medium">In your pipeline</div>}
                    </div>
                  </Tooltip>
                  <Popup maxWidth={320}>
                    <div className="min-w-[260px]">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">{sub.name}</h3>
                          <p className="text-xs text-gray-500">{sub.zip} &middot; {sub.total_homes} homes</p>
                        </div>
                        <UrgencyBadge score={score} size="sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Built</span>
                          <div className="font-medium">{sub.year_built_min}–{sub.year_built_max}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Avg Value</span>
                          <div className="font-medium">${(sub.avg_assessed_value || 0).toLocaleString()}</div>
                        </div>
                        {sub.hvac_pct_due > 0 && (
                          <div className="bg-red-50 rounded p-2">
                            <span className="text-gray-500">HVAC Due</span>
                            <div className="font-medium text-red-700">{sub.hvac_pct_due}%</div>
                          </div>
                        )}
                        {sub.roof_pct_due > 0 && (
                          <div className="bg-orange-50 rounded p-2">
                            <span className="text-gray-500">Roof Due</span>
                            <div className="font-medium text-orange-700">{sub.roof_pct_due}%</div>
                          </div>
                        )}
                        {sub.paint_pct_due > 0 && (
                          <div className="bg-yellow-50 rounded p-2">
                            <span className="text-gray-500">Paint Due</span>
                            <div className="font-medium text-yellow-700">{sub.paint_pct_due}%</div>
                          </div>
                        )}
                        {sub.water_heater_pct_due > 0 && (
                          <div className="bg-blue-50 rounded p-2">
                            <span className="text-gray-500">Water Heater</span>
                            <div className="font-medium text-blue-700">{sub.water_heater_pct_due}%</div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/subdivisions/${sub.id}`)}
                          className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                          View Details
                        </button>
                        {hasLead ? (
                          <button onClick={() => navigate('/leads')}
                            className="flex-1 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1">
                            <Bookmark size={12} /> In Pipeline
                          </button>
                        ) : (
                          <button onClick={() => setCreateLeadSub(sub)}
                            className="flex-1 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1">
                            <Plus size={12} /> Add Lead
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="overflow-auto h-full bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    { key: 'name', label: 'Subdivision', width: 'w-1/4' },
                    { key: 'total_homes', label: 'Homes' },
                    { key: 'year_built_mode', label: 'Built' },
                    { key: 'avg_assessed_value', label: 'Avg Value' },
                    { key: 'maintenance_urgency_score', label: 'Urgency' },
                    { key: 'zip', label: 'ZIP' },
                    { key: null, label: '' },
                  ].map((col) => (
                    <th key={col.label} className={`px-4 py-3 text-left font-medium text-gray-600 ${col.width || ''} ${col.key ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                      onClick={() => col.key && toggleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.key && listSort === col.key && (
                          <ArrowUpDown size={12} className="text-primary" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedList.map((sub, i) => {
                  const hasLead = leadSubIds.has(sub.id);
                  return (
                    <tr key={sub.id}
                      className={`border-b border-gray-100 hover:bg-teal-tint/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasLead && <Bookmark size={12} className="text-blue-500 shrink-0" />}
                          <div>
                            <button onClick={() => navigate(`/subdivisions/${sub.id}`)}
                              className="font-medium text-gray-900 hover:text-primary text-left">{sub.name}</button>
                            {sub.hoa_name && <p className="text-xs text-gray-400">{sub.hoa_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{sub.total_homes}</td>
                      <td className="px-4 py-3 text-gray-500">{sub.year_built_mode || '—'}</td>
                      <td className="px-4 py-3">{sub.avg_assessed_value ? `$${sub.avg_assessed_value.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3"><UrgencyBadge score={sub.maintenance_urgency_score} size="sm" /></td>
                      <td className="px-4 py-3 text-gray-500">{sub.zip}</td>
                      <td className="px-4 py-3">
                        {hasLead ? (
                          <span className="text-xs text-blue-600 font-medium">In Pipeline</span>
                        ) : (
                          <button onClick={() => setCreateLeadSub(sub)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                            <Plus size={12} /> Lead
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {hiddenCount > 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500 mb-2">{hiddenCount} more subdivisions available on Pro</p>
                      <button className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg">Upgrade to Pro</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {createLeadSub && (
        <CreateLeadModal
          subdivision={createLeadSub}
          onClose={() => setCreateLeadSub(null)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}
