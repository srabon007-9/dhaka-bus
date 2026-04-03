const db = require('../config/database');
const crypto = require('crypto');
const { rethrowIfMissingTable } = require('./tableDependencyError');

class NagadPaymentModel {
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
      rethrowIfMissingTable(error, 'nagad_payments');
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
      rethrowIfMissingTable(error, 'nagad_payments');
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
      rethrowIfMissingTable(error, 'nagad_payments');
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
      rethrowIfMissingTable(error, 'nagad_payments');
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
      rethrowIfMissingTable(error, 'nagad_payments');
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
