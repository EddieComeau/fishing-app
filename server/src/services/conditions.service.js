const { getCache, setCache } = require('../cache/memoryCache');
const { getNwsHourly } = require('../providers/nws.provider');
const { getNoaaTides } = require('../providers/noaaTides.provider');
const { getNwsAlerts } = require('../providers/nwsAlerts.provider');
const { normalizeConditions } = require('../utils/normalizeConditions');
const { calculateBiteWindow } = require('./biteWindow.service');

function makeKey({ lat, lng, waterType, tideStationId, pressureTrend }) {
  return `conditions:${lat}:${lng}:${waterType}:${tideStationId || ''}:${pressureTrend || ''}`;
}

function buildAlertsFallbackPack() {
  return {
    provider: 'NOAA NWS',
    fetchedAt: null,
    data: [],
  };
}

async function getConditions({ lat, lng, waterType, tideStationId, spotName, pressureTrend }) {
  const key = makeKey({ lat, lng, waterType, tideStationId, pressureTrend });
  const cached = getCache(key);
  if (cached) return { data: cached, cache: 'HIT' };

  // Fetch providers. Alerts are additive and may safely degrade to empty results.
  const [weatherResult, alertsResult, tidesResult] = await Promise.allSettled([
    getNwsHourly(lat, lng),
    getNwsAlerts(lat, lng),
    getNoaaTides({ waterType, tideStationId })
  ]);

  if (weatherResult.status !== 'fulfilled') {
    throw weatherResult.reason;
  }

  if (tidesResult.status !== 'fulfilled') {
    throw tidesResult.reason;
  }

  const weatherPack = weatherResult.value;
  const tidesPack = tidesResult.value;
  const alertsPack = alertsResult.status === 'fulfilled'
    ? alertsResult.value
    : buildAlertsFallbackPack();

  if (alertsResult.status !== 'fulfilled') {
    console.warn('FishDex alerts fallback engaged:', alertsResult.reason?.message || alertsResult.reason);
  }

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
