(function () {
  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function stageFromPredictions(predictions) {
    if (!predictions || predictions.length < 2) return "n/a";

    const now = Date.now();
    let before = null;
    let after = null;

    for (const p of predictions) {
      const ts = new Date(p.t).getTime();
      if (ts <= now) before = p;
      if (ts > now) {
        after = p;
        break;
      }
    }

    if (!before || !after) return "n/a";

    const delta = toNumber(after.v) - toNumber(before.v);
    if (delta > 0.08) return "incoming";
    if (delta < -0.08) return "outgoing";
    return "slack";
  }

  function nextEventTime(predictions, kind) {
    if (!predictions) return null;
    const now = Date.now();
    const event = predictions.find((p) => new Date(p.t).getTime() > now && p.type === kind);
    return event ? new Date(event.t).toISOString() : null;
  }

  async function fetchNoaaTides(stationId) {
    const now = new Date();
    const begin = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = `${tomorrow.getUTCFullYear()}${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}${String(tomorrow.getUTCDate()).padStart(2, "0")}`;

    const predUrl = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
    predUrl.searchParams.set("product", "predictions");
    predUrl.searchParams.set("application", "fishdex");
    predUrl.searchParams.set("begin_date", begin);
    predUrl.searchParams.set("end_date", end);
    predUrl.searchParams.set("datum", "MLLW");
    predUrl.searchParams.set("station", stationId);
    predUrl.searchParams.set("time_zone", "gmt");
    predUrl.searchParams.set("units", "english");
    predUrl.searchParams.set("interval", "h");
    predUrl.searchParams.set("format", "json");

    const hiloUrl = new URL(predUrl.toString());
    hiloUrl.searchParams.set("interval", "hilo");

    const [predRes, hiloRes] = await Promise.all([fetch(predUrl), fetch(hiloUrl)]);

    if (!predRes.ok) {
      throw new Error(`NOAA tide predictions failed: ${predRes.status}`);
    }

    if (!hiloRes.ok) {
      throw new Error(`NOAA tide hilo failed: ${hiloRes.status}`);
    }

    const predJson = await predRes.json();
    const hiloJson = await hiloRes.json();

    const predictions = predJson?.predictions || [];
    const hilo = hiloJson?.predictions || [];

    const last = predictions[predictions.length - 1] || null;

    return {
      provider: "NOAA CO-OPS",
      stationId,
      fetchedAt: new Date().toISOString(),
      observedAt: last ? new Date(last.t).toISOString() : new Date().toISOString(),
      tide: {
        stage: stageFromPredictions(predictions),
        heightFt: last ? Number(last.v) : null,
        nextHighAt: nextEventTime(hilo, "H"),
        nextLowAt: nextEventTime(hilo, "L"),
      },
    };
  }

  window.FishDexTideApi = {
    fetchNoaaTides,
  };
})();
