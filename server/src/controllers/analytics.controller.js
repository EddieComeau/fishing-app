const { getCatchSummary } = require('../services/analytics.service');

async function getCatchSummaryHandler(req, res) {
  try {
    const summary = await getCatchSummary(req.session.userId);
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to build catch summary' });
  }
}

module.exports = {
  getCatchSummaryHandler,
};
