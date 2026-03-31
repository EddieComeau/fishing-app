const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getFishingProfileHandler } = require('../controllers/profile.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', getFishingProfileHandler);

module.exports = router;
