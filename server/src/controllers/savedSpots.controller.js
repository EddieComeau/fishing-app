const {
  createSavedSpot,
  listSavedSpots,
  getSavedSpotById,
  updateSavedSpot,
  deleteSavedSpot,
} = require('../services/savedSpots.service');

function parseSavedSpotId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

async function createSavedSpotHandler(req, res) {
  try {
    const spot = await createSavedSpot(req.session.userId, req.body || {});
    return res.status(201).json({ spot });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to create saved spot' });
  }
}

async function listSavedSpotsHandler(req, res) {
  try {
    const spots = await listSavedSpots(req.session.userId);
    return res.json({ spots });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list saved spots' });
  }
}

async function getSavedSpotHandler(req, res) {
  try {
    const savedSpotId = parseSavedSpotId(req.params.id);
    if (!savedSpotId) {
      return res.status(400).json({ error: 'Valid saved spot id is required' });
    }

    const spot = await getSavedSpotById(req.session.userId, savedSpotId);
    return res.json({ spot });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch saved spot' });
  }
}

async function updateSavedSpotHandler(req, res) {
  try {
    const savedSpotId = parseSavedSpotId(req.params.id);
    if (!savedSpotId) {
      return res.status(400).json({ error: 'Valid saved spot id is required' });
    }

    const spot = await updateSavedSpot(req.session.userId, savedSpotId, req.body || {});
    return res.json({ spot });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to update saved spot' });
  }
}

async function deleteSavedSpotHandler(req, res) {
  try {
    const savedSpotId = parseSavedSpotId(req.params.id);
    if (!savedSpotId) {
      return res.status(400).json({ error: 'Valid saved spot id is required' });
    }

    await deleteSavedSpot(req.session.userId, savedSpotId);
    return res.status(204).end();
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to delete saved spot' });
  }
}

module.exports = {
  createSavedSpotHandler,
  listSavedSpotsHandler,
  getSavedSpotHandler,
  updateSavedSpotHandler,
  deleteSavedSpotHandler,
};
