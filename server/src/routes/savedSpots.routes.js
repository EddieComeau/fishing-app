const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const {
  createSavedSpotHandler,
  listSavedSpotsHandler,
  getSavedSpotHandler,
  updateSavedSpotHandler,
  deleteSavedSpotHandler,
} = require('../controllers/savedSpots.controller');
const { getSavedSpotSummaryHandler } = require('../controllers/spotSummary.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/', createSavedSpotHandler);
router.get('/', listSavedSpotsHandler);
router.get('/:id/summary', getSavedSpotSummaryHandler);
router.get('/:id', getSavedSpotHandler);
router.put('/:id', updateSavedSpotHandler);
router.delete('/:id', deleteSavedSpotHandler);

module.exports = router;
