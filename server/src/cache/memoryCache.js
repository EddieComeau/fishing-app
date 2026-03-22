// Simple in-memory TTL cache (Phase 1)
// Cache key: conditions:${lat}:${lng}:${waterType}:${tideStationId}

const store = new Map();

function setCache(key, value, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { value, expiresAt });
}

function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function clearCache() {
  store.clear();
}

module.exports = { setCache, getCache, clearCache };
