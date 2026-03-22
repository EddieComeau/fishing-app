const express = require('express');
const router = express.Router();
const { getConditionsHandler } = require('../controllers/conditions.controller');

router.get('/', getConditionsHandler);

module.exports = router;
