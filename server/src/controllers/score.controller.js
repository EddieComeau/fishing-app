const { scoreConditions } = require('../services/score.service');

function scoreConditionsHandler(req, res) {
  try {
    const result = scoreConditions(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Score calculation failed' });
  }
}

module.exports = {
  scoreConditionsHandler,
};
