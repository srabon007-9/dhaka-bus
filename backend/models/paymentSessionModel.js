const pool = require('../config/database');
const { rethrowIfMissingTable } = require('./tableDependencyError');

const createPendingSession = async ({ sessionId, userId, bookingPayload, amountExpected, currency }) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO payment_sessions (session_id, user_id, booking_payload, amount_expected, currency)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         booking_payload = VALUES(booking_payload),
         amount_expected = VALUES(amount_expected),
         currency = VALUES(currency),
         status = 'pending',
         ticket_id = NULL,
         completed_at = NULL`,
      [sessionId, userId, JSON.stringify(bookingPayload), amountExpected, currency]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'payment_sessions');
  }
};

const getSessionById = async (sessionId) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM payment_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId]
    );

    return rows[0] || null;
  } catch (error) {
    rethrowIfMissingTable(error, 'payment_sessions');
  }
};

const markSessionCompleted = async (sessionId, ticketId) => {
  try {
    const [result] = await pool.query(
      `UPDATE payment_sessions
       SET status = 'completed', ticket_id = ?, completed_at = NOW()
       WHERE session_id = ?`,
      [ticketId, sessionId]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'payment_sessions');
  }
};

const markSessionFailed = async (sessionId) => {
  try {
    const [result] = await pool.query(
      `UPDATE payment_sessions
       SET status = 'failed'
       WHERE session_id = ?`,
      [sessionId]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'payment_sessions');
  }
};

module.exports = {
  createPendingSession,
  getSessionById,
  markSessionCompleted,
  markSessionFailed,
};
