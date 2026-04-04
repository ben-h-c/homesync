import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { fetchAPI } from '../api/client';
import 'leaflet/dist/leaflet.css';

// Approximate coordinates for subdivisions spread across real geography
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
  // North Fulton
  'Windward': [34.095, -84.275],
  'White Columns': [34.130, -84.300],
  'Kimball Farms': [34.085, -84.260],
  'Mayfair': [34.040, -84.195],
  // Gwinnett
  'River Club': [34.060, -84.080],
  'Laurel Springs': [34.055, -84.070],
  'Morning View': [34.065, -84.060],
  'Huntington West': [34.100, -84.020],
  'Sugarloaf Country Club': [34.000, -84.100],
  // Cherokee
  'BridgeMill': [34.235, -84.465],
  'Towne Mill': [34.245, -84.480],
  'Eagle Watch': [34.115, -84.500],
  'Starr Lake': [34.075, -84.620],
  // Hall
  'Sterling on the Lake': [34.185, -83.920],
  'Traditions of Braselton': [34.105, -83.810],
  // ── Phase 2: Forsyth 30041 (remaining) ──
  'Creekstone Estates': [34.185, -84.095],
  'Blackstock Mill': [34.200, -84.055],
  'Bridlewood': [34.172, -84.055],
  'Brookside': [34.190, -84.050],
  'Avalon': [34.168, -84.040],
  'Shiloh Manor': [34.185, -84.025],
  'Estates at Big Creek': [34.148, -84.070],
  'Barrett Landing': [34.158, -84.095],
  'Abbey Glen': [34.202, -84.125],
  // ── Phase 2: Cobb County ──
  'Lost Mountain Estates': [33.960, -84.680],
  'Kennesley': [33.970, -84.670],
  'Harrison Park': [33.950, -84.600],
  'Chestnut Springs': [33.990, -84.530],
  'Lassiter Landing': [34.030, -84.470],
  'Indian Hills Country Club': [33.980, -84.420],
  'Walton High Estates': [34.010, -84.440],
  'Marietta Country Club': [33.955, -84.610],
  'Walkers Ridge': [33.945, -84.580],
  'Bells Ferry Crossing': [34.000, -84.540],
  'Piedmont Oaks': [33.985, -84.510],
  // ── Phase 2: Gwinnett ──
  'Hamilton Mill': [34.000, -83.880],
  'Archer Ridge': [34.010, -83.890],
  'Peachtree Corners South': [33.970, -84.220],
  'Berkeley Hills': [33.960, -84.230],
  'Amberfield': [33.975, -84.210],
  // ── Phase 2: Cherokee ──
  'Governors Preserve': [34.220, -84.470],
  'Highland Gate': [34.100, -84.500],
  'Woodstock Downtown District': [34.095, -84.520],
  // ── Phase 2: North Fulton ──
  'Crabapple Station': [34.070, -84.360],
  'Cogburn Crossing': [34.080, -84.320],
  'Cambridge High District': [34.090, -84.300],
  'Crooked Creek': [34.075, -84.280],
  'Country Club of the South': [34.100, -84.255],
  'Concord Hall': [34.088, -84.265],
  // ── Phase 2: DeKalb County ──
  'Smoke Rise': [33.810, -84.140],
  'Briarlake Forest': [33.800, -84.320],
};

function getUrgencyColor(score) {
  if (score >= 80) return '#C0392B';
  if (score >= 60) return '#E67E22';
  if (score >= 40) return '#F1C40F';
  return '#27AE60';
}

function getMarkerRadius(homes) {
  if (homes >= 1000) return 18;
  if (homes >= 500) return 14;
  if (homes >= 200) return 11;
  if (homes >= 100) return 9;
  return 7;
}

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
  research: 'Research', contacted: 'Contacted', meeting_scheduled: 'Meeting Scheduled',
  pitched: 'Pitched', approved: 'Approved', active: 'Active', completed: 'Completed', declined: 'Declined',
};

export default function MapView() {
  const navigate = useNavigate();
  const [subdivisions, setSubdivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

  if (loading) return <div className="p-6 text-gray-500">Loading map...</div>;

  return (
    <div style={{ height: 'calc(100vh - 52px)', margin: '-1rem', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', zIndex: 1000, position: 'relative' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '8px' }}>Subdivision Map</h1>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subdivisions..."
          style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', width: '180px' }}
        />

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'all', label: 'All', bg: '#f3f4f6' },
            { key: 'critical', label: 'Critical', bg: '#fee2e2' },
            { key: 'high', label: 'High', bg: '#ffedd5' },
            { key: 'medium', label: 'Medium', bg: '#fef9c3' },
            { key: 'low', label: 'OK', bg: '#dcfce7' },
          ].map(({ key, label, bg }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                background: filter === key ? bg : '#f9fafb',
                border: filter === key ? '2px solid #9ca3af' : '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
          <span><strong style={{ color: '#1a1a2e' }}>{stats.total}</strong> subdivisions</span>
          <span><strong style={{ color: '#1a1a2e' }}>{stats.totalHomes.toLocaleString()}</strong> homes</span>
          <span><strong style={{ color: '#C0392B' }}>{stats.critical}</strong> critical</span>
        </div>
      </div>

      {/* Map container — takes remaining height */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[34.17, -84.14]}
          zoom={11}
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
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
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{sub.name}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Homes:</span><strong>{sub.total_homes?.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Built:</span><strong>{sub.year_built_min}–{sub.year_built_max}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Avg Value:</span><strong>${sub.avg_assessed_value?.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Urgency:</span><strong style={{ color }}>{score}/100</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pipeline:</span><strong>{PIPELINE_LABELS[sub.pipeline_stage] || sub.pipeline_stage}</strong>
                      </div>
                      {sub.hvac_pct_due > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>HVAC Due:</span><strong style={{ color: '#C0392B' }}>{sub.hvac_pct_due}%</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', borderTop: '1px solid #e5e7eb', paddingTop: '3px' }}>Click to view details</div>
                  </div>
                </Tooltip>

                <Popup>
                  <div style={{ minWidth: '220px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px' }}>{sub.name}</h3>
                    <table style={{ fontSize: '12px', width: '100%' }}>
                      <tbody>
                        <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>Homes</td><td style={{ fontWeight: 500 }}>{sub.total_homes?.toLocaleString()}</td></tr>
                        <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>Built</td><td style={{ fontWeight: 500 }}>{sub.year_built_min}–{sub.year_built_max} (mode {sub.year_built_mode})</td></tr>
                        <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>Avg Value</td><td style={{ fontWeight: 500 }}>${sub.avg_assessed_value?.toLocaleString()}</td></tr>
                        <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>Urgency</td><td style={{ fontWeight: 'bold', color }}>{score}/100</td></tr>
                        <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>ZIP</td><td style={{ fontWeight: 500 }}>{sub.zip}</td></tr>
                        {sub.hoa_name && <tr><td style={{ color: '#6b7280', paddingRight: '12px', paddingBottom: '2px' }}>HOA</td><td style={{ fontWeight: 500 }}>{sub.hoa_name}</td></tr>}
                      </tbody>
                    </table>
                    <button
                      onClick={() => navigate(`/subdivisions/${sub.id}`)}
                      style={{ marginTop: '8px', width: '100%', background: '#0E7C7B', color: 'white', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
                    >
                      View Subdivision Details →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', padding: '12px 14px', zIndex: 1000, fontSize: '11px' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Urgency</div>
          {[
            { color: '#C0392B', label: 'Critical (80+)' },
            { color: '#E67E22', label: 'High (60-79)' },
            { color: '#F1C40F', label: 'Medium (40-59)' },
            { color: '#27AE60', label: 'OK (<40)' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </div>
          ))}
          <div style={{ fontWeight: 600, marginTop: '8px', marginBottom: '4px' }}>Size = Home Count</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />
            <span style={{ color: '#6b7280', marginLeft: '4px' }}>50 → 500 → 2,500+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
