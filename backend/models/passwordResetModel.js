const pool = require('../config/database');

let resetTableReadyPromise;

const ensurePasswordResetTable = async () => {
  if (!resetTableReadyPromise) {
    resetTableReadyPromise = pool.query(
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_expires (user_id, expires_at)
      )`
    );
  }

  await resetTableReadyPromise;
};

const createResetToken = async ({ userId, tokenHash, expiresAt }) => {
  await ensurePasswordResetTable();

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
};

const getActiveTokenByHash = async (tokenHash) => {
  await ensurePasswordResetTable();

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
};

const markTokenUsed = async (id) => {
  await ensurePasswordResetTable();

  const [result] = await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = ?`,
    [id]
  );

  return result;
};

module.exports = {
  createResetToken,
  getActiveTokenByHash,
  markTokenUsed,
};
