const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getSavedSpotPlanHandler } = require('../controllers/spotPlan.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/:id/plan', getSavedSpotPlanHandler);

module.exports = router;
