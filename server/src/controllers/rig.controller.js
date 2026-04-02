const { recommendRig } = require('../services/rig.service');
const { checkRigSetup } = require('../services/rigCheck.service');

async function recommendRigHandler(req, res) {
  try {
    const recommendation = await recommendRig(req.body || {}, {
      userId: req.session?.userId || null,
    });
    return res.json(recommendation);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Rig recommendation failed' });
  }
}

async function checkRigHandler(req, res) {
  try {
    const result = checkRigSetup(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Rig check failed' });
  }
}

module.exports = {
  recommendRigHandler,
  checkRigHandler,
};
