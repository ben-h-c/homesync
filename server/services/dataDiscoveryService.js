const db = require('../db');

/**
 * Discover new subdivisions in specified ZIP codes using Nominatim (OpenStreetMap) geocoding.
 * Cross-references existing subdivisions to avoid duplicates.
 * Returns an array of discovered subdivision candidates.
 */
async function discoverSubdivisions(zipCodes, jobId) {
  await db('data_discovery_jobs').where('id', jobId).update({ status: 'running', started_at: new Date().toISOString() });

  const results = [];
  const existing = await db('subdivisions').select('name', 'zip');
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

  for (const zip of zipCodes) {
    try {
      // Rate limit: Nominatim requires 1 req/sec
      await new Promise(r => setTimeout(r, 1100));

      // Search for residential areas/neighborhoods in this ZIP
      const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=20&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'WeDoneDoIt/1.0 (data-discovery)' } });
      const data = await res.json();

      for (const place of data) {
        const name = place.address?.neighbourhood || place.address?.suburb || place.address?.hamlet || null;
        if (!name) continue;
        if (existingNames.has(name.toLowerCase())) continue;

        results.push({
          name,
          zip,
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          county: place.address?.county || null,
          state: place.address?.state || null,
          source: 'nominatim',
          discovered_at: new Date().toISOString(),
        });
        existingNames.add(name.toLowerCase());
      }

      // Also search for specific subdivision/residential area features
      await new Promise(r => setTimeout(r, 1100));
      const url2 = `https://nominatim.openstreetmap.org/search?q=subdivision+${encodeURIComponent(zip)}&country=US&format=json&limit=15&addressdetails=1`;
      const res2 = await fetch(url2, { headers: { 'User-Agent': 'WeDoneDoIt/1.0 (data-discovery)' } });
      const data2 = await res2.json();

      for (const place of data2) {
        const name = place.address?.neighbourhood || place.address?.suburb || place.display_name?.split(',')[0] || null;
        if (!name || name.length > 60) continue;
        if (existingNames.has(name.toLowerCase())) continue;

        results.push({
          name,
          zip,
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          county: place.address?.county || null,
          state: place.address?.state || null,
          source: 'nominatim-search',
          discovered_at: new Date().toISOString(),
        });
        existingNames.add(name.toLowerCase());
      }
    } catch (err) {
      console.error(`[Discovery] Error searching ZIP ${zip}:`, err.message);
    }
  }

  // Update job status
  await db('data_discovery_jobs').where('id', jobId).update({
    status: 'completed',
    results_count: results.length,
    results: JSON.stringify(results),
    completed_at: new Date().toISOString(),
  });

  return results;
}

/**
 * Import approved discovered subdivisions into the subdivisions table.
 */
async function importDiscoveredSubdivisions(subdivisionCandidates) {
  const imported = [];
  for (const candidate of subdivisionCandidates) {
    const exists = await db('subdivisions').where('name', candidate.name).first();
    if (exists) continue;

    const [id] = await db('subdivisions').insert({
      name: candidate.name,
      zip: candidate.zip,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      total_homes: 0, // will need data enrichment
      maintenance_urgency_score: 0,
    });
    imported.push({ id, ...candidate });
  }
  return imported;
}

module.exports = { discoverSubdivisions, importDiscoveredSubdivisions };
