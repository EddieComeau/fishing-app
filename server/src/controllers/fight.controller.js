const { fightStrategy } = require('../services/fight.service');

function fightStrategyHandler(req, res) {
  try {
    const result = fightStrategy(req.body || {});
    return res.json(result);
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({ error: error.message || 'Fight strategy failed' });
  }
}

module.exports = {
  fightStrategyHandler,
};
