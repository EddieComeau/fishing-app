const crypto = require('crypto');
const { query } = require('../config/db');
const { getSessionById } = require('./sessions.service');
const { getSavedSpotSummary } = require('./spotSummary.service');

function generateShareId() {
  return crypto.randomBytes(6).toString('base64url');
}

function sanitizeSharedSession(summary) {
  return {
    type: 'session',
    data: {
      name: summary.name || 'Completed Session',
      locationLabel: summary.locationLabel || summary.savedSpotName || 'Unknown location',
      duration: summary.sessionDuration || 'n/a',
      catches: summary.catches ?? 0,
      topSpecies: summary.topSpecies || null,
      topRig: summary.topRig || null,
      summary: {
        activityLevelAtStart: summary.activityLevelAtStart || null,
        biteWindowStrength: summary.biteWindowStrength ?? null,
      },
    },
  };
}

function sanitizeSharedSpot(payload) {
  const summary = payload.summary || {};

  return {
    type: 'spot',
    data: {
      name: payload.spot?.name || 'Saved Spot',
      summary: {
        totalSessions: summary.totalSessions ?? 0,
        totalCatches: summary.totalCatches ?? 0,
        topSpecies: summary.topSpecies || null,
        topRig: summary.topRig || null,
      },
    },
  };
}

async function findExistingShareLink(userId, type, targetId) {
  const result = await query(
    `SELECT id, type, target_id, created_at
     FROM shared_links
     WHERE user_id = $1 AND type = $2 AND target_id = $3
     LIMIT 1`,
    [userId, type, targetId]
  );

  return result.rows[0] || null;
}

async function createSharedLinkRecord(userId, type, targetId) {
  const existing = await findExistingShareLink(userId, type, targetId);
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = generateShareId();

    try {
      const result = await query(
        `INSERT INTO shared_links (id, user_id, type, target_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, type, target_id, created_at`,
        [id, userId, type, targetId]
      );

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') continue;
      throw error;
    }
  }

  throw new Error('Unable to generate a unique share link');
}

async function createSessionShareLink(userId, sessionId) {
  const summary = await getSessionById(userId, sessionId);

  if (summary.status !== 'ended') {
    const err = new Error('Only completed sessions can be shared');
    err.status = 400;
    throw err;
  }

  return createSharedLinkRecord(userId, 'session', sessionId);
}

async function createSpotShareLink(userId, savedSpotId) {
  await getSavedSpotSummary(userId, savedSpotId);
  return createSharedLinkRecord(userId, 'spot', savedSpotId);
}

async function getSharedPayload(shareId) {
  const linkRes = await query(
    `SELECT id, user_id, type, target_id, created_at
     FROM shared_links
     WHERE id = $1`,
    [shareId]
  );

  const link = linkRes.rows[0];
  if (!link) {
    const err = new Error('Shared link not found');
    err.status = 404;
    throw err;
  }

  if (link.type === 'session') {
    const summary = await getSessionById(link.user_id, link.target_id);

    if (summary.status !== 'ended') {
      const err = new Error('Shared link not found');
      err.status = 404;
      throw err;
    }

    return sanitizeSharedSession(summary);
  }

  if (link.type === 'spot') {
    const payload = await getSavedSpotSummary(link.user_id, link.target_id);
    return sanitizeSharedSpot(payload);
  }

  const err = new Error('Shared link not found');
  err.status = 404;
  throw err;
}

module.exports = {
  createSessionShareLink,
  createSpotShareLink,
  getSharedPayload,
};
