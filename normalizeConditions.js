(function () {
  function normalizeManual(input) {
    const observedAt = new Date().toISOString();
    return {
      spot: {
        id: input.spot,
        name: input.spot,
        lat: input.lat,
        lng: input.lng,
        waterType: input.waterType,
        tideStationId: input.tideStationId || null,
      },
      observedAt,
      sources: {
        weather: {
          provider: "Manual input",
          fetchedAt: observedAt,
          observedAt,
          url: null,
        },
        tides: {
          provider: "Manual input",
          fetchedAt: observedAt,
          observedAt,
          stationId: input.tideStationId || null,
        },
        alerts: {
          provider: "Manual input",
          fetchedAt: observedAt,
        },
      },
      weather: {
        tempF: input.tempF,
        windMph: input.windMph,
        windDirDeg: null,
        pressureTrend: input.pressureTrend || null,
        precipitation: null,
        cloudCover: null,
      },
      tide: {
        stage: input.tideStage,
        heightFt: null,
        nextHighAt: null,
        nextLowAt: null,
      },
      alerts: [],
    };
  }

  function normalizeLive(input, weatherData, tideData, alertsData) {
    const observedAt = weatherData.observedAt || new Date().toISOString();
    return {
      spot: {
        id: input.spot,
        name: input.spot,
        lat: input.lat,
        lng: input.lng,
        waterType: input.waterType,
        tideStationId: input.tideStationId || null,
      },
      observedAt,
      sources: {
        weather: {
          provider: weatherData.provider,
          fetchedAt: weatherData.fetchedAt,
          observedAt: weatherData.observedAt,
          url: weatherData.url || null,
        },
        tides: {
          provider: tideData?.provider || "n/a",
          fetchedAt: tideData?.fetchedAt || null,
          observedAt: tideData?.observedAt || null,
          stationId: tideData?.stationId || input.tideStationId || null,
        },
        alerts: {
          provider: alertsData?.provider || "n/a",
          fetchedAt: alertsData?.fetchedAt || null,
        },
      },
      weather: {
        tempF: weatherData.weather.tempF,
        windMph: weatherData.weather.windMph,
        windDirDeg: weatherData.weather.windDirDeg,
        pressureTrend: input.pressureTrend || weatherData.weather.pressureTrend || null,
        precipitation: weatherData.weather.precipitation,
        cloudCover: weatherData.weather.cloudCover,
      },
      tide: {
        stage: tideData?.tide?.stage || "n/a",
        heightFt: tideData?.tide?.heightFt || null,
        nextHighAt: tideData?.tide?.nextHighAt || null,
        nextLowAt: tideData?.tide?.nextLowAt || null,
      },
      alerts: alertsData?.alerts || [],
    };
  }

  window.FishDexNormalize = {
    normalizeManual,
    normalizeLive,
  };
})();
