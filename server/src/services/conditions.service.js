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

function buildTidesFallbackPack(tideStationId) {
  return {
    provider: 'NOAA CO-OPS',
    fetchedAt: null,
    observedAt: null,
    stationId: tideStationId || null,
    data: {
      stage: 'n/a',
      heightFt: null,
      nextHighAt: null,
      nextLowAt: null,
    },
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

  const weatherPack = weatherResult.value;
  const tidesPack = tidesResult.status === 'fulfilled'
    ? tidesResult.value
    : buildTidesFallbackPack(tideStationId);
  const alertsPack = alertsResult.status === 'fulfilled'
    ? alertsResult.value
    : buildAlertsFallbackPack();

  if (tidesResult.status !== 'fulfilled') {
    console.warn('FishDex tides fallback engaged:', tidesResult.reason?.message || tidesResult.reason);
  }

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
