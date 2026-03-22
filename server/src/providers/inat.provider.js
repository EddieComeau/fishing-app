const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function searchTaxa(query) {
  const q = encodeURIComponent(query);
  const url = `https://api.inaturalist.org/v1/taxa?q=${q}&rank=species&per_page=20&order=desc&order_by=observations_count`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FishDex (learning project)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`iNaturalist search failed: ${response.status}`);
  }

  const payload = await response.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const fishClasses = new Set(['Actinopterygii', 'Elasmobranchii', 'Sarcopterygii']);

  return results
    .filter((item) => fishClasses.has(item.iconic_taxon_name))
    .map((item) => ({
      id: `inat-${item.id}`,
      commonName: item.preferred_common_name || item.english_common_name || item.name || 'Unknown',
      scientificName: item.name || null,
      imageUrl: item.default_photo?.medium_url || item.default_photo?.square_url || null,
      source: 'iNaturalist',
      _raw: item,
    }));
}

module.exports = {
  searchTaxa,
};
