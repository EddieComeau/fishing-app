const { createCatch, listCatches } = require('../services/catches.service');

async function postCatchHandler(req, res) {
  try {
    const item = await createCatch(req.session.userId, req.body || {});
    return res.status(201).json(item);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Create catch failed' });
  }
}

async function getCatchesHandler(req, res) {
  try {
    const items = await listCatches(req.session.userId);
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Fetch catches failed' });
  }
}

module.exports = {
  postCatchHandler,
  getCatchesHandler,
};
