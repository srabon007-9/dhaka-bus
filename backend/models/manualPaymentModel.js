const db = require('../config/database');
const crypto = require('crypto');
const { rethrowIfMissingTable } = require('./tableDependencyError');
const bookingRequestModel = require('./bookingRequestModel');

class ManualPaymentModel {
  /**
   * Create a pending manual payment record
   */
  static async createPendingPayment({
    paymentMethod,
    amount,
    currency,
    bookingRequestId,
  }) {
    const paymentId = this.generatePaymentId();
    const sql = `
      INSERT INTO manual_payments 
      (payment_id, booking_request_id, amount, currency, payment_method, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    try {
      await db.query(sql, [
        paymentId,
        bookingRequestId,
        amount,
        currency,
        paymentMethod,
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
      const bookingRequest = await bookingRequestModel.getBookingRequestById(payment.booking_request_id);

      return {
        ...payment,
        booking_request: bookingRequest,
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
      SELECT mp.*
      FROM manual_payments mp
      JOIN booking_requests br ON br.id = mp.booking_request_id
      WHERE br.user_id = ? AND mp.status = 'pending' AND mp.expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await db.query(sql, [userId, limit]);
      return Promise.all(rows.map(async (payment) => ({
        ...payment,
        booking_request: await bookingRequestModel.getBookingRequestById(payment.booking_request_id),
      })));
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
      LEFT JOIN booking_requests br ON br.id = mp.booking_request_id
      LEFT JOIN users u ON br.user_id = u.id
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
