const {
  createSession,
  getActiveSession,
  endSession,
  getSessionById,
} = require('../services/sessions.service');

async function startSessionHandler(req, res) {
  try {
    const session = await createSession(req.session.userId, req.body || {});
    return res.status(201).json({ session });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to start session' });
  }
}

async function getActiveSessionHandler(req, res) {
  try {
    const session = await getActiveSession(req.session.userId);
    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active session' });
  }
}

async function endSessionHandler(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'Valid session id is required' });
    }

    const session = await endSession(req.session.userId, sessionId);
    return res.json({ session });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to end session' });
  }
}

async function getSessionSummaryHandler(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'Valid session id is required' });
    }

    const summary = await getSessionById(req.session.userId, sessionId);
    return res.json(summary);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch session summary' });
  }
}

module.exports = {
  startSessionHandler,
  getActiveSessionHandler,
  endSessionHandler,
  getSessionSummaryHandler,
};
