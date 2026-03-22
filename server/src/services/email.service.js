const { query } = require('../config/db');

async function recordEmailEvent({ userId = null, email, category, subject, textBody, metadata = {} }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !category || !subject) {
    return null;
  }

  const result = await query(
    `INSERT INTO email_events (user_id, email, category, subject, text_body, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, created_at`,
    [userId, normalizedEmail, category, subject, textBody || null, JSON.stringify(metadata || {})]
  );

  console.log(`[FishDex email:${category}] to=${normalizedEmail} subject="${subject}"`);
  if (textBody) {
    console.log(textBody);
  }

  return result.rows[0] || null;
}

module.exports = {
  recordEmailEvent,
};
