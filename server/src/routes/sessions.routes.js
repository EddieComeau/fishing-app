const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const {
  startSessionHandler,
  getActiveSessionHandler,
  endSessionHandler,
  getSessionSummaryHandler,
  listSessionHistoryHandler,
} = require('../controllers/sessions.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/', startSessionHandler);
router.get('/active', getActiveSessionHandler);
router.get('/history', listSessionHistoryHandler);
router.post('/:id/end', endSessionHandler);
router.get('/:id', getSessionSummaryHandler);

module.exports = router;
