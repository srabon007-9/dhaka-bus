const express = require('express');
const ticketModel = require('../models/ticketModel');
const userModel = require('../models/userModel');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

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

router.post('/', verifyToken, async (req, res) => {
  try {
    const { trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers, passenger_name } = req.body;

    if (!trip_id || !boarding_stop_id || !dropoff_stop_id || !Array.isArray(seat_numbers) || !seat_numbers.length || !passenger_name) {
      return res.status(400).json({
        success: false,
        message: 'trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers (array), and passenger_name are required',
      });
    }

    if (seat_numbers.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'You can book at most 4 tickets at a time',
      });
    }

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
      trip_id,
      boarding_stop_id,
      dropoff_stop_id,
      seat_numbers,
      passenger_name,
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
