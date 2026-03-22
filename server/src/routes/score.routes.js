const express = require('express');
const { scoreConditionsHandler } = require('../controllers/score.controller');

const router = express.Router();

router.post('/conditions', scoreConditionsHandler);

module.exports = router;
