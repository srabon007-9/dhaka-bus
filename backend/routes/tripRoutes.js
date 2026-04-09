const express = require('express');
const tripModel = require('../models/tripModel');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

router.get('/', async (req, res) => {
  try {
    const routeId = req.query.routeId === undefined ? null : toPositiveInt(req.query.routeId);
    if (req.query.routeId !== undefined && !routeId) {
      return res.status(400).json({ success: false, message: 'routeId must be a positive integer' });
    }

    const trips = routeId
      ? await tripModel.getTripsByRouteId(routeId)
      : await tripModel.getAllTrips();

    return res.json({ success: true, data: trips, message: 'Trips fetched successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching trips', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tripId = toPositiveInt(req.params.id);
    if (!tripId) {
      return res.status(400).json({ success: false, message: 'Trip id must be a positive integer' });
    }

    const trip = await tripModel.getTripById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    return res.json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching trip', error: error.message });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const required = ['route_id', 'bus_id', 'departure_time', 'arrival_time', 'fare', 'total_seats'];
    const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');

    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    const result = await tripModel.createTrip(req.body);
    return res.status(201).json({ success: true, data: result, message: 'Trip created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating trip', error: error.message });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tripId = toPositiveInt(req.params.id);
    if (!tripId) {
      return res.status(400).json({ success: false, message: 'Trip id must be a positive integer' });
    }

    const existing = await tripModel.getTripById(tripId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const payload = {
      route_id: req.body.route_id ?? existing.route_id,
      bus_id: req.body.bus_id ?? existing.bus_id,
      departure_time: req.body.departure_time ?? existing.departure_time,
      arrival_time: req.body.arrival_time ?? existing.arrival_time,
      fare: req.body.fare ?? existing.fare,
      total_seats: req.body.total_seats ?? existing.total_seats,
      status: req.body.status ?? existing.status,
    };

    const result = await tripModel.updateTrip(tripId, payload);
    return res.json({ success: true, data: result, message: 'Trip updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating trip', error: error.message });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tripId = toPositiveInt(req.params.id);
    if (!tripId) {
      return res.status(400).json({ success: false, message: 'Trip id must be a positive integer' });
    }

    const result = await tripModel.deleteTrip(tripId);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    return res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting trip', error: error.message });
  }
});

module.exports = router;
