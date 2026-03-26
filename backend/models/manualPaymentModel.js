const db = require('../config/database');
const crypto = require('crypto');

class ManualPaymentModel {
  /**
   * Initialize manual_payments table if it doesn't exist
   */
  static async init() {
    const sql = `
      CREATE TABLE IF NOT EXISTS manual_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'bdt',
        payment_method ENUM('bkash', 'nagad', 'both') NOT NULL,
        booking_payload JSON NOT NULL,
        status ENUM('pending', 'verified', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
        payment_details JSON,
        verified_by INT,
        verified_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 30 MINUTE)),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    try {
      await db.query(sql);
      console.log('✅ Manual payments table ready');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error initializing manual_payments table:', error.message);
      }
    }
  }

  /**
   * Create a pending manual payment record
   */
  static async createPendingPayment({
    paymentMethod,
    amount,
    currency,
    bookingPayload,
    userId,
  }) {
    const paymentId = this.generatePaymentId();
    const sql = `
      INSERT INTO manual_payments 
      (payment_id, user_id, amount, currency, payment_method, booking_payload, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    try {
      const [result] = await db.query(sql, [
        paymentId,
        userId,
        amount,
        currency,
        paymentMethod,
        JSON.stringify(bookingPayload),
      ]);

      return paymentId;
    } catch (error) {
      console.error('Error creating manual payment:', error.message);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    const sql = 'SELECT * FROM manual_payments WHERE payment_id = ?';
    try {
      const [rows] = await db.query(sql, [paymentId]);
      if (rows.length === 0) return null;

      const payment = rows[0];
      return {
        ...payment,
        booking_payload:
          typeof payment.booking_payload === 'string'
            ? JSON.parse(payment.booking_payload)
            : payment.booking_payload,
        payment_details:
          typeof payment.payment_details === 'string'
            ? JSON.parse(payment.payment_details)
            : payment.payment_details,
      };
    } catch (error) {
      console.error('Error retrieving manual payment:', error.message);
      throw error;
    }
  }

  /**
   * Get pending payments for user
   */
  static async getPendingPaymentsByUserId(userId, limit = 10) {
    const sql = `
      SELECT * FROM manual_payments 
      WHERE user_id = ? AND status = 'pending' AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await db.query(sql, [userId, limit]);
      return rows.map((payment) => ({
        ...payment,
        booking_payload:
          typeof payment.booking_payload === 'string'
            ? JSON.parse(payment.booking_payload)
            : payment.booking_payload,
      }));
    } catch (error) {
      console.error('Error retrieving pending payments:', error.message);
      throw error;
    }
  }

  /**
   * Get all pending payments (for admin)
   */
  static async getAllPendingPayments(limit = 50) {
    const sql = `
      SELECT 
        mp.*,
        u.email,
        u.name
      FROM manual_payments mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.status = 'pending' AND mp.expires_at > NOW()
      ORDER BY mp.created_at DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await db.query(sql, [limit]);
      return rows;
    } catch (error) {
      console.error('Error retrieving all pending payments:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as verified (admin action)
   */
  static async verifyPayment(paymentId, adminUserId, notes = '') {
    const sql = `
      UPDATE manual_payments 
      SET status = 'verified', verified_by = ?, verified_at = NOW(), notes = ?
      WHERE payment_id = ?
    `;

    try {
      const [result] = await db.query(sql, [adminUserId, notes, paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error verifying payment:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as completed (after ticket creation)
   */
  static async markPaymentCompleted(paymentId) {
    const sql = `
      UPDATE manual_payments 
      SET status = 'completed'
      WHERE payment_id = ?
    `;

    try {
      const [result] = await db.query(sql, [paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking payment completed:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as rejected
   */
  static async rejectPayment(paymentId, adminUserId, reason = '') {
    const sql = `
      UPDATE manual_payments 
      SET status = 'rejected', verified_by = ?, verified_at = NOW(), notes = ?
      WHERE payment_id = ?
    `;

    try {
      const [result] = await db.query(sql, [adminUserId, reason, paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error rejecting payment:', error.message);
      throw error;
    }
  }

  /**
   * Cancel expired pending payments
   */
  static async cancelExpiredPayments() {
    const sql = `
      UPDATE manual_payments 
      SET status = 'cancelled'
      WHERE status = 'pending' AND expires_at <= NOW()
    `;

    try {
      const [result] = await db.query(sql);
      if (result.affectedRows > 0) {
        console.log(`Cancelled ${result.affectedRows} expired payments`);
      }
      return result.affectedRows;
    } catch (error) {
      console.error('Error cancelling expired payments:', error.message);
      throw error;
    }
  }

  /**
   * Generate unique payment ID
   */
  static generatePaymentId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `PAY${timestamp}${random}`.toUpperCase().slice(0, 40);
  }
}

module.exports = ManualPaymentModel;
