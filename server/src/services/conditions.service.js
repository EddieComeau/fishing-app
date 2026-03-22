const { getCache, setCache } = require('../cache/memoryCache');
const { getNwsHourly } = require('../providers/nws.provider');
const { getNoaaTides } = require('../providers/noaaTides.provider');
const { getNwsAlerts } = require('../providers/nwsAlerts.provider');
const { normalizeConditions } = require('../utils/normalizeConditions');
const { calculateBiteWindow } = require('./biteWindow.service');

function makeKey({ lat, lng, waterType, tideStationId, pressureTrend }) {
  return `conditions:${lat}:${lng}:${waterType}:${tideStationId || ''}:${pressureTrend || ''}`;
}

async function getConditions({ lat, lng, waterType, tideStationId, spotName, pressureTrend }) {
  const key = makeKey({ lat, lng, waterType, tideStationId, pressureTrend });
  const cached = getCache(key);
  if (cached) return { data: cached, cache: 'HIT' };

  // Fetch providers
  const [weatherPack, alertsPack, tidesPack] = await Promise.all([
    getNwsHourly(lat, lng),
    getNwsAlerts(lat, lng),
    getNoaaTides({ waterType, tideStationId })
  ]);

  const spot = {
    id: 'spot',
    name: spotName || 'Selected Spot',
    lat,
    lng,
    waterType,
    tideStationId: tideStationId || null
  };

  const normalized = normalizeConditions({
    spot,
    weatherPack,
    tidesPack,
    alertsPack,
    pressureTrend,
  });
  normalized.biteWindow = calculateBiteWindow(normalized);

  // TTL 10 minutes default
  setCache(key, normalized, 10 * 60 * 1000);

  return { data: normalized, cache: 'MISS' };
}

module.exports = { getConditions };
