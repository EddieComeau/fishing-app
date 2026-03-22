const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

function isSaltOrBrackish(waterType) {
  const wt = String(waterType || '').toLowerCase();
  return wt === 'saltwater' || wt === 'brackish';
}

function inferStageSimple(now, nextHighAt, nextLowAt) {
  // Very simple heuristic:
  // If the next event is high -> incoming, if next is low -> outgoing.
  // If either missing -> "n/a"
  if (!nextHighAt || !nextLowAt) return 'n/a';

  const highT = new Date(nextHighAt).getTime();
  const lowT = new Date(nextLowAt).getTime();

  if (!Number.isFinite(highT) || !Number.isFinite(lowT)) return 'n/a';

  // whichever is sooner determines direction
  if (highT < lowT) return 'incoming';
  if (lowT < highT) return 'outgoing';
  return 'slack';
}

async function getNoaaTides({ waterType, tideStationId }) {
  if (!isSaltOrBrackish(waterType)) {
    return {
      provider: 'NOAA CO-OPS',
      fetchedAt: new Date().toISOString(),
      observedAt: null,
      stationId: null,
      data: { stage: 'n/a', heightFt: null, nextHighAt: null, nextLowAt: null }
    };
  }

  if (!tideStationId) {
    return {
      provider: 'NOAA CO-OPS',
      fetchedAt: new Date().toISOString(),
      observedAt: null,
      stationId: null,
      data: { stage: 'n/a', heightFt: null, nextHighAt: null, nextLowAt: null }
    };
  }

  // Use "predictions" + "datums" style is optional; keep it minimal.
  // We'll use product=predictions interval=hilo to get next high/low times.
  const base = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const begin = yyyymmdd;
  const endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');

  const hiloUrl =
    `${base}?product=predictions&application=FishDex&begin_date=${begin}` +
    `&end_date=${end}&datum=MLLW&station=${encodeURIComponent(tideStationId)}` +
    `&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

  const res = await fetch(hiloUrl);
  if (!res.ok) {
    throw new Error(`NOAA tides hilo failed: ${res.status}`);
  }

  const json = await res.json();
  const preds = json?.predictions || [];

  // Find next high and next low from now
  const nowMs = now.getTime();
  const upcoming = preds
    .map((p) => ({
      t: p.t, // "YYYY-MM-DD HH:MM"
      type: p.type, // "H" or "L"
      v: p.v
    }))
    .map((p) => ({ ...p, ms: new Date(p.t.replace(' ', 'T') + ':00').getTime() }))
    .filter((p) => Number.isFinite(p.ms) && p.ms >= nowMs)
    .sort((a, b) => a.ms - b.ms);

  const nextHigh = upcoming.find((p) => p.type === 'H')?.t || null;
  const nextLow = upcoming.find((p) => p.type === 'L')?.t || null;

  const stage = inferStageSimple(now, nextHigh, nextLow);

  return {
    provider: 'NOAA CO-OPS',
    fetchedAt: new Date().toISOString(),
    observedAt: now.toISOString(),
    stationId: String(tideStationId),
    data: {
      stage,
      heightFt: null, // Phase 1: omit height unless you want a water_level product later
      nextHighAt: nextHigh ? new Date(nextHigh.replace(' ', 'T') + ':00').toISOString() : null,
      nextLowAt: nextLow ? new Date(nextLow.replace(' ', 'T') + ':00').toISOString() : null
    }
  };
}

module.exports = { getNoaaTides };
