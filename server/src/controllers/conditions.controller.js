const { getConditions } = require('../services/conditions.service');

function asNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
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
    return res.status(500).json({ error: 'Failed to fetch conditions' });
  }
}

module.exports = { getConditionsHandler };
