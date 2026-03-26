const express = require('express');
const Stripe = require('stripe');
const ticketModel = require('../models/ticketModel');
const paymentSessionModel = require('../models/paymentSessionModel');
const userModel = require('../models/userModel');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const PAYMENT_CURRENCY = (process.env.STRIPE_CURRENCY || 'bdt').toLowerCase();
const PAYMENT_SUCCESS_URL = process.env.PAYMENT_SUCCESS_URL
  || `${process.env.FRONTEND_URL || 'http://localhost'}/booking?payment=success&session_id={CHECKOUT_SESSION_ID}`;
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

const finalizePaidSession = async ({ sessionId, enforceUserId }) => {
  if (!stripe) {
    const error = new Error('Payment gateway is not configured on the server');
    error.statusCode = 503;
    throw error;
  }

  const paymentSession = await paymentSessionModel.getSessionById(sessionId);
  if (!paymentSession) {
    const error = new Error('Payment session not found');
    error.statusCode = 404;
    throw error;
  }

  if (enforceUserId && Number(paymentSession.user_id) !== Number(enforceUserId)) {
    const error = new Error('You are not allowed to complete this payment session');
    error.statusCode = 403;
    throw error;
  }

  if (paymentSession.status === 'completed' && paymentSession.ticket_id) {
    const existingTicket = await ticketModel.getTicketById(paymentSession.ticket_id);
    return {
      alreadyConfirmed: true,
      ticket: existingTicket ? buildTicketResponse(existingTicket) : { id: paymentSession.ticket_id },
    };
  }

  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (stripeSession.payment_status !== 'paid') {
    const error = new Error('Payment is not completed yet');
    error.statusCode = 402;
    throw error;
  }

  const expectedAmount = Math.round(Number(paymentSession.amount_expected) * 100);
  if (stripeSession.amount_total !== null && Number.isFinite(expectedAmount) && stripeSession.amount_total !== expectedAmount) {
    const error = new Error('Paid amount does not match expected booking amount');
    error.statusCode = 409;
    throw error;
  }

  if ((stripeSession.currency || '').toLowerCase() !== (paymentSession.currency || '').toLowerCase()) {
    const error = new Error('Paid currency does not match expected booking currency');
    error.statusCode = 409;
    throw error;
  }

  const bookingPayload = parseStoredBookingPayload(paymentSession.booking_payload);
  if (!bookingPayload) {
    const error = new Error('Stored booking payload is invalid');
    error.statusCode = 500;
    throw error;
  }

  const ticket = await ticketModel.reserveTicket(bookingPayload);
  await paymentSessionModel.markSessionCompleted(sessionId, ticket.id);

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
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured on the server',
      });
    }

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
    const amountInMinor = Math.max(1, Math.round(Number(quote.total_price) * 100));

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      success_url: PAYMENT_SUCCESS_URL,
      cancel_url: PAYMENT_CANCEL_URL,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PAYMENT_CURRENCY,
            unit_amount: amountInMinor,
            product_data: {
              name: `Bus Ticket: ${quote.boarding_stop_name} -> ${quote.dropoff_stop_name}`,
              description: `${quote.seat_numbers.length} seat(s) on trip #${payload.trip_id}`,
            },
          },
        },
      ],
      metadata: {
        user_id: String(req.user.id),
        trip_id: String(payload.trip_id),
        seat_count: String(quote.seat_numbers.length),
      },
    });

    await paymentSessionModel.createPendingSession({
      sessionId: checkoutSession.id,
      userId: req.user.id,
      bookingPayload: {
        user_id: req.user.id,
        trip_id: payload.trip_id,
        boarding_stop_id: payload.boarding_stop_id,
        dropoff_stop_id: payload.dropoff_stop_id,
        seat_numbers: quote.seat_numbers,
        passenger_name: payload.passenger_name,
      },
      amountExpected: quote.total_price,
      currency: PAYMENT_CURRENCY,
    });

    return res.status(201).json({
      success: true,
      message: 'Checkout session created',
      data: {
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        total_price: quote.total_price,
        currency: PAYMENT_CURRENCY,
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
    const sessionId = req.body?.session_id;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    const finalized = await finalizePaidSession({
      sessionId,
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

router.post('/payment/webhook', async (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ success: false, message: 'Stripe webhook is not configured' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || !req.rawBody) {
      return res.status(400).json({ success: false, message: 'Missing Stripe signature or raw body' });
    }

    const event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const stripeSession = event.data.object;
      try {
        await finalizePaidSession({ sessionId: stripeSession.id });
      } catch (error) {
        console.error('Webhook payment finalize error:', error.message);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
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

module.exports = router;
