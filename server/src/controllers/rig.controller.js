const { recommendRig } = require('../services/rig.service');

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

module.exports = {
  recommendRigHandler,
};
