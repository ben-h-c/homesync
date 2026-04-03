const db = require('../db');

const CURRENT_YEAR = 2026;

// Maps maintenance_rules.system_name → property column holding install year
const SYSTEM_COLUMN_MAP = {
  hvac: 'hvac_year_installed',
  water_heater: 'water_heater_year',
  roof: 'roof_year',
  exterior_paint: 'exterior_paint_year',
};

// Systems used for the weighted urgency score
const URGENCY_WEIGHTS = {
  hvac: 0.30,
  roof: 0.25,
  water_heater: 0.20,
  exterior_paint: 0.15,
  // Remaining 10% is average of non-recurring "other" systems
};

function assessProperty(property, rule) {
  const col = SYSTEM_COLUMN_MAP[rule.system_name];
  const yearInstalled = col ? property[col] : property.year_built;
  if (!yearInstalled) return { status: 'UNKNOWN', urgency_score: 0, years_remaining: null };

  const systemAge = CURRENT_YEAR - yearInstalled;
  const yearsRemaining = rule.avg_lifespan_years - systemAge;

  if (yearsRemaining <= -rule.critical_years_after) {
    return { status: 'CRITICAL', urgency_score: 100, years_remaining: yearsRemaining };
  } else if (yearsRemaining <= 0) {
    return { status: 'DUE_NOW', urgency_score: 80, years_remaining: yearsRemaining };
  } else if (yearsRemaining <= rule.warning_years_before) {
    return { status: 'UPCOMING', urgency_score: 60, years_remaining: yearsRemaining };
  } else {
    return { status: 'OK', urgency_score: Math.max(0, 40 - (yearsRemaining * 3)), years_remaining: yearsRemaining };
  }
}

async function forecastSubdivision(subdivisionId) {
  const subdivision = await db('subdivisions').where('id', subdivisionId).first();
  if (!subdivision) return null;

  const properties = await db('properties').where('subdivision', subdivision.name);
  if (properties.length === 0) return null;

  const rules = await db('maintenance_rules').select('*');

  const systems = {};
  let totalSavings = 0;

  for (const rule of rules) {
    const counts = { CRITICAL: 0, DUE_NOW: 0, UPCOMING: 0, OK: 0, UNKNOWN: 0 };
    const scores = [];

    for (const prop of properties) {
      const result = assessProperty(prop, rule);
      counts[result.status]++;
      scores.push(result.urgency_score);
    }

    const totalAssessed = properties.length - counts.UNKNOWN;
    const needingService = counts.CRITICAL + counts.DUE_NOW;
    const avgCostRetail = (rule.avg_replacement_cost_low + rule.avg_replacement_cost_high) / 2;
    const avgCostGroup = avgCostRetail * (1 - rule.group_discount_typical);
    const savingsPerHome = avgCostRetail - avgCostGroup;
    const totalSavingsPotential = Math.round(savingsPerHome * needingService);

    systems[rule.system_name] = {
      display_name: rule.display_name,
      pct_critical: totalAssessed > 0 ? Math.round((counts.CRITICAL / totalAssessed) * 100) : 0,
      pct_due_now: totalAssessed > 0 ? Math.round((counts.DUE_NOW / totalAssessed) * 100) : 0,
      pct_upcoming: totalAssessed > 0 ? Math.round((counts.UPCOMING / totalAssessed) * 100) : 0,
      pct_ok: totalAssessed > 0 ? Math.round((counts.OK / totalAssessed) * 100) : 0,
      estimated_homes_needing_service: needingService,
      avg_cost_retail: Math.round(avgCostRetail),
      avg_cost_group: Math.round(avgCostGroup),
      savings_per_home: Math.round(savingsPerHome),
      total_savings_potential: totalSavingsPotential,
      avg_urgency: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      is_recurring: !!rule.is_recurring,
    };

    totalSavings += totalSavingsPotential;
  }

  // Weighted urgency score
  let weightedScore = 0;
  let otherScores = [];

  for (const [systemName, data] of Object.entries(systems)) {
    if (URGENCY_WEIGHTS[systemName] !== undefined) {
      weightedScore += data.avg_urgency * URGENCY_WEIGHTS[systemName];
    } else if (!data.is_recurring) {
      otherScores.push(data.avg_urgency);
    }
  }
  // "Other" gets 10%
  if (otherScores.length > 0) {
    const otherAvg = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
    weightedScore += otherAvg * 0.10;
  }
  weightedScore = Math.round(weightedScore);

  // Top recommendation: find system with most homes needing service (excluding recurring)
  let topSystem = null;
  let topHomes = 0;
  for (const [systemName, data] of Object.entries(systems)) {
    if (!data.is_recurring && data.estimated_homes_needing_service > topHomes) {
      topHomes = data.estimated_homes_needing_service;
      topSystem = { name: systemName, ...data };
    }
  }

  const pctDue = topSystem && properties.length > 0
    ? Math.round((topSystem.estimated_homes_needing_service / properties.length) * 100)
    : 0;

  const topRecommendation = topSystem
    ? `${topSystem.display_name} — ${pctDue}% of homes (${topSystem.estimated_homes_needing_service} of ${properties.length}) are at or past end-of-life`
    : null;

  return {
    subdivision: subdivision.name,
    subdivision_id: subdivision.id,
    total_homes: properties.length,
    year_built_mode: subdivision.year_built_mode,
    urgency_score: weightedScore,
    systems,
    top_recommendation: topRecommendation,
    top_system: topSystem ? topSystem.name : null,
    top_system_display: topSystem ? topSystem.display_name : null,
    top_system_homes: topHomes,
    top_system_savings: topSystem ? topSystem.total_savings_potential : 0,
    top_system_savings_per_home: topSystem ? topSystem.savings_per_home : 0,
    estimated_total_savings: Math.round(totalSavings),
  };
}

async function recalculateAll() {
  const subdivisions = await db('subdivisions').select('*');
  const results = [];

  for (const sub of subdivisions) {
    const forecast = await forecastSubdivision(sub.id);
    if (!forecast) continue;

    // Update subdivision row with computed scores
    await db('subdivisions').where('id', sub.id).update({
      maintenance_urgency_score: forecast.urgency_score,
      hvac_pct_due: forecast.systems.hvac
        ? forecast.systems.hvac.pct_critical + forecast.systems.hvac.pct_due_now : 0,
      roof_pct_due: forecast.systems.roof
        ? forecast.systems.roof.pct_critical + forecast.systems.roof.pct_due_now : 0,
      water_heater_pct_due: forecast.systems.water_heater
        ? forecast.systems.water_heater.pct_critical + forecast.systems.water_heater.pct_due_now : 0,
      paint_pct_due: forecast.systems.exterior_paint
        ? forecast.systems.exterior_paint.pct_critical + forecast.systems.exterior_paint.pct_due_now : 0,
      updated_at: new Date().toISOString(),
    });

    results.push({ id: sub.id, name: sub.name, urgency_score: forecast.urgency_score });
  }

  return results;
}

module.exports = { assessProperty, forecastSubdivision, recalculateAll, CURRENT_YEAR };
