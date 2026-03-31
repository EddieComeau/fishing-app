const { getSessionReview } = require('../services/sessionReview.service');

async function getSessionReviewHandler(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'Valid session id is required' });
    }

    const review = await getSessionReview(req.session.userId, sessionId);
    return res.json(review);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to build session review' });
  }
}

module.exports = {
  getSessionReviewHandler,
};
