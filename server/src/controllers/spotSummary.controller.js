const { getSavedSpotSummary } = require('../services/spotSummary.service');

function parseSavedSpotId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

async function getSavedSpotSummaryHandler(req, res) {
  try {
    const savedSpotId = parseSavedSpotId(req.params.id);
    if (!savedSpotId) {
      return res.status(400).json({ error: 'Valid saved spot id is required' });
    }

    const summary = await getSavedSpotSummary(req.session.userId, savedSpotId);
    return res.json(summary);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch saved spot summary' });
  }
}

module.exports = {
  getSavedSpotSummaryHandler,
};
