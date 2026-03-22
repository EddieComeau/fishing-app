const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getCatchSummaryHandler } = require('../controllers/analytics.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/catches/summary', getCatchSummaryHandler);

module.exports = router;
