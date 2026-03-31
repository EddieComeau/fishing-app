const { getSessionComparison } = require('../services/sessionComparison.service');

async function getSessionComparisonHandler(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'Valid session id is required' });
    }

    const compareWindow = req.query.compareWindow === undefined
      ? 5
      : Number(req.query.compareWindow);

    const comparison = await getSessionComparison(req.session.userId, sessionId, compareWindow);
    return res.json(comparison);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to build session comparison' });
  }
}

module.exports = {
  getSessionComparisonHandler,
};
