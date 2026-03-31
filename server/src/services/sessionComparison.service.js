const { query } = require('../config/db');
const { getSessionById } = require('./sessions.service');
const { getSessionReview } = require('./sessionReview.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function minutesBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return 0;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

function roundToNearestInteger(value) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function average(values) {
  const usable = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function countModes(values) {
  const counts = new Map();

  (Array.isArray(values) ? values : []).forEach((value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0]?.[0] || null;
}

function deriveRelativeOutcome({ currentCatches, baselineAverageCatches, baselineCount }) {
  if (baselineCount < 2) {
    return 'typical';
  }

  if (currentCatches >= baselineAverageCatches + 1) {
    return 'above_average';
  }

  if (currentCatches <= baselineAverageCatches - 1) {
    return 'below_average';
  }

  return 'typical';
}

function deriveTrend(baselineSessions) {
  if (!Array.isArray(baselineSessions) || baselineSessions.length < 4) {
    return 'unclear';
  }

  const ordered = [...baselineSessions].sort((a, b) => {
    const aTime = toDate(a.endedAt)?.getTime() || 0;
    const bTime = toDate(b.endedAt)?.getTime() || 0;
    return bTime - aTime;
  });
  const midpoint = Math.floor(ordered.length / 2);
  const newestHalf = ordered.slice(0, midpoint);
  const olderHalf = ordered.slice(midpoint);

  if (!newestHalf.length || !olderHalf.length) {
    return 'unclear';
  }

  const newestAverage = average(newestHalf.map((item) => item.catches));
  const olderAverage = average(olderHalf.map((item) => item.catches));
  const delta = newestAverage - olderAverage;

  if (delta >= 1) return 'improving';
  if (delta <= -1) return 'declining';
  return 'steady';
}

function deriveConfidence({ baselineCount, warnings, relativeOutcome, trend }) {
  if (
    baselineCount >= 5 &&
    warnings.length <= 1 &&
    (relativeOutcome !== 'typical' || ['improving', 'declining'].includes(trend))
  ) {
    return 'high';
  }

  if (baselineCount >= 3) {
    return 'moderate';
  }

  return 'low';
}

function buildSummary({ relativeOutcome, trend, confidence }) {
  if (relativeOutcome === 'above_average' && trend === 'improving') {
    return 'This outing performed above your recent average and continues an improving trend.';
  }

  if (relativeOutcome === 'above_average') {
    return 'This session outperformed your recent baseline and stands out as one of your better recent trips.';
  }

  if (relativeOutcome === 'below_average' && confidence === 'low') {
    return 'This session fell below your recent baseline, but limited history reduces confidence.';
  }

  if (relativeOutcome === 'below_average') {
    return 'This trip trailed your recent outings and landed below your usual baseline.';
  }

  if (trend === 'steady') {
    return 'This trip was roughly in line with your recent sessions.';
  }

  if (trend === 'unclear') {
    return 'This trip looks broadly typical, but recent history is too limited for a strong comparison.';
  }

  return 'This outing stayed close to your recent baseline.';
}

function buildComparisonPayload({ currentSession, currentReview, baselineSessions, compareWindow }) {
  const baseline = Array.isArray(baselineSessions) ? baselineSessions : [];
  const warnings = [];
  const patterns = [];
  const signalsMissing = [];
  const notes = [];

  if (baseline.length < Math.max(2, Math.min(compareWindow, 3))) {
    warnings.push('Limited recent history reduces comparison confidence.');
  }

  const currentDurationMinutes = minutesBetween(currentSession?.startedAt, currentSession?.endedAt);
  const baselineAverageCatches = average(baseline.map((item) => item.catches));
  const baselineAverageDuration = average(baseline.map((item) => item.durationMinutes));
  const baselineAverageCatchesPerHour = average(
    baseline
      .filter((item) => item.durationMinutes > 0)
      .map((item) => (item.catches / item.durationMinutes) * 60)
  );
  const currentCatches = Number(currentSession?.catches || 0);
  const currentCatchesPerHour = currentDurationMinutes > 0 ? (currentCatches / currentDurationMinutes) * 60 : 0;
  const baselineTopRig = countModes(baseline.map((item) => item.topRig));
  const baselineTopSpecies = countModes(baseline.map((item) => item.topSpecies));
  const relativeOutcome = deriveRelativeOutcome({
    currentCatches,
    baselineAverageCatches,
    baselineCount: baseline.length,
  });
  const trend = deriveTrend(baseline);

  if (trend === 'unclear') {
    warnings.push('Trend analysis is unclear because too few comparable ended sessions exist.');
  }

  if (!baseline.some((item) => item.durationMinutes > 0)) {
    warnings.push('Duration comparisons are limited because recent sessions do not have enough time data.');
    signalsMissing.push('duration_baseline');
  }

  const reviewSignalsMissing = Array.isArray(currentReview?.explanation?.signalsMissing)
    ? currentReview.explanation.signalsMissing
    : [];
  if (reviewSignalsMissing.length) {
    warnings.push('Some review signals were degraded, which limits comparison confidence.');
    reviewSignalsMissing.forEach((signal) => signalsMissing.push(signal));
  }

  const confidence = deriveConfidence({
    baselineCount: baseline.length,
    warnings,
    relativeOutcome,
    trend,
  });

  if (confidence === 'low') {
    warnings.push('Comparison confidence is low because the recent baseline is limited or inconsistent.');
  }

  const catchesDelta = roundToNearestInteger(currentCatches - baselineAverageCatches);
  const durationDeltaMinutes = roundToNearestInteger(currentDurationMinutes - baselineAverageDuration);
  const topRigMatch = Boolean(
    baselineTopRig &&
    String(currentSession?.topRig || '').trim() &&
    String(currentSession.topRig).trim() === baselineTopRig
  );
  const topSpeciesMatch = Boolean(
    baselineTopSpecies &&
    String(currentSession?.topSpecies || '').trim() &&
    String(currentSession.topSpecies).trim() === baselineTopSpecies
  );

  if (trend === 'improving') {
    patterns.push(`Catch output is improving across your last ${baseline.length} comparable outings.`);
  } else if (trend === 'declining') {
    patterns.push(`Recent outings have produced softer results across your last ${baseline.length} comparable trips.`);
  }

  if (topRigMatch && currentSession?.topRig) {
    patterns.push(`This session stayed on your usual productive rig pattern with ${currentSession.topRig}.`);
  } else if (baselineTopRig && currentSession?.topRig && currentSession.topRig !== baselineTopRig) {
    patterns.push(`This outing broke from your usual top-rig pattern of ${baselineTopRig}.`);
  }

  if (topSpeciesMatch && currentSession?.topSpecies) {
    patterns.push(`This trip matched your recent top-species pattern with ${currentSession.topSpecies}.`);
  } else if (baselineTopSpecies && currentSession?.topSpecies && currentSession.topSpecies !== baselineTopSpecies) {
    patterns.push(`This trip broke from your usual top-species pattern of ${baselineTopSpecies}.`);
  }

  if (currentCatchesPerHour > 0 && baselineAverageCatchesPerHour > 0) {
    if (currentCatchesPerHour >= baselineAverageCatchesPerHour + 0.5) {
      patterns.push('Catch pace was stronger than your recent session baseline.');
    } else if (currentCatchesPerHour <= baselineAverageCatchesPerHour - 0.5) {
      patterns.push('Catch pace lagged your recent session baseline.');
    }
  } else {
    notes.push('Catch-per-hour comparisons were skipped because complete duration data was not available.');
  }

  const summary = buildSummary({
    relativeOutcome,
    trend,
    confidence,
  });

  return {
    comparison: {
      relativeOutcome,
      trend,
      baselineWindow: compareWindow,
      confidence,
      summary,
    },
    deltas: {
      catchesDelta,
      durationDeltaMinutes,
      topRigMatch,
      topSpeciesMatch,
    },
    patterns,
    warnings: Array.from(new Set(warnings)),
    explanation: {
      baseReasons: [
        'Session comparison is a read-only comparison against recent ended-session history.',
        'This layer explains relative performance without changing reviews, analytics, or recommendations.',
      ],
      signalsUsed: [
        'current_session_catches',
        'recent_baseline_catches',
        'recent_baseline_duration',
        'session_review_outcome',
        'session_review_expectation_match',
        'top_rig_baseline',
        'top_species_baseline',
      ],
      signalsMissing: Array.from(new Set(signalsMissing)),
      notes,
    },
  };
}

async function getBaselineSessions(userId, sessionId, compareWindow) {
  const result = await query(
    `SELECT
       fs.id,
       fs.started_at,
       fs.ended_at,
       COALESCE(COUNT(c.id), 0)::int AS catches,
       (
         SELECT COALESCE(NULLIF(TRIM(c2.rig_name), ''), 'Unknown')
         FROM catches c2
         WHERE c2.user_id = fs.user_id AND c2.session_id = fs.id
         GROUP BY COALESCE(NULLIF(TRIM(c2.rig_name), ''), 'Unknown')
         ORDER BY COUNT(*) DESC, COALESCE(NULLIF(TRIM(c2.rig_name), ''), 'Unknown') ASC
         LIMIT 1
       ) AS top_rig,
       (
         SELECT c3.species
         FROM catches c3
         WHERE c3.user_id = fs.user_id AND c3.session_id = fs.id
         GROUP BY c3.species
         ORDER BY COUNT(*) DESC, c3.species ASC
         LIMIT 1
       ) AS top_species
     FROM fishing_sessions fs
     LEFT JOIN catches c
       ON c.user_id = fs.user_id AND c.session_id = fs.id
     WHERE fs.user_id = $1
       AND fs.status = 'ended'
       AND fs.id <> $2
     GROUP BY fs.id
     ORDER BY fs.ended_at DESC, fs.id DESC
     LIMIT $3`,
    [userId, sessionId, compareWindow]
  );

  return result.rows.map((row) => ({
    id: row.id,
    catches: Number(row.catches || 0),
    durationMinutes: minutesBetween(row.started_at, row.ended_at),
    topRig: row.top_rig || null,
    topSpecies: row.top_species || null,
    endedAt: row.ended_at,
  }));
}

async function getSessionComparison(userId, sessionId, compareWindow = 5) {
  const allowedWindows = new Set([3, 5, 10]);
  const windowValue = Number(compareWindow || 5);

  if (!allowedWindows.has(windowValue)) {
    const err = new Error('compareWindow must be one of 3, 5, or 10');
    err.status = 400;
    throw err;
  }

  const session = await getSessionById(userId, sessionId);
  if (asLower(session?.status) !== 'ended') {
    const err = new Error('Session comparison is only available for ended sessions');
    err.status = 400;
    throw err;
  }

  const review = await getSessionReview(userId, sessionId);
  const baselineSessions = await getBaselineSessions(userId, sessionId, windowValue);

  return buildComparisonPayload({
    currentSession: session,
    currentReview: review,
    baselineSessions,
    compareWindow: windowValue,
  });
}

module.exports = {
  buildComparisonPayload,
  getSessionComparison,
};
