const {
  registerUser,
  loginUser,
  getUserById,
  requestPasswordReset,
  resetPassword,
} = require('../services/auth.service');

async function registerHandler(req, res) {
  try {
    const user = await registerUser(req.body || {});
    req.session.userId = user.id;
    return res.status(201).json({ user });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Register failed' });
  }
}

async function loginHandler(req, res) {
  try {
    const user = await loginUser(req.body || {});
    req.session.userId = user.id;
    return res.json({ user });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Login failed' });
  }
}

function logoutHandler(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('fishdex.sid');
    return res.json({ ok: true });
  });
}

async function forgotPasswordHandler(req, res) {
  try {
    const result = await requestPasswordReset(req.body || {});
    return res.json({
      ok: true,
      message: 'If that email exists, a password reset message has been prepared.',
      previewToken: result.previewToken || null,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Password reset request failed' });
  }
}

async function resetPasswordHandler(req, res) {
  try {
    await resetPassword(req.body || {});
    return res.json({ ok: true });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Password reset failed' });
  }
}

async function meHandler(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.json({ user });
}

module.exports = {
  registerHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
};
