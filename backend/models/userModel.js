const pool = require('../config/database');

const mapPublicUser = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    email_verified_at: row.email_verified_at,
    email_verified: Boolean(row.email_verified_at),
  };
};

const createUser = async ({
  name,
  email,
  password_hash,
  role = 'user',
  email_verified_at = null,
  verification_token_hash = null,
  verification_expires_at = null,
}) => {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, email_verified_at, verification_token_hash, verification_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password_hash, role, email_verified_at, verification_token_hash, verification_expires_at]
  );
  return result;
};

const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

const getUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at, email_verified_at FROM users WHERE id = ?',
    [id]
  );
  return mapPublicUser(rows[0] || null);
};

const getPublicUserByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at, email_verified_at FROM users WHERE email = ?',
    [email]
  );
  return mapPublicUser(rows[0] || null);
};

const updateVerificationToken = async (userId, verification_token_hash, verification_expires_at) => {
  const [result] = await pool.query(
    `UPDATE users
     SET verification_token_hash = ?, verification_expires_at = ?, email_verified_at = NULL
     WHERE id = ?`,
    [verification_token_hash, verification_expires_at, userId]
  );
  return result;
};

const getUserByVerificationTokenHash = async (tokenHash) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE verification_token_hash = ? LIMIT 1',
    [tokenHash]
  );
  return rows[0] || null;
};

const markEmailVerified = async (userId) => {
  const [result] = await pool.query(
    `UPDATE users
     SET email_verified_at = NOW(), verification_token_hash = NULL, verification_expires_at = NULL
     WHERE id = ?`,
    [userId]
  );
  return result;
};

module.exports = {
  mapPublicUser,
  createUser,
  getUserByEmail,
  getUserById,
  getPublicUserByEmail,
  updateVerificationToken,
  getUserByVerificationTokenHash,
  markEmailVerified,
};
