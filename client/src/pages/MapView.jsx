import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { fetchAPI } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';
import 'leaflet/dist/leaflet.css';

// Approximate coordinates for subdivisions — spread across real Forsyth County / N. Atlanta geography
// Centered on Cumming, GA: 34.20, -84.14
const SUBDIVISION_COORDS = {
  // Forsyth 30041 (east/south Forsyth)
  'Creekstone Estates': [34.185, -84.095],
  'Three Chimneys Farm': [34.175, -84.080],
  'Bridgetown': [34.195, -84.105],
  'Sharon Springs': [34.210, -84.090],
  'Brookwood': [34.170, -84.115],
  'Hopewell Manor': [34.200, -84.075],
  'Brannon Oaks': [34.188, -84.120],
  'Hampton': [34.165, -84.100],
  'James Creek': [34.178, -84.070],
  'Ashebrooke': [34.160, -84.090],
  'Avington': [34.192, -84.065],
  'Andover Glen': [34.205, -84.085],
  'Autumn Cove': [34.215, -84.100],
  'Autumn Hills': [34.183, -84.130],
  'Brandon Hall': [34.168, -84.060],
  'Blackstock Mill': [34.200, -84.055],
  'Big Creek Township': [34.155, -84.075],
  'Brookside': [34.190, -84.050],
  'Old Atlanta Commons': [34.150, -84.085],
  'Coventry': [34.175, -84.045],
  'Arbor Meadows': [34.208, -84.070],
  'Ansley at Pilgrim Mill': [34.220, -84.080],
  'Arcanum Estates': [34.198, -84.040],
  'Barrett Downs': [34.162, -84.110],
  'Bridlewood': [34.172, -84.055],
  'Brighton Lake': [34.180, -84.140],
  'Bannister Park': [34.213, -84.115],
  'Blackburn Ridge': [34.195, -84.035],
  'Bay Colony': [34.225, -84.075],
  'Shiloh Manor': [34.185, -84.025],
  'Estates at Big Creek': [34.148, -84.070],
  'Barrett Landing': [34.158, -84.095],
  'Abbey Glen': [34.202, -84.125],
  'Avalon': [34.168, -84.040],
  'Arden Greens at Windermere': [34.140, -84.160],
  'Bennington at Windermere': [34.143, -84.155],
  'Caney Creek': [34.218, -84.060],
  // Forsyth 30040 (west Forsyth)
  'Windermere': [34.138, -84.165],
  'Castleberry Heights': [34.145, -84.175],
  'Bethelview Downs': [34.165, -84.170],
  'Vickery': [34.155, -84.185],
  'Canterbury Farms': [34.170, -84.180],
  'Bentley Ridge': [34.148, -84.195],
  'Polo Fields': [34.135, -84.180],
  'Concord Farms': [34.160, -84.190],
  'Fieldstone': [34.152, -84.200],
  // Forsyth 30028 (north Forsyth)
  'Legends at Settendown Creek': [34.255, -84.165],
  'Sawnee Mountain': [34.270, -84.150],
  'Churchill Crossing': [34.248, -84.140],
  // North Fulton — Alpharetta / Milton
  'Windward': [34.095, -84.275],
  'White Columns': [34.130, -84.300],
  'Kimball Farms': [34.085, -84.260],
  'Mayfair': [34.040, -84.195],
  // Gwinnett — Suwanee / Duluth / Buford
  'River Club': [34.060, -84.080],
  'Laurel Springs': [34.055, -84.070],
  'Morning View': [34.065, -84.060],
  'Huntington West': [34.100, -84.020],
  'Sugarloaf Country Club': [34.000, -84.100],
  // Cherokee — Canton / Woodstock
  'BridgeMill': [34.235, -84.465],
  'Towne Mill': [34.245, -84.480],
  'Eagle Watch': [34.115, -84.500],
  'Starr Lake': [34.075, -84.620],
  // Hall — Flowery Branch
  'Sterling on the Lake': [34.185, -83.920],
  'Traditions of Braselton': [34.105, -83.810],
};

function getUrgencyColor(score) {
  if (score >= 80) return '#C0392B'; // red
  if (score >= 60) return '#E67E22'; // orange
  if (score >= 40) return '#F1C40F'; // yellow
  return '#27AE60'; // green
}

function getMarkerRadius(homes) {
  if (homes >= 1000) return 18;
  if (homes >= 500) return 14;
  if (homes >= 200) return 11;
  if (homes >= 100) return 9;
  return 7;
}

// Auto-fit map to markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] });
    }
  }, [map, positions]);
  return null;
}

const PIPELINE_LABELS = {
  research: 'Research',
  contacted: 'Contacted',
  meeting_scheduled: 'Meeting Scheduled',
  pitched: 'Pitched',
  approved: 'Approved',
  active: 'Active',
  completed: 'Completed',
  declined: 'Declined',
};

export default function MapView() {
  const navigate = useNavigate();
  const [subdivisions, setSubdivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAPI('/subdivisions?sort=maintenance_urgency_score&order=desc')
      .then(setSubdivisions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markers = useMemo(() => {
    return subdivisions
      .map((sub) => {
        const coords = SUBDIVISION_COORDS[sub.name];
        if (!coords) return null;
        return { ...sub, lat: coords[0], lng: coords[1] };
      })
      .filter(Boolean)
      .filter((sub) => {
        if (searchTerm && !sub.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        const score = sub.maintenance_urgency_score || 0;
        if (filter === 'critical') return score >= 80;
        if (filter === 'high') return score >= 60;
        if (filter === 'medium') return score >= 40;
        if (filter === 'low') return score < 40;
        return true;
      });
  }, [subdivisions, filter, searchTerm]);

  const positions = markers.map((m) => [m.lat, m.lng]);

  const stats = useMemo(() => {
    const totalHomes = markers.reduce((sum, m) => sum + (m.total_homes || 0), 0);
    const critical = markers.filter((m) => (m.maintenance_urgency_score || 0) >= 80).length;
    return { total: markers.length, totalHomes, critical };
  }, [markers]);

  if (loading) return <div className="text-gray-500">Loading map...</div>;

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0 z-[1000]">
        <h1 className="text-lg font-bold mr-2">Subdivision Map</h1>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subdivisions..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex gap-1">
          {[
            { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
            { key: 'critical', label: 'Critical (80+)', color: 'bg-red-100 text-red-700' },
            { key: 'high', label: 'High (60+)', color: 'bg-orange-100 text-orange-700' },
            { key: 'medium', label: 'Medium (40+)', color: 'bg-yellow-100 text-yellow-700' },
            { key: 'low', label: 'OK (<40)', color: 'bg-green-100 text-green-700' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === key ? color + ' ring-2 ring-offset-1 ring-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-4 text-xs text-gray-500">
          <span><strong className="text-near-black">{stats.total}</strong> subdivisions</span>
          <span><strong className="text-near-black">{stats.totalHomes.toLocaleString()}</strong> homes</span>
          <span><strong className="text-red-600">{stats.critical}</strong> critical</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[34.17, -84.14]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.length > 0 && <FitBounds positions={positions} />}

          {markers.map((sub) => {
            const score = sub.maintenance_urgency_score || 0;
            const color = getUrgencyColor(score);
            const radius = getMarkerRadius(sub.total_homes || 0);

            return (
              <CircleMarker
                key={sub.id}
                center={[sub.lat, sub.lng]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: 2,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => navigate(`/subdivisions/${sub.id}`),
                }}
              >
                <Tooltip direction="top" offset={[0, -radius]} opacity={0.95} className="custom-tooltip">
                  <div className="min-w-[200px]">
                    <div className="font-bold text-sm mb-1">{sub.name}</div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Homes:</span>
                        <strong>{sub.total_homes?.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Built:</span>
                        <strong>{sub.year_built_min}–{sub.year_built_max} (mode {sub.year_built_mode})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Value:</span>
                        <strong>${sub.avg_assessed_value?.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Urgency:</span>
                        <strong style={{ color }}>{score}/100</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Pipeline:</span>
                        <strong className="capitalize">{PIPELINE_LABELS[sub.pipeline_stage] || sub.pipeline_stage}</strong>
                      </div>
                      {sub.hvac_pct_due > 0 && (
                        <div className="flex justify-between">
                          <span>HVAC Due:</span>
                          <strong className="text-red-600">{sub.hvac_pct_due}%</strong>
                        </div>
                      )}
                      {sub.roof_pct_due > 0 && (
                        <div className="flex justify-between">
                          <span>Roof Due:</span>
                          <strong className="text-red-600">{sub.roof_pct_due}%</strong>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1.5 border-t border-gray-200 pt-1">Click to view details</div>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="font-bold text-base mb-2">{sub.name}</h3>
                    <table className="text-xs w-full">
                      <tbody>
                        <tr><td className="text-gray-500 pr-3 py-0.5">Homes</td><td className="font-medium">{sub.total_homes?.toLocaleString()}</td></tr>
                        <tr><td className="text-gray-500 pr-3 py-0.5">Built</td><td className="font-medium">{sub.year_built_min}–{sub.year_built_max}</td></tr>
                        <tr><td className="text-gray-500 pr-3 py-0.5">Avg Value</td><td className="font-medium">${sub.avg_assessed_value?.toLocaleString()}</td></tr>
                        <tr><td className="text-gray-500 pr-3 py-0.5">Urgency</td><td className="font-bold" style={{ color }}>{score}/100</td></tr>
                        <tr><td className="text-gray-500 pr-3 py-0.5">ZIP</td><td className="font-medium">{sub.zip}</td></tr>
                        {sub.hoa_name && <tr><td className="text-gray-500 pr-3 py-0.5">HOA</td><td className="font-medium">{sub.hoa_name}</td></tr>}
                      </tbody>
                    </table>
                    <button
                      onClick={() => navigate(`/subdivisions/${sub.id}`)}
                      style={{ backgroundColor: '#0E7C7B' }}
                      className="mt-2 w-full text-white text-xs py-1.5 rounded font-medium hover:opacity-90"
                    >
                      View Subdivision →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] text-xs">
          <div className="font-semibold mb-1.5">Urgency</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600" /> Critical (80+)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /> High (60-79)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Medium (40-59)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> OK (&lt;40)</div>
          </div>
          <div className="font-semibold mt-2 mb-1">Size = Home Count</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="w-4 h-4 rounded-full bg-gray-400" />
            <span className="text-gray-500">50 → 500 → 2,500+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
