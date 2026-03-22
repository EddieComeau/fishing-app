const { query } = require('../config/db');

function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function ratio(numerator, denominator) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(2));
}

function buildNoop(code, evaluated = true) {
  return {
    evaluated,
    applied: false,
    code,
    modifier: null,
    preview: null,
  };
}

function buildConfidence(sampleSize) {
  if (sampleSize >= 5) return 'high';
  if (sampleSize >= 3) return 'medium';
  return 'low';
}

async function getStructuredRigHistoryCount(userId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1
       AND NULLIF(TRIM(rig_name), '') IS NOT NULL`,
    [userId]
  );

  return result.rows[0]?.count || 0;
}

async function getSpeciesRigSignals(userId, normalizedSpecies) {
  const result = await query(
    `SELECT
       TRIM(rig_name) AS rig_name,
       COUNT(*)::int AS total_count,
       COUNT(*) FILTER (WHERE landed = true)::int AS landed_count
     FROM catches
     WHERE user_id = $1
       AND LOWER(TRIM(species)) = $2
       AND NULLIF(TRIM(rig_name), '') IS NOT NULL
     GROUP BY TRIM(rig_name)
     ORDER BY landed_count DESC, total_count DESC, rig_name ASC`,
    [userId, normalizedSpecies]
  );

  return result.rows.map((row) => ({
    rigName: row.rig_name,
    totalCount: row.total_count,
    landedCount: row.landed_count,
    landingRate: ratio(row.landed_count, row.total_count),
  }));
}

async function evaluateRigPersonalization({ userId, targetSpecies }) {
  if (!userId) {
    return buildNoop('unauthenticated', false);
  }

  const normalizedSpecies = normalizeValue(targetSpecies);
  if (!normalizedSpecies) {
    return buildNoop('no_target_species');
  }

  const totalStructuredHistory = await getStructuredRigHistoryCount(userId);
  if (totalStructuredHistory === 0) {
    return buildNoop('no_structured_rig_data');
  }

  if (totalStructuredHistory < 5) {
    return buildNoop('insufficient_total_history');
  }

  const signals = await getSpeciesRigSignals(userId, normalizedSpecies);
  const speciesSampleSize = signals.reduce((sum, item) => sum + item.totalCount, 0);

  if (speciesSampleSize < 3) {
    return buildNoop('insufficient_species_history');
  }

  if (signals.length < 2) {
    return buildNoop('no_meaningful_preference');
  }

  const preferred = signals[0];
  const runnerUp = signals[1];
  const landingRateGap = Number((preferred.landingRate - runnerUp.landingRate).toFixed(2));
  const landedCountGap = preferred.landedCount - runnerUp.landedCount;
  const strongEvidence = (
    preferred.totalCount >= 5 &&
    landingRateGap >= 0.15 &&
    landedCountGap >= 2
  );

  if (
    preferred.totalCount < 3 ||
    landingRateGap < 0.15 ||
    landedCountGap < 2
  ) {
    return buildNoop('no_meaningful_preference');
  }

  return {
    evaluated: true,
    applied: true,
    code: 'preference_detected_no_rerank',
    modifier: {
      type: 'personalization',
      code: 'preference_detected_no_rerank',
      applied: true,
      label: 'User catch-history preference',
      reason: `Your catch history for ${targetSpecies} currently favors ${preferred.rigName} outcomes.`,
      confidence: buildConfidence(preferred.totalCount),
      impact: 'supporting_signal',
      evidence: {
        species: normalizedSpecies,
        preferredRig: preferred.rigName,
        sampleSize: preferred.totalCount,
        landedCount: preferred.landedCount,
        landingRate: preferred.landingRate,
        runnerUpRig: runnerUp.rigName,
        runnerUpLandingRate: runnerUp.landingRate,
        landingRateGap,
        landedCountGap,
        strongEvidence,
      },
    },
    preview: {
      preferredRig: preferred.rigName,
      strongEvidence,
      sampleSize: preferred.totalCount,
      landingRateGap,
      landedCountGap,
      appliedAs: 'supporting_signal',
    },
  };
}

module.exports = {
  evaluateRigPersonalization,
};
