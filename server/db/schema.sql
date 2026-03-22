CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_catches_user_created_at ON catches(user_id, created_at DESC);
