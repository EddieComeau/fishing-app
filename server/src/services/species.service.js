const { searchTaxa } = require('../providers/inat.provider');
const { enrichSpeciesOrigins } = require('./speciesOrigin.service');

async function searchSpecies(rawQuery) {
  const q = String(rawQuery || '').trim();

  if (q.length < 2) {
    const error = new Error('q must be at least 2 characters');
    error.status = 400;
    throw error;
  }

  const rows = await searchTaxa(q);

  const baseResults = rows.map((item) => ({
    id: item.id,
    commonName: item.commonName,
    scientificName: item.scientificName,
    imageUrl: item.imageUrl,
    source: item.source,
  }));

  return enrichSpeciesOrigins(baseResults);
}

module.exports = {
  searchSpecies,
};
