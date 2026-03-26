const {
  createSession,
  getActiveSession,
  endSession,
  getSessionById,
  listSessionHistory,
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

    const lat = req.query.lat === undefined ? null : Number(req.query.lat);
    const lng = req.query.lng === undefined ? null : Number(req.query.lng);
    const hasCoordinateParams = req.query.lat !== undefined || req.query.lng !== undefined;

    if (hasCoordinateParams && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers when session context coordinates are provided' });
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'lat must be between -90 and 90, and lng must be between -180 and 180' });
      }
    }

    const hasLiveContext = Number.isFinite(lat) && Number.isFinite(lng);
    const summary = await getSessionById(req.session.userId, sessionId, {
      currentContext: hasLiveContext ? {
        lat,
        lng,
        waterType: req.query.waterType || 'freshwater',
        accessMode: req.query.accessMode || 'bank',
        tideStationId: req.query.tideStationId || null,
        spotName: req.query.spotName || null,
        pressureTrend: req.query.pressureTrend || null,
      } : null,
    });
    return res.json(summary);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch session summary' });
  }
}

async function listSessionHistoryHandler(req, res) {
  try {
    const sessions = await listSessionHistory(req.session.userId, {
      status: req.query.status,
      limit: req.query.limit,
      savedSpotId: req.query.savedSpotId,
    });
    return res.json({ sessions });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch session history' });
  }
}

module.exports = {
  startSessionHandler,
  getActiveSessionHandler,
  endSessionHandler,
  getSessionSummaryHandler,
  listSessionHistoryHandler,
};
