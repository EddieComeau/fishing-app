const { getSavedSpotSummary } = require('../services/spotSummary.service');
const { getSpotInsights } = require('../services/spotInsight.service');

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
    const insightPayload = await getSpotInsights({
      userId: req.session.userId,
      savedSpotId,
      summaryPayload: summary,
    });

    return res.json({
      ...summary,
      insights: insightPayload.insights,
      explanation: {
        baseReasons: Array.from(new Set([
          ...(summary.explanation?.baseReasons || []),
          ...(insightPayload.explanation?.baseReasons || []),
        ])),
        warnings: Array.from(new Set([
          ...(summary.explanation?.warnings || []),
          ...(insightPayload.explanation?.warnings || []),
        ])),
        modifiers: [],
        metadata: {
          ...(summary.explanation?.metadata || {}),
          spotInsights: insightPayload.explanation?.metadata || {},
        },
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch saved spot summary' });
  }
}

module.exports = {
  getSavedSpotSummaryHandler,
};
