require('dotenv').config();

const express = require('express');
const cors = require('cors');

const conditionsRoutes = require('./routes/conditions.routes');
const authRoutes = require('./routes/auth.routes');
const catchesRoutes = require('./routes/catches.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const speciesRoutes = require('./routes/species.routes');
const scoreRoutes = require('./routes/score.routes');
const biteWindowRoutes = require('./routes/biteWindow.routes');
const spotRoutes = require('./routes/spot.routes');
const savedSpotsRoutes = require('./routes/savedSpots.routes');
const shareRoutes = require('./routes/share.routes');
const publicShareRoutes = require('./routes/publicShare.routes');
const intelligenceRoutes = require('./routes/intelligence.routes');
const rigRoutes = require('./routes/rig.routes');
const fightRoutes = require('./routes/fight.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { createSessionMiddleware } = require('./config/session');
const { ensureSchema } = require('./config/db');

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:8080';

app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(createSessionMiddleware());

app.use('/api/conditions', conditionsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/catches', catchesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/bite-window', biteWindowRoutes);
app.use('/api/spots/saved', savedSpotsRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/rig', rigRoutes);
app.use('/api/fight', fightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/share', publicShareRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  await ensureSchema();

  app.listen(PORT, () => {
    console.log(`FishDex API running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
