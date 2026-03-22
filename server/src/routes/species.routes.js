const express = require('express');
const { searchSpeciesHandler } = require('../controllers/species.controller');

const router = express.Router();

router.get('/search', searchSpeciesHandler);

module.exports = router;
