const { getSetupGuide, listSetupGuides } = require('../services/setupGuide.service');

async function listSetupGuidesHandler(req, res) {
  try {
    return res.json({ guides: listSetupGuides() });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to list setup guides' });
  }
}

async function getSetupGuideHandler(req, res) {
  try {
    const guide = getSetupGuide(req.params.id);
    return res.json(guide);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to load setup guide' });
  }
}

module.exports = {
  listSetupGuidesHandler,
  getSetupGuideHandler,
};
