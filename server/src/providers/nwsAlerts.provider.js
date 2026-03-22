const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function getNwsAlerts(lat, lng) {
  // NWS supports alerts by point:
  // /alerts/active?point=lat,lon
  const url = `https://api.weather.gov/alerts/active?point=${lat},${lng}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FishDex (learning project)' }
  });

  if (!res.ok) {
    throw new Error(`NWS alerts failed: ${res.status}`);
  }

  const json = await res.json();
  const features = json?.features || [];

  const alerts = features.slice(0, 6).map((f) => {
    const p = f.properties || {};
    return {
      id: f.id || p.id || p.event || 'alert',
      severity: p.severity || 'Unknown',
      headline: p.headline || p.event || 'Weather Alert',
      startsAt: p.effective || p.onset || null,
      endsAt: p.ends || p.expires || null,
      source: 'NOAA NWS'
    };
  });

  return {
    provider: 'NOAA NWS',
    fetchedAt: new Date().toISOString(),
    data: alerts
  };
}

module.exports = { getNwsAlerts };
