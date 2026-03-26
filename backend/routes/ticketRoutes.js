const express = require('express');
const crypto = require('crypto');
const ticketModel = require('../models/ticketModel');
const nagadPaymentModel = require('../models/nagadPaymentModel');
const manualPaymentModel = require('../models/manualPaymentModel');
const userModel = require('../models/userModel');
const { sendPaymentConfirmationEmail } = require('../services/mailer');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Payment Mode Configuration
const PAYMENT_MODE = (process.env.PAYMENT_MODE || 'manual-both').toLowerCase();

// Manual Payment Configuration (Personal Accounts)
const BKASH_PERSONAL_NUMBER = process.env.BKASH_PERSONAL_NUMBER || '';
const BKASH_PERSONAL_NAME = process.env.BKASH_PERSONAL_NAME || 'Dhaka Bus';
const NAGAD_PERSONAL_NUMBER = process.env.NAGAD_PERSONAL_NUMBER || '';
const NAGAD_PERSONAL_NAME = process.env.NAGAD_PERSONAL_NAME || 'Dhaka Bus';

// Nagad Configuration
const NAGAD_MERCHANT_ID = process.env.NAGAD_MERCHANT_ID || '';
const NAGAD_MERCHANT_KEY = process.env.NAGAD_MERCHANT_KEY || '';
const NAGAD_MERCHANT_PHONE = process.env.NAGAD_MERCHANT_PHONE || '';
const NAGAD_API_URL = process.env.NAGAD_API_URL || 'https://api.nagadpay.com/api/dfs/check-out';
const NAGAD_CALLBACK_URL = process.env.NAGAD_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost'}/api/tickets/payment/nagad/callback`;

const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || 'bdt').toLowerCase();
const PAYMENT_SUCCESS_URL = process.env.PAYMENT_SUCCESS_URL
  || `${process.env.FRONTEND_URL || 'http://localhost'}/booking?payment=success&payment_ref=`;
const PAYMENT_CANCEL_URL = process.env.PAYMENT_CANCEL_URL
  || `${process.env.FRONTEND_URL || 'http://localhost'}/booking?payment=cancelled`;

const parseBookingPayload = (body) => ({
  trip_id: Number(body.trip_id),
  boarding_stop_id: Number(body.boarding_stop_id),
  dropoff_stop_id: Number(body.dropoff_stop_id),
  seat_numbers: Array.isArray(body.seat_numbers) ? body.seat_numbers : [],
  passenger_name: typeof body.passenger_name === 'string' ? body.passenger_name.trim() : '',
});

const ensureBookingPayload = (payload) => {
  const { trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers, passenger_name } = payload;

  if (!trip_id || !boarding_stop_id || !dropoff_stop_id || !Array.isArray(seat_numbers) || !seat_numbers.length || !passenger_name) {
    throw new ticketModel.TicketValidationError(
      'trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers (array), and passenger_name are required',
      400
    );
  }

  if (seat_numbers.length > 4) {
    throw new ticketModel.TicketValidationError('You can book at most 4 tickets at a time', 400);
  }
};

const buildTicketResponse = (ticket) => ({
  id: ticket.id,
  route_name: ticket.route_name,
  bus_name: ticket.bus_name,
  departure_time: ticket.departure_time,
  boarding_stop_name: ticket.boarding_stop_name,
  dropoff_stop_name: ticket.dropoff_stop_name,
  seat_numbers: (() => {
    if (Array.isArray(ticket.seat_numbers)) return ticket.seat_numbers;
    if (typeof ticket.seat_numbers === 'string') {
      try {
        return JSON.parse(ticket.seat_numbers);
      } catch {
        return [];
      }
    }
    return [];
  })(),
  total_price: ticket.total_price,
  passenger_name: ticket.passenger_name,
  status: ticket.status,
});

const parseStoredBookingPayload = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

const finalizePaidSession = async ({ paymentRefId, enforceUserId }) => {
  const nagadPayment = await nagadPaymentModel.getPaymentByRefId(paymentRefId);
  if (!nagadPayment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (enforceUserId && Number(nagadPayment.user_id) !== Number(enforceUserId)) {
    const error = new Error('You are not allowed to complete this payment');
    error.statusCode = 403;
    throw error;
  }

  if (nagadPayment.status === 'completed') {
    // Try to find the ticket created from this payment
    const tickets = await ticketModel.getTicketsByUserId(nagadPayment.user_id);
    const relatedTicket = tickets.find(t => t.id > 0); // Return any ticket (in real scenario, store ticket_id in payment)
    return {
      alreadyConfirmed: true,
      ticket: relatedTicket ? buildTicketResponse(relatedTicket) : { payment_status: 'completed' },
    };
  }

  if (nagadPayment.status !== 'completed') {
    const error = new Error('Payment is not completed yet');
    error.statusCode = 402;
    throw error;
  }

  const bookingPayload = parseStoredBookingPayload(nagadPayment.booking_payload);
  if (!bookingPayload) {
    const error = new Error('Stored booking payload is invalid');
    error.statusCode = 500;
    throw error;
  }

  const ticket = await ticketModel.reserveTicket(bookingPayload);
  await nagadPaymentModel.markPaymentCompleted(paymentRefId, { ticket_id: ticket.id });

  const savedTicket = await ticketModel.getTicketById(ticket.id);
  return {
    alreadyConfirmed: false,
    ticket: savedTicket ? buildTicketResponse(savedTicket) : ticket,
  };
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const data = req.user.role === 'admin'
      ? await ticketModel.getAllTickets()
      : await ticketModel.getTicketsByUserId(req.user.id);

    return res.json({ success: true, data, message: 'Tickets fetched successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching tickets', error: error.message });
  }
});

router.get('/trip/:tripId/booked-seats', async (req, res) => {
  try {
    const seats = await ticketModel.getBookedSeatsByTripId(
      req.params.tripId,
      req.query.boarding_stop_id,
      req.query.dropoff_stop_id
    );
    return res.json({ success: true, data: seats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching booked seats', error: error.message });
  }
});

router.post('/payment/checkout', verifyToken, async (req, res) => {
  try {
    const payload = parseBookingPayload(req.body);
    ensureBookingPayload(payload);

    const user = await userModel.getUserByEmail(req.user.email);
    if (!user?.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: 'Verify your email before buying tickets',
        verificationRequired: true,
      });
    }

    const quote = await ticketModel.getBookingQuote(payload);

    // ============ MANUAL PAYMENT MODE ============
    if (PAYMENT_MODE.includes('manual')) {
      const paymentId = await manualPaymentModel.createPendingPayment({
        paymentMethod: PAYMENT_MODE === 'manual-both' ? 'both' : PAYMENT_MODE.replace('manual-', ''),
        amount: quote.total_price,
        currency: PAYMENT_CURRENCY,
        bookingPayload: {
          user_id: req.user.id,
          trip_id: payload.trip_id,
          boarding_stop_id: payload.boarding_stop_id,
          dropoff_stop_id: payload.dropoff_stop_id,
          seat_numbers: quote.seat_numbers,
          passenger_name: payload.passenger_name,
        },
        userId: req.user.id,
      });

      const paymentMethods = [];

      if (PAYMENT_MODE === 'manual-both' || PAYMENT_MODE === 'manual-bkash') {
        if (BKASH_PERSONAL_NUMBER) {
          paymentMethods.push({
            method: 'bkash',
            accountName: BKASH_PERSONAL_NAME,
            accountNumber: BKASH_PERSONAL_NUMBER,
            instruction: `Send ${quote.total_price} BDT to ${BKASH_PERSONAL_NAME} (${BKASH_PERSONAL_NUMBER}) via bKash. Reference: ${paymentId}`,
          });
        }
      }

      if (PAYMENT_MODE === 'manual-both' || PAYMENT_MODE === 'manual-nagad') {
        if (NAGAD_PERSONAL_NUMBER) {
          paymentMethods.push({
            method: 'nagad',
            accountName: NAGAD_PERSONAL_NAME,
            accountNumber: NAGAD_PERSONAL_NUMBER,
            instruction: `Send ${quote.total_price} BDT to ${NAGAD_PERSONAL_NAME} (${NAGAD_PERSONAL_NUMBER}) via Nagad. Reference: ${paymentId}`,
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Manual payment initiated - Send money to confirm booking',
        data: {
          payment_id: paymentId,
          amount: quote.total_price,
          currency: PAYMENT_CURRENCY,
          seats: quote.seat_numbers,
          paymentMethods,
          expiresIn: '30 minutes',
        },
      });
    }

    // ============ NAGAD MERCHANT MODE ============
    if (PAYMENT_MODE === 'nagad' && (!NAGAD_MERCHANT_ID || !NAGAD_MERCHANT_KEY)) {
      return res.status(503).json({
        success: false,
        message: 'Nagad payment gateway is not configured on the server',
      });
    }

    const paymentRefId = nagadPaymentModel.generatePaymentRefId();
    await nagadPaymentModel.createPendingPayment({
      paymentRefId,
      merchantId: NAGAD_MERCHANT_ID,
      amount: quote.total_price,
      currency: PAYMENT_CURRENCY,
      bookingPayload: {
        user_id: req.user.id,
        trip_id: payload.trip_id,
        boarding_stop_id: payload.boarding_stop_id,
        dropoff_stop_id: payload.dropoff_stop_id,
        seat_numbers: quote.seat_numbers,
        passenger_name: payload.passenger_name,
      },
      userId: req.user.id,
    });

    const nagadPayload = {
      merchantId: NAGAD_MERCHANT_ID,
      orderId: paymentRefId,
      amount: parseInt(quote.total_price),
      payer: req.user.email,
      payerMobile: NAGAD_MERCHANT_PHONE,
      callbackURL: NAGAD_CALLBACK_URL,
      redirectURL: `${PAYMENT_SUCCESS_URL}${paymentRefId}`,
      additionalMerchantId: '',
    };

    const keyString = Object.keys(nagadPayload)
      .sort()
      .map((key) => `${key}=${nagadPayload[key]}`)
      .join(',');
    const signature = crypto
      .createHash('sha256')
      .update(keyString + NAGAD_MERCHANT_KEY)
      .digest('hex');

    return res.status(201).json({
      success: true,
      message: 'Checkout session created with Nagad',
      data: {
        payment_ref: paymentRefId,
        total_price: quote.total_price,
        currency: PAYMENT_CURRENCY,
        nagad_payload: {
          ...nagadPayload,
          signature,
        },
      },
    });
  } catch (error) {
    if (error instanceof ticketModel.TicketValidationError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment checkout session',
      error: error.message,
    });
  }
});

router.post('/payment/complete', verifyToken, async (req, res) => {
  try {
    const paymentRef = req.body?.payment_ref;
    if (!paymentRef) {
      return res.status(400).json({ success: false, message: 'payment_ref is required' });
    }

    const finalized = await finalizePaidSession({
      paymentRefId: paymentRef,
      enforceUserId: req.user.id,
    });

    return res.status(finalized.alreadyConfirmed ? 200 : 201).json({
      success: true,
      message: finalized.alreadyConfirmed ? 'Payment already confirmed' : 'Payment verified and ticket booked successfully',
      data: {
        ticket: finalized.ticket,
      },
    });
  } catch (error) {
    if (error instanceof ticketModel.TicketValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: `Payment received, but ticket creation failed: ${error.message}`,
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to complete payment',
      error: error.message,
    });
  }
});

router.post('/payment/nagad/callback', async (req, res) => {
  try {
    const { orderId, status, amount, issuerTxnID } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const nagadPayment = await nagadPaymentModel.getPaymentByRefId(orderId);
    if (!nagadPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (status === '1' || status === 'success') {
      // Payment successful
      await nagadPaymentModel.markPaymentCompleted(orderId, {
        issuerTxnID,
        amount,
        status: 'completed',
      });

      // Finalize the ticket booking
      try {
        const bookingPayload = nagadPayment.booking_payload;
        const ticket = await ticketModel.reserveTicket(bookingPayload);
        return res.json({
          success: true,
          message: 'Payment successful and ticket booked',
          data: { ticket_id: ticket.id },
        });
      } catch (error) {
        console.error('Ticket reservation error:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Payment successful but ticket creation failed: ' + error.message,
        });
      }
    } else {
      // Payment failed
      await nagadPaymentModel.markPaymentFailed(orderId, status);
      return res.status(402).json({
        success: false,
        message: `Payment failed: ${status}`,
      });
    }
  } catch (error) {
    console.error('Nagad callback error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Callback processing error',
      error: error.message,
    });
  }
});

// Nagad payment status check endpoint (optional, for polling)
router.get('/payment/status/:paymentRef', verifyToken, async (req, res) => {
  try {
    const { paymentRef } = req.params;
    const nagadPayment = await nagadPaymentModel.getPaymentByRefId(paymentRef);

    if (!nagadPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (nagadPayment.user_id !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.json({
      success: true,
      data: {
        payment_ref: nagadPayment.payment_ref_id,
        status: nagadPayment.status,
        amount: nagadPayment.amount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const payload = parseBookingPayload(req.body);
    ensureBookingPayload(payload);

    const user = await userModel.getUserByEmail(req.user.email);
    if (!user?.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: 'Verify your email before buying tickets',
        verificationRequired: true,
      });
    }

    const result = await ticketModel.reserveTicket({
      user_id: req.user.id,
      trip_id: payload.trip_id,
      boarding_stop_id: payload.boarding_stop_id,
      dropoff_stop_id: payload.dropoff_stop_id,
      seat_numbers: payload.seat_numbers,
      passenger_name: payload.passenger_name,
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Ticket booked successfully',
    });
  } catch (error) {
    if (error instanceof ticketModel.TicketValidationError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Error booking ticket', error: error.message });
  }
});

router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const result = await ticketModel.cancelTicket(req.params.id, req.user.id, req.user.role);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.json({ success: true, message: 'Ticket cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error cancelling ticket', error: error.message });
  }
});

// ========== MANUAL PAYMENT ENDPOINTS ==========

/**
 * Complete manual payment after user confirms they sent money
 * In real flow, admin would verify and call mark-verified
 */
router.post('/payment/manual/complete', verifyToken, async (req, res) => {
  try {
    const { payment_id } = req.body;
    if (!payment_id) {
      return res.status(400).json({ success: false, message: 'payment_id is required' });
    }

    const payment = await manualPaymentModel.getPaymentById(payment_id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (payment.status === 'verified') {
      // Admin already verified, create ticket now
      const bookingPayload = payment.booking_payload;
      const ticket = await ticketModel.reserveTicket(bookingPayload);
      await manualPaymentModel.markPaymentCompleted(payment_id);

      const savedTicket = await ticketModel.getTicketById(ticket.id);
      const builtTicket = buildTicketResponse(savedTicket);

      // Send confirmation email with ticket details
      try {
        await sendPaymentConfirmationEmail({
          email: req.user.email,
          name: req.user.name,
          ticket: builtTicket,
          amount: payment.amount,
          paymentId: payment_id,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError.message);
        // Don't fail the booking if email fails
      }

      return res.status(201).json({
        success: true,
        message: 'Payment verified and ticket created!',
        data: { ticket: builtTicket },
      });
    }

    if (payment.status === 'completed') {
      const tickets = await ticketModel.getTicketsByUserId(req.user.id);
      const latestTicket = tickets[0];
      return res.status(200).json({
        success: true,
        message: 'Ticket already created',
        data: { ticket: latestTicket ? buildTicketResponse(latestTicket) : null },
      });
    }

    return res.status(400).json({
      success: false,
      message: `Payment is ${payment.status}. Please wait for admin verification.`,
    });
  } catch (error) {
    if (error instanceof ticketModel.TicketValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: `Ticket creation failed: ${error.message}`,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to complete payment',
      error: error.message,
    });
  }
});

/**
 * Check payment status
 */
router.get('/payment/manual/:paymentId', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await manualPaymentModel.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const isExpired = new Date(payment.expires_at) < new Date();

    return res.json({
      success: true,
      data: {
        payment_id: payment.payment_id,
        status: isExpired ? 'expired' : payment.status,
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.created_at,
        verified_at: payment.verified_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admin endpoint: Get all pending manual payments
 */
router.get('/admin/payments/pending', verifyToken, async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.user.email);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const payments = await manualPaymentModel.getAllPendingPayments(100);
    return res.json({
      success: true,
      data: payments.map((p) => ({
        payment_id: p.payment_id,
        user_email: p.email,
        user_name: p.name,
        amount: p.amount,
        currency: p.currency,
        method: p.payment_method,
        status: p.status,
        created_at: p.created_at,
        expires_at: p.expires_at,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admin endpoint: Mark payment as verified
 */
router.post('/admin/payments/:paymentId/verify', verifyToken, async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.user.email);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { paymentId } = req.params;
    const { notes } = req.body;

    const payment = await manualPaymentModel.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const verified = await manualPaymentModel.verifyPayment(paymentId, user.id, notes || '');
    if (!verified) {
      return res.status(400).json({ success: false, message: 'Could not verify payment' });
    }

    return res.json({
      success: true,
      message: `Payment verified. User can now complete booking.`,
      data: { payment_id: paymentId },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admin endpoint: Reject payment
 */
router.post('/admin/payments/:paymentId/reject', verifyToken, async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.user.email);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await manualPaymentModel.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const rejected = await manualPaymentModel.rejectPayment(paymentId, user.id, reason || '');
    if (!rejected) {
      return res.status(400).json({ success: false, message: 'Could not reject payment' });
    }

    return res.json({
      success: true,
      message: 'Payment rejected',
      data: { payment_id: paymentId },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize payment models on startup
nagadPaymentModel.init().catch(console.error);
manualPaymentModel.init().catch(console.error);

module.exports = router;
