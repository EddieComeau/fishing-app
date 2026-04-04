const express = require('express');
const { getSetupGuideHandler, listSetupGuidesHandler } = require('../controllers/setupGuide.controller');

const router = express.Router();

router.get('/', listSetupGuidesHandler);
router.get('/:id', getSetupGuideHandler);

module.exports = router;
