const express = require('express');
const { getUnifiedIntelligenceHandler } = require('../controllers/intelligence.controller');

const router = express.Router();

router.get('/', getUnifiedIntelligenceHandler);

module.exports = router;
