const express = require('express');
const { getSessionStartHandler } = require('../controllers/sessionStart.controller');

const router = express.Router();

router.get('/', getSessionStartHandler);

module.exports = router;
