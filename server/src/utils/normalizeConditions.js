function normalizeConditions({ spot, weatherPack, tidesPack, alertsPack, pressureTrend }) {
  // Spot is passed through from query params (Phase 1)
  const observedAt =
    weatherPack?.observedAt ||
    tidesPack?.observedAt ||
    new Date().toISOString();

  return {
    spot: {
      id: spot.id || 'spot',
      name: spot.name || 'Selected Spot',
      lat: spot.lat,
      lng: spot.lng,
      waterType: spot.waterType,
      tideStationId: spot.tideStationId || null
    },
    observedAt,
    sources: {
      weather: {
        provider: weatherPack?.provider || 'Unknown',
        fetchedAt: weatherPack?.fetchedAt || null,
        observedAt: weatherPack?.observedAt || null,
        url: weatherPack?.url || null
      },
      tides: {
        provider: tidesPack?.provider || 'Unknown',
        fetchedAt: tidesPack?.fetchedAt || null,
        observedAt: tidesPack?.observedAt || null,
        stationId: tidesPack?.stationId || null
      },
      alerts: {
        provider: alertsPack?.provider || 'Unknown',
        fetchedAt: alertsPack?.fetchedAt || null
      }
    },
    weather: {
      tempF: weatherPack?.data?.tempF ?? null,
      windMph: weatherPack?.data?.windMph ?? null,
      // Convert cardinal -> degrees later; Phase 1 returns null degrees
      windDirDeg: null,
      pressureTrend: pressureTrend || null,
      precipitation: weatherPack?.data?.precipitation ?? null,
      cloudCover: weatherPack?.data?.cloudCover ?? null
    },
    tide: {
      stage: tidesPack?.data?.stage ?? 'n/a',
      heightFt: tidesPack?.data?.heightFt ?? null,
      nextHighAt: tidesPack?.data?.nextHighAt ?? null,
      nextLowAt: tidesPack?.data?.nextLowAt ?? null
    },
    alerts: Array.isArray(alertsPack?.data) ? alertsPack.data : []
  };
}

module.exports = { normalizeConditions };
