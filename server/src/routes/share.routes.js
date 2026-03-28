const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const {
  createSessionShareHandler,
  createSpotShareHandler,
} = require('../controllers/share.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/session/:id', createSessionShareHandler);
router.post('/spot/:id', createSpotShareHandler);

module.exports = router;
