const { getConditions } = require('../services/conditions.service');

function asNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function hasValidCoordinateRange(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

async function getConditionsHandler(req, res) {
  try {
    const lat = asNumber(req.query.lat);
    const lng = asNumber(req.query.lng);
    const waterType = req.query.waterType || 'freshwater';
    const tideStationId = req.query.tideStationId || null;
    const spotName = req.query.spotName || null;
    const pressureTrend = req.query.pressureTrend || null;

    if (lat === null || lng === null) {
      return res.status(400).json({ error: 'lat and lng are required numbers' });
    }

    if (!hasValidCoordinateRange(lat, lng)) {
      return res.status(400).json({ error: 'lat must be between -90 and 90, and lng must be between -180 and 180' });
    }

    const { data, cache } = await getConditions({
      lat,
      lng,
      waterType,
      tideStationId,
      spotName,
      pressureTrend
    });

    res.setHeader('X-FishDex-Cache', cache);
    return res.json(data);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch conditions' });
  }
}

module.exports = { getConditionsHandler };
