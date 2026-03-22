const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { pool } = require('./db');

const PgSession = connectPgSimple(session);

function createSessionMiddleware() {
  return session({
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    name: 'fishdex.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}

module.exports = { createSessionMiddleware };
