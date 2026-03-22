const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { postCatchHandler, getCatchesHandler } = require('../controllers/catches.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/', postCatchHandler);
router.get('/', getCatchesHandler);

module.exports = router;
