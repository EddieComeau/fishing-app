# FishDex Starter

Current starter follows your canonical direction and now includes provider-backed mode.

## Implemented now

- Today context with:
  - spot
  - water type
  - access mode
  - lat/lng
  - optional NOAA tide station id
  - live/manual mode toggle
- Conditions snapshot with:
  - regime + confidence
  - observed timestamp
  - provider names + fetched timestamps
- Live provider modules:
  - `weatherApi.js` (NOAA NWS)
  - `tideApi.js` (NOAA CO-OPS)
  - `alertsApi.js` (NOAA NWS alerts)
  - `normalizeConditions.js` (manual/live contract normalization)
- Explainable target scoring + setup + fight guidance
- Catch logging persisted to local storage
- Manual fallback banner when live fetch fails

## Run

```bash
cd fishing-app
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Notes

- Live mode uses real NOAA endpoints.
- If API calls fail, app falls back to manual mode and shows a warning banner.
- For brackish/saltwater, provide a valid NOAA tide station id to enable tide ingestion.
