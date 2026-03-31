const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getSessionComparisonHandler } = require('../controllers/sessionComparison.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/:id/comparison', getSessionComparisonHandler);

module.exports = router;
