const express = require('express');
const { recommendRigHandler } = require('../controllers/rig.controller');

const router = express.Router();

router.post('/recommend', recommendRigHandler);

module.exports = router;
