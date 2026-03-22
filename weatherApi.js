(function () {
  function parseWindMph(value) {
    if (!value) return null;
    const nums = String(value)
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number);
    if (!nums || !nums.length) return null;
    if (nums.length === 1) return nums[0];
    return (nums[0] + nums[1]) / 2;
  }

  function cardinalToDeg(cardinal) {
    const map = {
      N: 0,
      NNE: 22.5,
      NE: 45,
      ENE: 67.5,
      E: 90,
      ESE: 112.5,
      SE: 135,
      SSE: 157.5,
      S: 180,
      SSW: 202.5,
      SW: 225,
      WSW: 247.5,
      W: 270,
      WNW: 292.5,
      NW: 315,
      NNW: 337.5,
    };
    return map[cardinal] ?? null;
  }

  async function fetchNwsWeather(spot) {
    const pointUrl = `https://api.weather.gov/points/${spot.lat},${spot.lng}`;
    const pointRes = await fetch(pointUrl, {
      headers: {
        Accept: "application/geo+json",
      },
    });

    if (!pointRes.ok) {
      throw new Error(`NWS points failed: ${pointRes.status}`);
    }

    const pointJson = await pointRes.json();
    const hourlyUrl = pointJson?.properties?.forecastHourly;

    if (!hourlyUrl) {
      throw new Error("NWS hourly forecast URL missing");
    }

    const hourlyRes = await fetch(hourlyUrl, {
      headers: {
        Accept: "application/geo+json",
      },
    });

    if (!hourlyRes.ok) {
      throw new Error(`NWS hourly failed: ${hourlyRes.status}`);
    }

    const hourlyJson = await hourlyRes.json();
    const first = hourlyJson?.properties?.periods?.[0];

    if (!first) {
      throw new Error("NWS hourly periods unavailable");
    }

    return {
      provider: "NOAA NWS",
      url: hourlyUrl,
      fetchedAt: new Date().toISOString(),
      observedAt: first.startTime || new Date().toISOString(),
      raw: first,
      weather: {
        tempF: Number(first.temperature),
        windMph: parseWindMph(first.windSpeed),
        windDirDeg: cardinalToDeg(first.windDirection),
        pressureTrend: null,
        precipitation: first.probabilityOfPrecipitation?.value ?? null,
        cloudCover: null,
      },
    };
  }

  window.FishDexWeatherApi = {
    fetchNwsWeather,
  };
})();
