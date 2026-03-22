const { searchSpecies } = require('../services/species.service');

async function searchSpeciesHandler(req, res) {
  try {
    const results = await searchSpecies(req.query.q);
    return res.json(results);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Species search failed' });
  }
}

module.exports = {
  searchSpeciesHandler,
};
