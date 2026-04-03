const db = require('../db');

function mode(arr) {
  if (arr.length === 0) return null;
  const freq = {};
  let maxCount = 0;
  let modeVal = arr[0];
  for (const val of arr) {
    freq[val] = (freq[val] || 0) + 1;
    if (freq[val] > maxCount) {
      maxCount = freq[val];
      modeVal = val;
    }
  }
  return modeVal;
}

async function aggregateAll() {
  const groups = await db('properties')
    .select('subdivision')
    .whereNotNull('subdivision')
    .where('subdivision', '!=', '')
    .groupBy('subdivision');

  const results = [];
  for (const { subdivision } of groups) {
    const result = await aggregateSubdivision(subdivision);
    results.push(result);
  }
  return results;
}

async function aggregateSubdivision(subdivisionName) {
  const properties = await db('properties').where('subdivision', subdivisionName);
  if (properties.length === 0) return null;

  const yearBuilts = properties.map((p) => p.year_built).filter(Boolean);
  const sqfts = properties.map((p) => p.square_footage).filter(Boolean);
  const values = properties.map((p) => p.assessed_value).filter(Boolean);
  const zips = properties.map((p) => p.zip).filter(Boolean);

  const stats = {
    name: subdivisionName,
    zip: mode(zips),
    total_homes: properties.length,
    year_built_min: yearBuilts.length ? Math.min(...yearBuilts) : null,
    year_built_max: yearBuilts.length ? Math.max(...yearBuilts) : null,
    year_built_mode: yearBuilts.length ? mode(yearBuilts) : null,
    avg_square_footage: sqfts.length ? Math.round(sqfts.reduce((a, b) => a + b, 0) / sqfts.length) : null,
    avg_assessed_value: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null,
    updated_at: new Date().toISOString(),
  };

  const existing = await db('subdivisions').where('name', subdivisionName).first();
  if (existing) {
    await db('subdivisions').where('id', existing.id).update(stats);
    return { ...existing, ...stats };
  } else {
    const [id] = await db('subdivisions').insert(stats);
    return { id, ...stats };
  }
}

module.exports = { aggregateAll, aggregateSubdivision };
