const express = require('express');
const { getSpotRecommendationsHandler } = require('../controllers/spot.controller');

const router = express.Router();

router.get('/', getSpotRecommendationsHandler);

module.exports = router;
