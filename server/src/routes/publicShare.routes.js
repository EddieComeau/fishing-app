const express = require('express');
const { getPublicShareHandler } = require('../controllers/share.controller');

const router = express.Router();

router.get('/:shareId', getPublicShareHandler);

module.exports = router;
