const { query } = require('../config/db');
const { getAdaptiveSuggestions } = require('./sessionAdaptive.service');
const { getUnifiedIntelligence } = require('./intelligenceOrchestrator.service');
const { assertSavedSpotOwnership } = require('./savedSpots.service');

function buildSessionSummaryInsights(summary) {
  const insights = [];

  if (!summary) return insights;

  if (summary.catches === 0) {
    insights.push('No catches logged in this session yet.');
    insights.push('Attach catches to this outing to build a useful session summary.');
    return insights;
  }

  if (summary.topSpecies) {
    insights.push(`Most session catches were ${summary.topSpecies}.`);
  }

  if (summary.topRig) {
    insights.push(`${summary.topRig} is the most-used rig in this session.`);
  }

  insights.push(`This outing currently includes ${summary.catches} logged catch${summary.catches === 1 ? '' : 'es'}.`);
  return insights.slice(0, 3);
}

function formatDuration(startedAt, endedAt) {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'n/a';
  }

  const totalMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

async function createSession(userId, payload) {
  const name = String(payload.name || '').trim();
  const locationLabel = payload.locationLabel ? String(payload.locationLabel).trim() : null;
  const speciesFocus = payload.speciesFocus ? String(payload.speciesFocus).trim() : null;
  const savedSpotId = payload.savedSpotId === undefined || payload.savedSpotId === null || payload.savedSpotId === ''
    ? null
    : Number(payload.savedSpotId);
  const activityLevelAtStart = payload.activityLevelAtStart
    ? String(payload.activityLevelAtStart).trim().toLowerCase()
    : null;
  const biteWindowStrength = payload.biteWindowStrength === undefined || payload.biteWindowStrength === null || payload.biteWindowStrength === ''
    ? null
    : Number(payload.biteWindowStrength);

  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  if (savedSpotId !== null && !Number.isInteger(savedSpotId)) {
    const err = new Error('savedSpotId must be an integer');
    err.status = 400;
    throw err;
  }

  if (
    activityLevelAtStart !== null &&
    !['low', 'moderate', 'high'].includes(activityLevelAtStart)
  ) {
    const err = new Error('activityLevelAtStart must be low, moderate, or high');
    err.status = 400;
    throw err;
  }

  if (biteWindowStrength !== null && !Number.isFinite(biteWindowStrength)) {
    const err = new Error('biteWindowStrength must be a number');
    err.status = 400;
    throw err;
  }

  if (savedSpotId !== null) {
    await assertSavedSpotOwnership(userId, savedSpotId);
  }

  try {
    const result = await query(
      `INSERT INTO fishing_sessions (user_id, name, location_label, species_focus, saved_spot_id, activity_level_at_start, bite_window_score_start, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, user_id, name, location_label, species_focus, saved_spot_id, activity_level_at_start, bite_window_score_start, started_at, ended_at, status`,
      [userId, name, locationLabel, speciesFocus, savedSpotId, activityLevelAtStart, biteWindowStrength]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const err = new Error('An active session already exists for this user');
      err.status = 409;
      throw err;
    }
    throw error;
  }
}

async function getActiveSession(userId) {
  const result = await query(
    `SELECT id, user_id, name, location_label, species_focus, saved_spot_id, activity_level_at_start, bite_window_score_start, started_at, ended_at, status
     FROM fishing_sessions
     WHERE user_id = $1 AND status = 'active'
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function endSession(userId, sessionId) {
  const result = await query(
    `UPDATE fishing_sessions
     SET status = 'ended', ended_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING id, user_id, name, location_label, species_focus, saved_spot_id, activity_level_at_start, bite_window_score_start, started_at, ended_at, status`,
    [sessionId, userId]
  );

  if (!result.rows[0]) {
    const err = new Error('Active session not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function getSessionById(userId, sessionId, options = {}) {
  const sessionRes = await query(
    `SELECT id, user_id, name, location_label, species_focus, saved_spot_id, activity_level_at_start, bite_window_score_start, started_at, ended_at, status
     FROM fishing_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  const session = sessionRes.rows[0];
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  const catchesRes = await query(
    `SELECT COUNT(*)::int AS catches
     FROM catches
     WHERE user_id = $1 AND session_id = $2`,
    [userId, sessionId]
  );

  const catchDetailRes = await query(
    `SELECT rig_name, created_at, landed
     FROM catches
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at DESC`,
    [userId, sessionId]
  );

  const speciesRes = await query(
    `SELECT species, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1 AND session_id = $2
     GROUP BY species
     ORDER BY count DESC, species ASC
     LIMIT 1`,
    [userId, sessionId]
  );

  const rigRes = await query(
    `SELECT COALESCE(NULLIF(TRIM(rig_name), ''), 'Unknown') AS rig_name, COUNT(*)::int AS count
     FROM catches
     WHERE user_id = $1 AND session_id = $2
     GROUP BY COALESCE(NULLIF(TRIM(rig_name), ''), 'Unknown')
     ORDER BY count DESC, rig_name ASC
     LIMIT 1`,
    [userId, sessionId]
  );

  const lastCatchRes = await query(
    `SELECT MAX(created_at) AS last_catch_at
     FROM catches
     WHERE user_id = $1 AND session_id = $2`,
    [userId, sessionId]
  );

  const catches = catchesRes.rows[0]?.catches || 0;
  const topSpecies = speciesRes.rows[0]?.species || null;
  const topRig = rigRes.rows[0]?.rig_name || null;
  const lastCatchAt = lastCatchRes.rows[0]?.last_catch_at || null;
  const catchDetails = catchDetailRes.rows || [];

  const summary = {
    sessionId: session.id,
    name: session.name,
    locationLabel: session.location_label,
    speciesFocus: session.species_focus,
    savedSpotId: session.saved_spot_id,
    status: session.status,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    sessionDuration: formatDuration(session.started_at, session.ended_at),
    catches,
    topSpecies,
    topRig,
    lastCatchAt,
    activityLevelAtStart: session.activity_level_at_start,
    biteWindowStrength: session.bite_window_score_start,
  };

  let currentAdaptiveContext = null;
  let adaptiveWarning = null;

  if (session.status === 'active' && options.currentContext) {
    try {
      currentAdaptiveContext = await getUnifiedIntelligence(options.currentContext, {
        userId,
      });
      currentAdaptiveContext.waterType = options.currentContext.waterType;
    } catch (error) {
      adaptiveWarning = `Adaptive suggestions are limited because live session context could not be refreshed: ${error.message || 'unknown error'}`;
    }
  }

  const adaptive = getAdaptiveSuggestions({
    summary,
    catches: catchDetails,
    currentContext: currentAdaptiveContext,
    providerContextWarning: adaptiveWarning,
  });

  return {
    ...summary,
    adaptiveSuggestions: adaptive.suggestions,
    explanation: {
      baseReasons: [
        'Session summaries are deterministic rollups of catches attached to the current outing.',
        'Recommendation services remain separate; this slice only stores and organizes runtime context.',
      ],
      warnings: [
        ...(catches === 0 ? ['No catches are attached to this session yet.'] : []),
        ...adaptive.warnings,
      ],
      modifiers: [],
      metadata: {
        sessionStatus: session.status,
        sessionStartedAt: session.started_at,
        adaptiveSuggestionsCount: adaptive.suggestions.length,
      },
    },
    insights: buildSessionSummaryInsights(summary),
  };
}

async function listSessionHistory(userId, options = {}) {
  const status = options.status ? String(options.status).trim().toLowerCase() : 'ended';
  const limit = options.limit === undefined || options.limit === null || options.limit === ''
    ? 20
    : Number(options.limit);
  const savedSpotId = options.savedSpotId === undefined || options.savedSpotId === null || options.savedSpotId === ''
    ? null
    : Number(options.savedSpotId);

  if (!['ended', 'active', 'all'].includes(status)) {
    const err = new Error('status must be ended, active, or all');
    err.status = 400;
    throw err;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    const err = new Error('limit must be an integer between 1 and 100');
    err.status = 400;
    throw err;
  }

  if (savedSpotId !== null) {
    if (!Number.isInteger(savedSpotId)) {
      const err = new Error('savedSpotId must be an integer');
      err.status = 400;
      throw err;
    }

    await assertSavedSpotOwnership(userId, savedSpotId);
  }

  const conditions = ['fs.user_id = $1'];
  const params = [userId];

  if (status !== 'all') {
    params.push(status);
    conditions.push(`fs.status = $${params.length}`);
  }

  if (savedSpotId !== null) {
    params.push(savedSpotId);
    conditions.push(`fs.saved_spot_id = $${params.length}`);
  }

  params.push(limit);

  const result = await query(
    `SELECT
       fs.id,
       fs.user_id,
       fs.name,
       fs.location_label,
       fs.species_focus,
       fs.saved_spot_id,
       fs.activity_level_at_start,
       fs.bite_window_score_start,
       fs.started_at,
       fs.ended_at,
       fs.status,
       ss.name AS saved_spot_name,
       COUNT(c.id)::int AS catches,
       (
         SELECT c2.species
         FROM catches c2
         WHERE c2.user_id = fs.user_id AND c2.session_id = fs.id
         GROUP BY c2.species
         ORDER BY COUNT(*) DESC, c2.species ASC
         LIMIT 1
       ) AS top_species,
       (
         SELECT COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown')
         FROM catches c3
         WHERE c3.user_id = fs.user_id AND c3.session_id = fs.id
         GROUP BY COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown')
         ORDER BY COUNT(*) DESC, COALESCE(NULLIF(TRIM(c3.rig_name), ''), 'Unknown') ASC
         LIMIT 1
       ) AS top_rig
     FROM fishing_sessions fs
     LEFT JOIN catches c
       ON c.user_id = fs.user_id AND c.session_id = fs.id
     LEFT JOIN saved_spots ss
       ON ss.id = fs.saved_spot_id AND ss.user_id = fs.user_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY fs.id, ss.name
     ORDER BY COALESCE(fs.ended_at, fs.started_at) DESC, fs.id DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    locationLabel: row.location_label,
    speciesFocus: row.species_focus,
    savedSpotId: row.saved_spot_id,
    savedSpotName: row.saved_spot_name || null,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    sessionDuration: formatDuration(row.started_at, row.ended_at),
    summary: {
      catches: row.catches || 0,
      topSpecies: row.top_species || null,
      topRig: row.top_rig || null,
    },
  }));
}

module.exports = {
  createSession,
  getActiveSession,
  endSession,
  getSessionById,
  listSessionHistory,
};
