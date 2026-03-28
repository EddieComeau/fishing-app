const { getSavedSpotSummary } = require('../services/spotSummary.service');
const { getSpotInsights } = require('../services/spotInsight.service');
const { getSpotPlan } = require('../services/spotPlan.service');

function parseSavedSpotId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

async function getSavedSpotPlanHandler(req, res) {
  try {
    const savedSpotId = parseSavedSpotId(req.params.id);
    if (!savedSpotId) {
      return res.status(400).json({ error: 'Valid saved spot id is required' });
    }

    const summaryPayload = await getSavedSpotSummary(req.session.userId, savedSpotId);
    const insightPayload = await getSpotInsights({
      userId: req.session.userId,
      savedSpotId,
      summaryPayload,
    });
    const planPayload = getSpotPlan({
      summaryPayload,
      insightPayload,
    });

    return res.json(planPayload);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch saved spot plan' });
  }
}

module.exports = {
  getSavedSpotPlanHandler,
};
