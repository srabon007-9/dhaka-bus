const pool = require('../config/database');

let paymentTableReadyPromise;

const ensurePaymentSessionTable = async () => {
  if (!paymentTableReadyPromise) {
    paymentTableReadyPromise = pool.query(
      `CREATE TABLE IF NOT EXISTS payment_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        booking_payload JSON NOT NULL,
        amount_expected DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'bdt',
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        ticket_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
        INDEX idx_user_status (user_id, status)
      )`
    );
  }

  await paymentTableReadyPromise;
};

const createPendingSession = async ({ sessionId, userId, bookingPayload, amountExpected, currency }) => {
  await ensurePaymentSessionTable();

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
};

const getSessionById = async (sessionId) => {
  await ensurePaymentSessionTable();

  const [rows] = await pool.query(
    `SELECT * FROM payment_sessions WHERE session_id = ? LIMIT 1`,
    [sessionId]
  );

  return rows[0] || null;
};

const markSessionCompleted = async (sessionId, ticketId) => {
  await ensurePaymentSessionTable();

  const [result] = await pool.query(
    `UPDATE payment_sessions
     SET status = 'completed', ticket_id = ?, completed_at = NOW()
     WHERE session_id = ?`,
    [ticketId, sessionId]
  );

  return result;
};

const markSessionFailed = async (sessionId) => {
  await ensurePaymentSessionTable();

  const [result] = await pool.query(
    `UPDATE payment_sessions
     SET status = 'failed'
     WHERE session_id = ?`,
    [sessionId]
  );

  return result;
};

module.exports = {
  createPendingSession,
  getSessionById,
  markSessionCompleted,
  markSessionFailed,
};
