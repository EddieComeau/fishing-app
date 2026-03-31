const { query } = require('../config/db');
const { getSessionById } = require('./sessions.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function minutesBetween(start, end) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return 0;
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function deriveExpectedOutcome(summary) {
  const activityLevel = asLower(summary?.activityLevelAtStart);
  const biteStrength = Number(summary?.biteWindowStrength);

  if (activityLevel === 'high' || (Number.isFinite(biteStrength) && biteStrength >= 0.67)) {
    return 'good';
  }

  if (activityLevel === 'moderate' || (Number.isFinite(biteStrength) && biteStrength >= 0.34)) {
    return 'mixed';
  }

  return 'poor';
}

function deriveOverallOutcome({ landedCount, totalCatches, summary, adaptiveSuggestions }) {
  const startActivity = asLower(summary?.activityLevelAtStart);
  const suggestionTypes = new Set((adaptiveSuggestions || []).map((item) => item?.type).filter(Boolean));

  if (
    landedCount >= 2 &&
    (startActivity === 'high' || startActivity === 'moderate' || suggestionTypes.has('stay_with_pattern'))
  ) {
    return 'good';
  }

  if (landedCount === 1 || totalCatches >= 2) {
    return 'mixed';
  }

  return 'poor';
}

function deriveExpectationMatch(overallOutcome, expectedOutcome) {
  const rank = { poor: 1, mixed: 2, good: 3 };
  const actual = rank[overallOutcome] || 1;
  const expected = rank[expectedOutcome] || 1;

  if (actual > expected) return 'exceeded';
  if (actual < expected) return 'below';
  return 'matched';
}

function deriveConfidence({ landedCount, totalCatches, warnings, patterns }) {
  if (landedCount >= 3 && patterns.length >= 2 && warnings.length <= 1) {
    return 'high';
  }

  if (landedCount >= 1 || totalCatches >= 2 || patterns.length >= 1) {
    return 'moderate';
  }

  return 'low';
}

function buildSummary(overallOutcome, expectationMatch) {
  if (overallOutcome === 'good' && expectationMatch !== 'below') {
    return 'Strong conditions translated into a productive session with clear success signals.';
  }

  if (overallOutcome === 'mixed') {
    return 'The session produced some results, but performance stayed inconsistent across the outing.';
  }

  if (expectationMatch === 'below') {
    return 'The trip underperformed relative to the starting outlook and produced limited results.';
  }

  return 'Weak or incomplete signals led to a low-output session.';
}

function buildRigStats(catches) {
  const map = new Map();

  (Array.isArray(catches) ? catches : []).forEach((item) => {
    const rig = String(item?.rig_name || '').trim() || 'Unknown';
    const entry = map.get(rig) || { rig, total: 0, landed: 0 };
    entry.total += 1;
    if (item?.landed) entry.landed += 1;
    map.set(rig, entry);
  });

  return Array.from(map.values()).sort((a, b) => b.landed - a.landed || b.total - a.total || a.rig.localeCompare(b.rig));
}

function buildSpeciesStats(catches) {
  const map = new Map();

  (Array.isArray(catches) ? catches : []).forEach((item) => {
    const species = String(item?.species || '').trim() || 'Unknown';
    const entry = map.get(species) || { species, total: 0, landed: 0 };
    entry.total += 1;
    if (item?.landed) entry.landed += 1;
    map.set(species, entry);
  });

  return Array.from(map.values()).sort((a, b) => b.landed - a.landed || b.total - a.total || a.species.localeCompare(b.species));
}

function buildTimePattern(catches, summary) {
  const start = toDate(summary?.startedAt);
  const end = toDate(summary?.endedAt);
  if (!start || !end) return null;

  const totalMinutes = minutesBetween(start, end);
  if (totalMinutes < 30) return null;

  const midpoint = new Date(start.getTime() + (totalMinutes * 60000) / 2);
  let early = 0;
  let late = 0;

  catches.forEach((item) => {
    if (!item?.landed) return;
    const caughtAt = toDate(item.created_at);
    if (!caughtAt) return;
    if (caughtAt <= midpoint) early += 1;
    else late += 1;
  });

  if (early >= 2 && early > late) {
    return 'Most landed catches came during the early part of the session.';
  }

  if (late >= 2 && late > early) {
    return 'Most landed catches came later in the session.';
  }

  return null;
}

function buildReviewPayload(summary, catches) {
  const adaptiveSuggestions = Array.isArray(summary?.adaptiveSuggestions) ? summary.adaptiveSuggestions : [];
  const totalCatches = Number(summary?.catches || 0);
  const landedCount = catches.filter((item) => item.landed).length;
  const expectedOutcome = deriveExpectedOutcome(summary);
  const overallOutcome = deriveOverallOutcome({
    landedCount,
    totalCatches,
    summary,
    adaptiveSuggestions,
  });
  const expectationMatch = deriveExpectationMatch(overallOutcome, expectedOutcome);

  const rigStats = buildRigStats(catches);
  const speciesStats = buildSpeciesStats(catches);
  const topRig = rigStats[0] || null;
  const topSpecies = speciesStats[0] || null;
  const patterns = [];
  const whatWorked = [];
  const whatDidNotWork = [];
  const missedOpportunities = [];
  const warnings = [];

  if (landedCount > 0 && topRig?.landed > 0) {
    whatWorked.push(`${topRig.rig} produced the clearest session results.`);
  }

  if (landedCount > 0 && topSpecies?.landed > 0) {
    whatWorked.push(`${topSpecies.species} was the most productive species focus.`);
  }

  const timePattern = buildTimePattern(catches, summary);
  if (timePattern) {
    patterns.push(timePattern);
  }

  if (topRig && topRig.landed > 0 && topRig.landed === landedCount && landedCount >= 2) {
    patterns.push(`All landed catches came on ${topRig.rig}.`);
  }

  if (landedCount > 0 && ['high', 'moderate'].includes(asLower(summary?.activityLevelAtStart))) {
    patterns.push('Success aligned with the stronger opening activity window.');
  }

  rigStats
    .filter((item) => item.total >= 1 && item.landed === 0)
    .slice(0, 2)
    .forEach((item) => {
      whatDidNotWork.push(`${item.rig} was used without a logged landed fish.`);
    });

  if (landedCount === 0) {
    whatDidNotWork.push('No logged catch pattern broke through during this outing.');
  }

  if (['high', 'moderate'].includes(asLower(summary?.activityLevelAtStart)) && landedCount <= 1) {
    whatDidNotWork.push('The stronger opening conditions did not translate into consistent results.');
  }

  if (expectationMatch === 'below') {
    missedOpportunities.push('Conditions suggested higher potential than the session achieved.');
  }

  const durationMinutes = minutesBetween(toDate(summary?.startedAt), toDate(summary?.endedAt));
  if (durationMinutes > 0 && durationMinutes < 60 && ['high', 'moderate'].includes(asLower(summary?.activityLevelAtStart))) {
    missedOpportunities.push('The session may have benefited from more time during the stronger opening window.');
  }

  if (
    landedCount === 0 &&
    adaptiveSuggestions.some((item) => ['reposition', 'presentation_change', 'rig_adjustment'].includes(item?.type))
  ) {
    missedOpportunities.push('A stronger adjustment or reposition may have been needed to unlock better results.');
  }

  if (totalCatches < 2 || landedCount < 2) {
    warnings.push('Limited session data makes this review less reliable.');
  }

  const summaryWarnings = [
    ...(Array.isArray(summary?.explanation?.warnings) ? summary.explanation.warnings : []),
    ...adaptiveSuggestions.flatMap((item) => (Array.isArray(item?.warnings) ? item.warnings : [])),
  ];
  summaryWarnings.forEach((warning) => {
    if (String(warning).trim()) warnings.push(String(warning).trim());
  });

  const confidence = deriveConfidence({
    landedCount,
    totalCatches,
    warnings,
    patterns,
  });

  if (confidence === 'low') {
    warnings.push('Review confidence is low.');
  }

  const signalsMissing = [];
  const notes = ['Session Review is post-session only and does not alter recommendation engines.'];

  if (warnings.some((warning) => String(warning).toLowerCase().includes('tide'))) {
    signalsMissing.push('tide_signal');
  }

  notes.push('Trip-prep expectation was inferred from session-start activity because full prep context is not currently persisted on the session record.');

  return {
    review: {
      overallOutcome,
      expectationMatch,
      summary: buildSummary(overallOutcome, expectationMatch),
      confidence,
    },
    whatWorked: Array.from(new Set(whatWorked)),
    whatDidNotWork: Array.from(new Set(whatDidNotWork)),
    patterns: Array.from(new Set(patterns)),
    missedOpportunities: Array.from(new Set(missedOpportunities)),
    warnings: Array.from(new Set(warnings)),
    explanation: {
      baseReasons: [
        `Logged catches: ${totalCatches}.`,
        `Landed catches: ${landedCount}.`,
        `Session started at ${summary?.activityLevelAtStart || 'unknown'} activity.`,
      ],
      signalsUsed: [
        'session_summary',
        'catch_log',
        'adaptive_suggestions',
        'session_start_activity',
      ],
      signalsMissing: Array.from(new Set(signalsMissing)),
      notes,
    },
  };
}

async function getSessionReview(userId, sessionId) {
  const summary = await getSessionById(userId, sessionId);

  if (summary.status !== 'ended') {
    const err = new Error('Session review is only available for ended sessions');
    err.status = 400;
    throw err;
  }

  const catchesRes = await query(
    `SELECT species, rig_name, landed, created_at
     FROM catches
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at ASC`,
    [userId, sessionId]
  );

  return buildReviewPayload(summary, catchesRes.rows || []);
}

module.exports = {
  buildReviewPayload,
  getSessionReview,
};
