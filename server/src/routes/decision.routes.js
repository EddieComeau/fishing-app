const express = require('express');
const { getDecisionHandler } = require('../controllers/decision.controller');

const router = express.Router();

router.get('/', getDecisionHandler);

module.exports = router;
