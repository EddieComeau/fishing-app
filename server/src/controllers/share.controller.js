const {
  createSessionShareLink,
  createSpotShareLink,
  getSharedPayload,
} = require('../services/share.service');

function parseIntegerId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    const err = new Error(`Valid ${label} id is required`);
    err.status = 400;
    throw err;
  }
  return id;
}

function renderPublicShareHtml(payload) {
  const safeJson = JSON.stringify(payload, null, 2)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const title = payload.type === 'session'
    ? payload.data?.name || 'Shared Session'
    : payload.data?.name || 'Shared Spot';

  const summaryItems = payload.type === 'session'
    ? [
        ['Location', payload.data?.locationLabel || 'Unknown location'],
        ['Duration', payload.data?.duration || 'n/a'],
        ['Catches', payload.data?.catches ?? 0],
        ['Top Species', payload.data?.topSpecies || 'n/a'],
        ['Top Rig', payload.data?.topRig || 'n/a'],
      ]
    : [
        ['Sessions', payload.data?.summary?.totalSessions ?? 0],
        ['Catches', payload.data?.summary?.totalCatches ?? 0],
        ['Top Species', payload.data?.summary?.topSpecies || 'n/a'],
        ['Top Rig', payload.data?.summary?.topRig || 'n/a'],
      ];

  const rows = summaryItems
    .map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FishDex Share</title>
    <style>
      body { font-family: Georgia, serif; margin: 0; background: linear-gradient(180deg, #f4efe4, #dfe8e3); color: #1b2a24; }
      main { max-width: 760px; margin: 0 auto; padding: 32px 20px 48px; }
      .card { background: rgba(255,255,255,0.82); border: 1px solid rgba(27,42,36,0.12); border-radius: 18px; padding: 24px; box-shadow: 0 18px 40px rgba(27,42,36,0.08); }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #4e6a5f; }
      h1 { margin: 8px 0 10px; font-size: 34px; }
      p { line-height: 1.5; }
      ul { list-style: none; padding: 0; margin: 18px 0; }
      li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid rgba(27,42,36,0.08); }
      li:last-child { border-bottom: 0; }
      pre { margin-top: 24px; background: #1f2d27; color: #e8f0ec; padding: 16px; border-radius: 12px; overflow: auto; font-size: 13px; }
      .note { color: #4e6a5f; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <div class="card">
        <div class="eyebrow">FishDex Shared ${payload.type === 'session' ? 'Session' : 'Spot'}</div>
        <h1>${title}</h1>
        <p class="note">This view is read-only and intentionally excludes private identity and exact coordinate data.</p>
        <ul>${rows}</ul>
        <pre>${safeJson}</pre>
      </div>
    </main>
  </body>
</html>`;
}

async function createSessionShareHandler(req, res) {
  try {
    const sessionId = parseIntegerId(req.params.id, 'session');
    const link = await createSessionShareLink(req.session.userId, sessionId);
    return res.status(201).json({
      shareId: link.id,
      url: `/share/${link.id}`,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to create session share link' });
  }
}

async function createSpotShareHandler(req, res) {
  try {
    const savedSpotId = parseIntegerId(req.params.id, 'saved spot');
    const link = await createSpotShareLink(req.session.userId, savedSpotId);
    return res.status(201).json({
      shareId: link.id,
      url: `/share/${link.id}`,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to create saved spot share link' });
  }
}

async function getPublicShareHandler(req, res) {
  try {
    const payload = await getSharedPayload(String(req.params.shareId || '').trim());
    const accept = String(req.headers.accept || '').toLowerCase();

    if (accept.includes('text/html')) {
      return res.type('html').send(renderPublicShareHtml(payload));
    }

    return res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    const accept = String(req.headers.accept || '').toLowerCase();
    if (accept.includes('text/html')) {
      return res.status(status).type('html').send('<h1>Share not found</h1>');
    }
    return res.status(status).json({ error: error.message || 'Failed to fetch shared view' });
  }
}

module.exports = {
  createSessionShareHandler,
  createSpotShareHandler,
  getPublicShareHandler,
};
