const pool = require('../config/database');
const { rethrowIfMissingTable } = require('./tableDependencyError');

const createResetToken = async ({ userId, tokenHash, expiresAt }) => {
  try {
    // Invalidate prior active tokens for this user.
    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [userId]
    );

    const [result] = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'password_reset_tokens');
  }
};

const getActiveTokenByHash = async (tokenHash) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    return rows[0] || null;
  } catch (error) {
    rethrowIfMissingTable(error, 'password_reset_tokens');
  }
};

const markTokenUsed = async (id) => {
  try {
    const [result] = await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'password_reset_tokens');
  }
};

module.exports = {
  createResetToken,
  getActiveTokenByHash,
  markTokenUsed,
};
