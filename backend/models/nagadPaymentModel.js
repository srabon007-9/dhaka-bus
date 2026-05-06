const db = require('../config/database');
const crypto = require('crypto');
const { rethrowIfMissingTable } = require('./tableDependencyError');
const bookingRequestModel = require('./bookingRequestModel');

class NagadPaymentModel {
  /**
   * Create a pending Nagad payment record
   */
  static async createPendingPayment({
    paymentRefId,
    merchantId,
    amount,
    currency,
    bookingRequestId,
  }) {
    const sql = `
      INSERT INTO nagad_payments 
      (payment_ref_id, merchant_id, booking_request_id, amount, currency, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    try {
      const [result] = await db.query(sql, [
        paymentRefId,
        merchantId,
        bookingRequestId,
        amount,
        currency,
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
      const bookingRequest = await bookingRequestModel.getBookingRequestById(payment.booking_request_id);

      return {
        ...payment,
        booking_request: bookingRequest,
      };
    } catch (error) {
      console.error('Error retrieving Nagad payment:', error.message);
      rethrowIfMissingTable(error, 'nagad_payments');
    }
  }

  /**
   * Mark payment as completed with payment status
   */
  static async markPaymentCompleted(refId, paymentStatus = {}) {
    const sql = `
      UPDATE nagad_payments 
      SET status = 'completed', issuer_txn_id = ?, failure_reason = NULL, completed_at = NOW()
      WHERE payment_ref_id = ?
    `;

    try {
      const [result] = await db.query(sql, [
        paymentStatus.issuerTxnID || null,
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
      SET status = 'failed', failure_reason = ?
      WHERE payment_ref_id = ?
    `;

    try {
      const [result] = await db.query(sql, [String(errorReason || '').slice(0, 255) || null, refId]);
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
