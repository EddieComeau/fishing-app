const express = require('express');
const { fightStrategyHandler } = require('../controllers/fight.controller');

const router = express.Router();

router.post('/strategy', fightStrategyHandler);

module.exports = router;
