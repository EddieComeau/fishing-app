const { query } = require('../config/db');

function formatTimeInsight(bestTimeOfDay, totalSessions) {
  if (totalSessions < 3 || !bestTimeOfDay) {
    return 'Not enough data to determine best time.';
  }

  if (bestTimeOfDay === 'high activity window') {
    return 'This spot performs best during high-activity bite windows.';
  }

  if (bestTimeOfDay === 'moderate activity window') {
    return 'This spot performs best during moderate bite windows.';
  }

  return 'This spot has mostly produced during lower-activity windows so far.';
}

function formatProductivityInsight(avgCatchesPerSession, totalSessions) {
  if (Number(totalSessions || 0) === 0) {
    return 'Not enough data to judge spot productivity.';
  }

  const avg = Number(avgCatchesPerSession || 0);
  if (avg >= 2) return 'This spot produces consistent catches.';
  if (avg >= 1) return 'This spot produces occasional results.';
  return 'This spot has low catch consistency.';
}

async function getRigPattern(userId, savedSpotId) {
  const result = await query(
    `SELECT
       COALESCE(NULLIF(TRIM(c.rig_name), ''), 'Unknown') AS rig_name,
       COUNT(*)::int AS catch_count,
       COUNT(DISTINCT c.session_id)::int AS session_count
     FROM catches c
     INNER JOIN fishing_sessions fs
       ON fs.id = c.session_id
     WHERE fs.user_id = $1
       AND fs.saved_spot_id = $2
       AND fs.status = 'ended'
     GROUP BY COALESCE(NULLIF(TRIM(c.rig_name), ''), 'Unknown')
     ORDER BY COUNT(*) DESC, COALESCE(NULLIF(TRIM(c.rig_name), ''), 'Unknown') ASC
     LIMIT 1`,
    [userId, savedSpotId]
  );

  return result.rows[0] || null;
}

function buildBestRigInsight(summary, rigPattern) {
  const topRig = summary?.topRig || null;
  const totalSessions = Number(summary?.totalSessions || 0);
  const totalCatches = Number(summary?.totalCatches || 0);
  const rigCatchCount = Number(rigPattern?.catch_count || 0);
  const rigSessionCount = Number(rigPattern?.session_count || 0);

  if (!topRig || topRig === 'Unknown') {
    return {
      text: 'No dominant rig pattern detected.',
      dominant: false,
    };
  }

  const dominantBySessions = totalSessions > 0 && rigSessionCount > totalSessions / 2;
  const dominantByCatches = totalCatches > 0 && rigCatchCount > totalCatches / 2;

  if (dominantBySessions || dominantByCatches) {
    return {
      text: `${topRig} consistently performs best at this spot.`,
      dominant: true,
    };
  }

  return {
    text: 'No dominant rig pattern detected.',
    dominant: false,
  };
}

function buildPatternSummary(bestTimeInsight, bestRigInsight, productivityInsight, totalSessions) {
  if (totalSessions < 3) {
    return 'More trips are needed before FishDex can describe a reliable pattern for this spot.';
  }

  if (bestRigInsight.dominant && !bestTimeInsight.startsWith('Not enough data')) {
    return `${bestTimeInsight} ${bestRigInsight.text}`;
  }

  if (bestRigInsight.dominant) {
    return `${bestRigInsight.text} ${productivityInsight}`;
  }

  if (!bestTimeInsight.startsWith('Not enough data')) {
    return `${bestTimeInsight} ${productivityInsight}`;
  }

  return `${productivityInsight} No single repeatable pattern stands out yet.`;
}

async function getSpotInsights({ userId, savedSpotId, summaryPayload }) {
  const summary = summaryPayload?.summary || {};
  const totalSessions = Number(summary.totalSessions || 0);
  const avgCatchesPerSession = Number(summary.avgCatchesPerSession || 0);
  const warnings = [];
  const baseReasons = [];

  const rigPattern = await getRigPattern(userId, savedSpotId);
  const bestTime = formatTimeInsight(summary.bestTimeOfDay, totalSessions);
  const bestRigInsight = buildBestRigInsight(summary, rigPattern);
  const productivity = formatProductivityInsight(avgCatchesPerSession, totalSessions);
  const patternSummary = buildPatternSummary(bestTime, bestRigInsight, productivity, totalSessions);

  if (totalSessions < 3) {
    warnings.push('Limited data - insights may not be reliable yet.');
  }

  if (!bestRigInsight.dominant) {
    warnings.push('No dominant rig pattern detected yet.');
  }

  if (totalSessions > 0 && avgCatchesPerSession < 1) {
    warnings.push('Low catch consistency observed at this spot.');
  }

  baseReasons.push(bestTime);
  baseReasons.push(bestRigInsight.text);
  baseReasons.push(productivity);
  baseReasons.push(patternSummary);

  return {
    insights: {
      bestTime,
      bestRig: bestRigInsight.text,
      productivity,
      patternSummary,
      patterns: [patternSummary],
      warnings,
    },
    explanation: {
      baseReasons,
      warnings,
      modifiers: [],
      metadata: {
        sampleSize: totalSessions,
        avgCatchesPerSession,
        dominantRigDetected: bestRigInsight.dominant,
        topRigCatchCount: Number(rigPattern?.catch_count || 0),
        topRigSessionCount: Number(rigPattern?.session_count || 0),
      },
    },
  };
}

module.exports = {
  getSpotInsights,
};
