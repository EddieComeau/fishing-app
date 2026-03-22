const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../config/db');
const { recordEmailEvent } = require('./email.service');

/*
Register a new user
- normalizes email
- hashes password with bcrypt
- inserts into Postgres
*/
async function registerUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!normalizedEmail || !rawPassword) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  // HASH PASSWORD BEFORE STORING
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  try {
    const result = await query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    await recordEmailEvent({
      userId: user.id,
      email: user.email,
      category: 'welcome',
      subject: 'Welcome to FishDex',
      textBody: `Welcome to FishDex.\n\nYour account has been created for ${user.email}.`,
      metadata: {
        type: 'account_created',
      },
    });

    return user;
  } catch (error) {
    // Handle duplicate email
    if (error.code === '23505') {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    throw error;
  }
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  const result = await query(
    `SELECT id, email
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0] || null;
  if (!user) {
    return { ok: true, previewToken: null };
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashResetToken(rawToken);

  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [user.id, tokenHash]
  );

  await recordEmailEvent({
    userId: user.id,
    email: user.email,
    category: 'password_reset_requested',
    subject: 'FishDex password reset request',
    textBody: `A FishDex password reset was requested for ${user.email}.\n\nUse this reset token within 1 hour:\n${rawToken}`,
    metadata: {
      type: 'password_reset_requested',
    },
  });

  return {
    ok: true,
    previewToken: process.env.NODE_ENV === 'production' ? null : rawToken,
  };
}

async function resetPassword({ token, password }) {
  const rawToken = String(token || '').trim();
  const rawPassword = String(password || '');

  if (!rawToken || !rawPassword) {
    const err = new Error('Reset token and new password are required');
    err.status = 400;
    throw err;
  }

  const tokenHash = hashResetToken(rawToken);
  const result = await query(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = $1
     ORDER BY prt.created_at DESC
     LIMIT 1`,
    [tokenHash]
  );

  const resetToken = result.rows[0] || null;
  if (!resetToken || resetToken.used_at || new Date(resetToken.expires_at).getTime() < Date.now()) {
    const err = new Error('Reset token is invalid or expired');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  await query(
    `UPDATE users
     SET password_hash = $1
     WHERE id = $2`,
    [passwordHash, resetToken.user_id]
  );

  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = $1`,
    [resetToken.id]
  );

  await recordEmailEvent({
    userId: resetToken.user_id,
    email: resetToken.email,
    category: 'password_reset_completed',
    subject: 'FishDex password updated',
    textBody: `The password for ${resetToken.email} was updated successfully.`,
    metadata: {
      type: 'password_reset_completed',
    },
  });

  return { ok: true };
}

/*
Login user
- verifies email exists
- compares password against bcrypt hash
*/
async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!normalizedEmail || !rawPassword) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const result = await query(
    `SELECT id, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  // User not found
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // COMPARE PASSWORD TO HASH
  const valid = await bcrypt.compare(rawPassword, user.password_hash);

  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Return safe user object (never return password_hash)
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

/*
Get user by ID (used for session auth)
*/
async function getUserById(id) {
  const result = await query(
    `SELECT id, email, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  requestPasswordReset,
  resetPassword,
};
