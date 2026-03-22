const { query } = require('../config/db');

function ratio(numerator, denominator) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(2));
}

function buildInsights(totalCatches, landedCount, topSpecies, topBaits, topRigs, landingRate) {
  const insights = [];

  if (totalCatches === 0) {
    insights.push('No catches logged yet. Add catches to unlock personal pattern insights.');
    return insights;
  }

  if (topSpecies.length > 0) {
    insights.push(`Most of your catches were ${topSpecies[0].species}.`);
  }

  if (topBaits.length > 0 && topBaits[0].bait) {
    insights.push(`${topBaits[0].bait} appears most frequently in your logged catches.`);
  }

  if (topRigs.length > 0 && topRigs[0].rigName) {
    insights.push(`${topRigs[0].rigName} appears most frequently in your logged catches.`);
  }

  insights.push(`Your current landing rate is ${Math.round(landingRate * 100)}% (${landedCount}/${totalCatches}).`);

  return insights.slice(0, 3);
}

async function getCatchSummary(userId) {
  const totalRes = await query('SELECT COUNT(*)::int AS count FROM catches WHERE user_id = $1', [userId]);
  const landedRes = await query('SELECT COUNT(*)::int AS count FROM catches WHERE user_id = $1 AND landed = true', [userId]);

  const speciesRes = await query(
    `SELECT species, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1
     GROUP BY species
     ORDER BY count DESC, species ASC
     LIMIT 3`,
    [userId]
  );

  const baitRes = await query(
    `SELECT COALESCE(NULLIF(TRIM(bait), ''), 'Unknown') AS bait, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1
     GROUP BY COALESCE(NULLIF(TRIM(bait), ''), 'Unknown')
     ORDER BY count DESC, bait ASC
     LIMIT 3`,
    [userId]
  );

  const rigRes = await query(
    `SELECT COALESCE(NULLIF(TRIM(rig_name), ''), 'Unknown') AS rig_name, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1
     GROUP BY COALESCE(NULLIF(TRIM(rig_name), ''), 'Unknown')
     ORDER BY count DESC, rig_name ASC
     LIMIT 3`,
    [userId]
  );

  const baitFamilyRes = await query(
    `SELECT COALESCE(NULLIF(TRIM(bait_family), ''), 'Unknown') AS bait_family, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1
     GROUP BY COALESCE(NULLIF(TRIM(bait_family), ''), 'Unknown')
     ORDER BY count DESC, bait_family ASC
     LIMIT 3`,
    [userId]
  );

  const totalCatches = totalRes.rows[0]?.count || 0;
  const landedCount = landedRes.rows[0]?.count || 0;
  const landingRate = ratio(landedCount, totalCatches);

  const topSpecies = speciesRes.rows.map((row) => ({
    species: row.species,
    count: row.count,
  }));

  const topBaits = baitRes.rows.map((row) => ({
    bait: row.bait,
    count: row.count,
  }));

  const topRigs = rigRes.rows.map((row) => ({
    rigName: row.rig_name,
    count: row.count,
  }));

  const topBaitFamilies = baitFamilyRes.rows.map((row) => ({
    baitFamily: row.bait_family,
    count: row.count,
  }));

  return {
    totalCatches,
    landedCount,
    topSpecies,
    topBaits,
    topRigs,
    topBaitFamilies,
    landingRate,
    insights: buildInsights(totalCatches, landedCount, topSpecies, topBaits, topRigs, landingRate),
  };
}

module.exports = {
  getCatchSummary,
};
