const express = require('express');
const { getBiteWindowHandler } = require('../controllers/biteWindow.controller');

const router = express.Router();

router.get('/', getBiteWindowHandler);

module.exports = router;
