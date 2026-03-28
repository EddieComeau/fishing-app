const { getConditions } = require('../services/conditions.service');
const { recommendSpots } = require('../services/spot.service');
const {
  VALID_FILTER_MODES,
  VALID_RANK_MODES,
  normalizeFilterMode,
  normalizeRankMode,
} = require('../services/spotFilter.service');

function asNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function hasValidCoordinateRange(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

async function getSpotRecommendationsHandler(req, res) {
  try {
    const lat = asNumber(req.query.lat);
    const lng = asNumber(req.query.lng);
    const waterType = req.query.waterType || 'freshwater';
    const tideStationId = req.query.tideStationId || null;
    const spotName = req.query.spotName || null;
    const pressureTrend = req.query.pressureTrend || null;
    const filterMode = normalizeFilterMode(req.query.filterMode);
    const rankMode = normalizeRankMode(req.query.rankMode);
    const savedSpotIdRaw = req.query.savedSpotId;
    const savedSpotId = savedSpotIdRaw === undefined || savedSpotIdRaw === null || savedSpotIdRaw === ''
      ? null
      : Number(savedSpotIdRaw);

    if (lat === null || lng === null) {
      return res.status(400).json({ error: 'lat and lng are required numbers' });
    }

    if (!hasValidCoordinateRange(lat, lng)) {
      return res.status(400).json({ error: 'lat must be between -90 and 90, and lng must be between -180 and 180' });
    }

    if (savedSpotId !== null && !Number.isInteger(savedSpotId)) {
      return res.status(400).json({ error: 'savedSpotId must be an integer when provided' });
    }

    if (req.query.filterMode && !VALID_FILTER_MODES.has(String(req.query.filterMode).trim().toLowerCase())) {
      return res.status(400).json({ error: 'filterMode must be one of: default, proven_only, saved_spot_only' });
    }

    if (req.query.rankMode && !VALID_RANK_MODES.has(String(req.query.rankMode).trim().toLowerCase())) {
      return res.status(400).json({ error: 'rankMode must be one of: default, history_first, environment_first' });
    }

    const { data } = await getConditions({
      lat,
      lng,
      waterType,
      tideStationId,
      spotName,
      pressureTrend,
    });

    return res.json(await recommendSpots(data, {
      userId: req.session?.userId || null,
      savedSpotId,
      filterMode,
      rankMode,
    }));
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to build spot recommendations' });
  }
}

module.exports = {
  getSpotRecommendationsHandler,
};
