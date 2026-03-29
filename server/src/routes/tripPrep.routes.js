const express = require('express');
const { getTripPrepHandler } = require('../controllers/tripPrep.controller');

const router = express.Router();

router.get('/', getTripPrepHandler);

module.exports = router;
