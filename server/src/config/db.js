const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString });

async function query(text, params) {
  return pool.query(text, params);
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS catches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_catch_id TEXT,
      species TEXT NOT NULL,
      weight_lb NUMERIC,
      bait TEXT,
      landed BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT catches_user_client_unique UNIQUE (user_id, client_catch_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_catches_user_created_at
    ON catches(user_id, created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE catches
    ADD COLUMN IF NOT EXISTS rig_name TEXT;
  `);

  await pool.query(`
    ALTER TABLE catches
    ADD COLUMN IF NOT EXISTS bait_family TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fishing_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      location_label TEXT,
      species_focus TEXT,
      activity_level_at_start TEXT,
      bite_window_score_start INTEGER,
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_spots (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      latitude NUMERIC NOT NULL,
      longitude NUMERIC NOT NULL,
      water_type TEXT NOT NULL,
      tide_station_id TEXT,
      location_label TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_saved_spots_user_updated_at
    ON saved_spots(user_id, updated_at DESC, created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE fishing_sessions
    ADD COLUMN IF NOT EXISTS activity_level_at_start TEXT;
  `);

  await pool.query(`
    ALTER TABLE fishing_sessions
    ADD COLUMN IF NOT EXISTS bite_window_score_start INTEGER;
  `);

  await pool.query(`
    ALTER TABLE fishing_sessions
    ADD COLUMN IF NOT EXISTS saved_spot_id INTEGER REFERENCES saved_spots(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_fishing_sessions_user_started_at
    ON fishing_sessions(user_id, started_at DESC);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fishing_sessions_one_active_per_user
    ON fishing_sessions(user_id)
    WHERE status = 'active';
  `);

  await pool.query(`
    ALTER TABLE catches
    ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES fishing_sessions(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_created_at
    ON password_reset_tokens(user_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      text_body TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_events_email_created_at
    ON email_events(email, created_at DESC);
  `);
}

module.exports = {
  pool,
  query,
  ensureSchema,
};
