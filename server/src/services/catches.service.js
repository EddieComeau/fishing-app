const { query } = require('../config/db');

async function getActiveSessionId(userId) {
  const result = await query(
    `SELECT id
     FROM fishing_sessions
     WHERE user_id = $1 AND status = 'active'
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.id || null;
}

async function assertSessionOwnership(userId, sessionId) {
  const result = await query(
    `SELECT id
     FROM fishing_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  if (!result.rows[0]) {
    const err = new Error('sessionId does not belong to the current user');
    err.status = 400;
    throw err;
  }
}

async function createCatch(userId, payload) {
  const species = String(payload.species || '').trim();
  const clientCatchId = payload.clientCatchId ? String(payload.clientCatchId) : null;

  if (!species) {
    const err = new Error('species is required');
    err.status = 400;
    throw err;
  }

  const weightLb = payload.weightLb === undefined || payload.weightLb === null || payload.weightLb === ''
    ? null
    : Number(payload.weightLb);

  if (weightLb !== null && !Number.isFinite(weightLb)) {
    const err = new Error('weightLb must be a number');
    err.status = 400;
    throw err;
  }

  const bait = payload.bait ? String(payload.bait).trim() : null;
  const rigName = payload.rigName ? String(payload.rigName).trim() : null;
  const baitFamily = payload.baitFamily ? String(payload.baitFamily).trim() : null;
  const landed = payload.landed === undefined ? true : Boolean(payload.landed);
  const explicitSessionId = payload.sessionId === undefined || payload.sessionId === null || payload.sessionId === ''
    ? null
    : Number(payload.sessionId);

  if (explicitSessionId !== null && !Number.isInteger(explicitSessionId)) {
    const err = new Error('sessionId must be an integer');
    err.status = 400;
    throw err;
  }

  const sessionId = explicitSessionId === null
    ? await getActiveSessionId(userId)
    : explicitSessionId;

  if (sessionId !== null) {
    await assertSessionOwnership(userId, sessionId);
  }

  try {
    const result = await query(
      `INSERT INTO catches (user_id, client_catch_id, species, weight_lb, bait, rig_name, bait_family, landed, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, client_catch_id, species, weight_lb, bait, rig_name, bait_family, landed, session_id, created_at`,
      [userId, clientCatchId, species, weightLb, bait, rigName, baitFamily, landed, sessionId]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const err = new Error('Duplicate clientCatchId for this user');
      err.status = 409;
      throw err;
    }
    throw error;
  }
}

async function listCatches(userId) {
  const result = await query(
    `SELECT id, user_id, client_catch_id, species, weight_lb, bait, rig_name, bait_family, landed, session_id, created_at
     FROM catches
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  createCatch,
  listCatches,
};
