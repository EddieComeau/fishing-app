(function () {
  async function fetchNwsAlerts(spot) {
    const url = `https://api.weather.gov/alerts/active?point=${spot.lat},${spot.lng}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/geo+json",
      },
    });

    if (!res.ok) {
      throw new Error(`NWS alerts failed: ${res.status}`);
    }

    const json = await res.json();
    const features = json?.features || [];

    return {
      provider: "NOAA NWS Alerts",
      fetchedAt: new Date().toISOString(),
      alerts: features.map((feature) => {
        const props = feature.properties || {};
        return {
          id: props.id || feature.id || String(Math.random()),
          severity: props.severity || "Unknown",
          headline: props.headline || props.event || "Weather alert",
          startsAt: props.onset || props.effective || null,
          endsAt: props.ends || props.expires || null,
          source: "NOAA NWS",
        };
      }),
    };
  }

  window.FishDexAlertsApi = {
    fetchNwsAlerts,
  };
})();
