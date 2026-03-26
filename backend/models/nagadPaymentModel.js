const db = require('../config/database');
const crypto = require('crypto');

class NagadPaymentModel {
  /**
   * Initialize nagad_payments table if it doesn't exist
   */
  static async init() {
    const sql = `
      CREATE TABLE IF NOT EXISTS nagad_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_ref_id VARCHAR(50) UNIQUE NOT NULL,
        merchant_id VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'bdt',
        booking_payload JSON NOT NULL,
        user_id INT,
        status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        payment_details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    try {
      await db.query(sql);
      console.log('✅ Nagad payments table ready');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error initializing nagad_payments table:', error.message);
      }
    }
  }

  /**
   * Create a pending Nagad payment record
   */
  static async createPendingPayment({
    paymentRefId,
    merchantId,
    amount,
    currency,
    bookingPayload,
    userId,
  }) {
    const sql = `
      INSERT INTO nagad_payments 
      (payment_ref_id, merchant_id, amount, currency, booking_payload, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    try {
      const [result] = await db.query(sql, [
        paymentRefId,
        merchantId,
        amount,
        currency,
        JSON.stringify(bookingPayload),
        userId,
      ]);

      return result.insertId;
    } catch (error) {
      console.error('Error creating Nagad payment:', error.message);
      throw error;
    }
  }

  /**
   * Get payment by reference ID
   */
  static async getPaymentByRefId(refId) {
    const sql = 'SELECT * FROM nagad_payments WHERE payment_ref_id = ?';
    try {
      const [rows] = await db.query(sql, [refId]);
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
      console.error('Error retrieving Nagad payment:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as completed with payment status
   */
  static async markPaymentCompleted(refId, paymentStatus) {
    const sql = `
      UPDATE nagad_payments 
      SET status = 'completed', payment_details = ?, completed_at = NOW()
      WHERE payment_ref_id = ?
    `;

    try {
      const [result] = await db.query(sql, [
        JSON.stringify(paymentStatus),
        refId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking Nagad payment completed:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as failed
   */
  static async markPaymentFailed(refId, errorReason) {
    const sql = `
      UPDATE nagad_payments 
      SET status = 'failed', payment_details = ?
      WHERE payment_ref_id = ?
    `;

    try {
      const [result] = await db.query(sql, [
        JSON.stringify({ error: errorReason }),
        refId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking Nagad payment failed:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as cancelled
   */
  static async markPaymentCancelled(refId) {
    const sql = `
      UPDATE nagad_payments 
      SET status = 'cancelled'
      WHERE payment_ref_id = ?
    `;

    try {
      const [result] = await db.query(sql, [refId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking Nagad payment cancelled:', error.message);
      throw error;
    }
  }

  /**
   * Generate unique payment reference ID
   */
  static generatePaymentRefId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `NAGAD${timestamp}${random}`.toUpperCase().slice(0, 50);
  }
}

module.exports = NagadPaymentModel;
