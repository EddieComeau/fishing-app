const { query } = require('../config/db');
const { getSavedSpotById } = require('./savedSpots.service');

function normalizeWindowLabel(activityLevel, biteWindowStrength) {
  if (activityLevel === 'high') return 'high activity window';
  if (activityLevel === 'moderate') return 'moderate activity window';
  if (typeof biteWindowStrength === 'number') {
    if (biteWindowStrength >= 70) return 'high activity window';
    if (biteWindowStrength >= 40) return 'moderate activity window';
  }
  return 'low activity window';
}

async function getSavedSpotSummary(userId, savedSpotId) {
  const spot = await getSavedSpotById(userId, savedSpotId);

  const sessionsRes = await query(
    `SELECT
       id,
       started_at,
       ended_at,
       activity_level_at_start,
       bite_window_score_start
     FROM fishing_sessions
     WHERE user_id = $1
       AND saved_spot_id = $2
       AND status = 'ended'
     ORDER BY COALESCE(ended_at, started_at) DESC, id DESC`,
    [userId, savedSpotId]
  );

  const sessions = sessionsRes.rows || [];
  const totalSessions = sessions.length;

  if (!totalSessions) {
    return {
      spot: {
        id: spot.id,
        name: spot.name,
      },
      summary: {
        totalSessions: 0,
        totalCatches: 0,
        avgCatchesPerSession: 0,
        topSpecies: null,
        topRig: null,
        bestTimeOfDay: null,
        lastFishedAt: null,
      },
      explanation: {
        baseReasons: [
          'No ended sessions are linked to this saved spot yet.',
        ],
        warnings: [
          'No trip data is available for this spot yet.',
        ],
        metadata: {
          sampleSize: 0,
        },
      },
    };
  }

  const aggregateRes = await query(
    `SELECT
       COUNT(c.id)::int AS total_catches,
       MAX(fs.started_at) AS last_fished_at,
       (
         SELECT c2.species
         FROM catches c2
         INNER JOIN fishing_sessions fs2
           ON fs2.id = c2.session_id
         WHERE fs2.user_id = $1
           AND fs2.saved_spot_id = $2
           AND fs2.status = 'ended'
         GROUP BY c2.species
         ORDER BY COUNT(*) DESC, c2.species ASC
         LIMIT 1
       ) AS top_species,
       (
         SELECT COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown')
         FROM catches c3
         INNER JOIN fishing_sessions fs3
           ON fs3.id = c3.session_id
         WHERE fs3.user_id = $1
           AND fs3.saved_spot_id = $2
           AND fs3.status = 'ended'
         GROUP BY COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown')
         ORDER BY COUNT(*) DESC, COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown') ASC
         LIMIT 1
       ) AS top_rig
     FROM fishing_sessions fs
     LEFT JOIN catches c
       ON c.session_id = fs.id AND c.user_id = fs.user_id
     WHERE fs.user_id = $1
       AND fs.saved_spot_id = $2
       AND fs.status = 'ended'`,
    [userId, savedSpotId]
  );

  const aggregate = aggregateRes.rows[0] || {};
  const totalCatches = aggregate.total_catches || 0;
  const avgCatchesPerSession = totalSessions === 0
    ? 0
    : Number((totalCatches / totalSessions).toFixed(1));

  const windowCounts = new Map();
  sessions.forEach((session) => {
    const label = normalizeWindowLabel(session.activity_level_at_start, session.bite_window_score_start);
    windowCounts.set(label, (windowCounts.get(label) || 0) + 1);
  });

  const bestTimeOfDay = [...windowCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;

  const warnings = [];
  const baseReasons = [];

  if (totalSessions < 3) {
    warnings.push('Limited data for this spot');
  }

  if (bestTimeOfDay) {
    baseReasons.push(`Most saved-spot sessions began during ${bestTimeOfDay}.`);
  }

  if (aggregate.top_rig) {
    baseReasons.push(`${aggregate.top_rig} is the most common rig across sessions at this spot.`);
  }

  if (!baseReasons.length) {
    baseReasons.push('Spot summary is based on deterministic aggregation of linked ended sessions and catches.');
  }

  return {
    spot: {
      id: spot.id,
      name: spot.name,
    },
    summary: {
      totalSessions,
      totalCatches,
      avgCatchesPerSession,
      topSpecies: aggregate.top_species || null,
      topRig: aggregate.top_rig || null,
      bestTimeOfDay,
      lastFishedAt: aggregate.last_fished_at || null,
    },
    explanation: {
      baseReasons,
      warnings,
      metadata: {
        sampleSize: totalSessions,
      },
    },
  };
}

module.exports = {
  getSavedSpotSummary,
};
