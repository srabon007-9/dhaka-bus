const db = require('../config/database');
const crypto = require('crypto');
const { rethrowIfMissingTable } = require('./tableDependencyError');

class ManualPaymentModel {
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
      rethrowIfMissingTable(error, 'manual_payments');
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
      rethrowIfMissingTable(error, 'manual_payments');
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
      rethrowIfMissingTable(error, 'manual_payments');
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
        u.name,
        CASE
          WHEN mp.expires_at <= NOW() THEN 'expired'
          ELSE mp.status
        END AS admin_status
      FROM manual_payments mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.status = 'pending'
      ORDER BY mp.created_at DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await db.query(sql, [limit]);
      return rows;
    } catch (error) {
      console.error('Error retrieving all pending payments:', error.message);
      rethrowIfMissingTable(error, 'manual_payments');
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
      rethrowIfMissingTable(error, 'manual_payments');
    }
  }

  /**
   * Mark payment as completed (after ticket creation)
   */
  static async markPaymentCompleted(paymentId, paymentDetails = null) {
    const sql = `
      UPDATE manual_payments 
      SET status = 'completed', payment_details = ?
      WHERE payment_id = ?
    `;

    try {
      const serializedPaymentDetails = paymentDetails ? JSON.stringify(paymentDetails) : null;
      const [result] = await db.query(sql, [serializedPaymentDetails, paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking payment completed:', error.message);
      rethrowIfMissingTable(error, 'manual_payments');
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
      rethrowIfMissingTable(error, 'manual_payments');
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
      rethrowIfMissingTable(error, 'manual_payments');
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
