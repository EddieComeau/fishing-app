const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { getCache, setCache } = require('../cache/memoryCache');

const NAS_FISH_CACHE_KEY = 'usgs-nas:fishes:catalog:v1';
const NAS_FISH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NAS_API_BASE = 'http://nas.er.usgs.gov/api/v2';
const PAGE_LIMIT = 1000;
const MAX_PAGES = 10;

async function fetchFishSpeciesCatalog() {
  const cached = getCache(NAS_FISH_CACHE_KEY);
  if (cached) return cached;

  const catalog = [];
  let offset = 0;

  while (offset / PAGE_LIMIT < MAX_PAGES) {
    const params = new URLSearchParams({
      group: 'Fishes',
      limit: String(PAGE_LIMIT),
      offset: String(offset),
    });

    const response = await fetch(`${NAS_API_BASE}/species/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'FishDex (learning project)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`USGS NAS species search failed: ${response.status}`);
    }

    const payload = await response.json();
    const page = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
        ? payload.results
        : [];
    catalog.push(...page);

    if (page.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  setCache(NAS_FISH_CACHE_KEY, catalog, NAS_FISH_CACHE_TTL_MS);
  return catalog;
}

module.exports = {
  fetchFishSpeciesCatalog,
};
