const { getFishingProfile } = require('../services/profile.service');

async function getFishingProfileHandler(req, res) {
  try {
    const profile = await getFishingProfile(req.session.userId);
    return res.json(profile);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to build fishing profile' });
  }
}

module.exports = {
  getFishingProfileHandler,
};
