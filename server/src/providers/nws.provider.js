const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

function buildUpstreamError(message, status = 502) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getNwsHourly(lat, lng) {
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;
  const pointsRes = await fetch(pointsUrl, {
    headers: { 'User-Agent': 'FishDex (learning project)' }
  });

  if (!pointsRes.ok) {
    if (pointsRes.status === 404) {
      throw buildUpstreamError('NOAA weather coverage is unavailable for this location.', 502);
    }

    throw buildUpstreamError(`NOAA weather point lookup failed with status ${pointsRes.status}.`, 502);
  }

  const pointsJson = await pointsRes.json();
  const hourlyUrl = pointsJson?.properties?.forecastHourly;

  if (!hourlyUrl) {
    throw buildUpstreamError('NOAA weather response did not include an hourly forecast URL.', 502);
  }

  const hourlyRes = await fetch(hourlyUrl, {
    headers: { 'User-Agent': 'FishDex (learning project)' }
  });

  if (!hourlyRes.ok) {
    throw buildUpstreamError(`NOAA hourly weather fetch failed with status ${hourlyRes.status}.`, 502);
  }

  const hourlyJson = await hourlyRes.json();
  const periods = hourlyJson?.properties?.periods || [];
  const first = periods[0];

  if (!first) {
    throw buildUpstreamError('NOAA hourly weather returned no forecast periods.', 502);
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
