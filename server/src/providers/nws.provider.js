const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function getNwsHourly(lat, lng) {
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;
  const pointsRes = await fetch(pointsUrl, {
    headers: { 'User-Agent': 'FishDex (learning project)' }
  });

  if (!pointsRes.ok) {
    throw new Error(`NWS points failed: ${pointsRes.status}`);
  }

  const pointsJson = await pointsRes.json();
  const hourlyUrl = pointsJson?.properties?.forecastHourly;

  if (!hourlyUrl) {
    throw new Error('NWS points response missing forecastHourly');
  }

  const hourlyRes = await fetch(hourlyUrl, {
    headers: { 'User-Agent': 'FishDex (learning project)' }
  });

  if (!hourlyRes.ok) {
    throw new Error(`NWS hourly failed: ${hourlyRes.status}`);
  }

  const hourlyJson = await hourlyRes.json();
  const periods = hourlyJson?.properties?.periods || [];
  const first = periods[0];

  if (!first) {
    throw new Error('NWS hourly periods empty');
  }

  // windSpeed is like "10 mph"
  const windMph = parseInt(String(first.windSpeed).replace(/[^\d]/g, ''), 10);
  const cloudCover = typeof first.cloudCover === 'number' ? first.cloudCover : null;
  const precipitation = first.probabilityOfPrecipitation?.value ?? null;

  return {
    provider: 'NOAA NWS',
    url: hourlyUrl,
    fetchedAt: new Date().toISOString(),
    observedAt: first.startTime,
    data: {
      tempF: first.temperature ?? null,
      windMph: Number.isFinite(windMph) ? windMph : null,
      // NWS gives cardinal direction "NW"
      windDirCardinal: first.windDirection ?? null,
      cloudCover,
      precipitation
    }
  };
}

module.exports = { getNwsHourly };
