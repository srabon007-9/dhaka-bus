const express = require('express');
const ticketModel = require('../models/ticketModel');
const tripModel = require('../models/tripModel');
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
    const seats = await ticketModel.getBookedSeatsByTripId(req.params.tripId);
    return res.json({ success: true, data: seats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching booked seats', error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { trip_id, seat_numbers, passenger_name } = req.body;

    if (!trip_id || !Array.isArray(seat_numbers) || !seat_numbers.length || !passenger_name) {
      return res.status(400).json({
        success: false,
        message: 'trip_id, seat_numbers (array), and passenger_name are required',
      });
    }

    const trip = await tripModel.getTripById(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const booked = await ticketModel.getBookedSeatsByTripId(trip_id);
    const conflict = seat_numbers.find((seat) => booked.includes(seat));
    if (conflict) {
      return res.status(409).json({ success: false, message: `Seat ${conflict} is already booked` });
    }

    const total_price = Number(trip.fare) * seat_numbers.length;

    const result = await ticketModel.createTicket({
      user_id: req.user.id,
      trip_id,
      seat_numbers,
      passenger_name,
      total_price,
    });

    return res.status(201).json({
      success: true,
      data: { id: result.insertId, total_price },
      message: 'Ticket booked successfully',
    });
  } catch (error) {
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
