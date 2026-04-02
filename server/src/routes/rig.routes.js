const express = require('express');
const { recommendRigHandler, checkRigHandler } = require('../controllers/rig.controller');

const router = express.Router();

router.post('/recommend', recommendRigHandler);
router.post('/check', checkRigHandler);

module.exports = router;
