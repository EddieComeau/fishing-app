const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getSessionReviewHandler } = require('../controllers/sessionReview.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/:id/review', getSessionReviewHandler);

module.exports = router;
