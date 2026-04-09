// Location Routes - API endpoints for bus location operations
// Endpoints: GET /api/locations, GET /api/locations/:busId, POST /api/locations (update location)

const express = require('express');
const locationModel = require('../models/locationModel');

const router = express.Router();

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// GET /api/locations - Get all current bus locations
// Returns the latest location for each bus (used for map display)
router.get('/', async (req, res) => {
  try {
    const locations = await locationModel.getLatestLocations();
    res.json({
      success: true,
      data: locations,
      message: 'All locations fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message,
    });
  }
});

// GET /api/locations/latest/:busId - Get latest location for a specific bus
// Example: /api/locations/latest/1
router.get('/latest/:busId', async (req, res) => {
  try {
    const busId = toPositiveInt(req.params.busId);
    if (!busId) {
      return res.status(400).json({
        success: false,
        message: 'busId must be a positive integer',
      });
    }

    const location = await locationModel.getLatestLocationByBusId(
      busId
    );
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'No location found for this bus',
      });
    }
    res.json({
      success: true,
      data: location,
      message: 'Latest location fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message,
    });
  }
});

// GET /api/locations/history/:busId - Get location history for a bus
// Example: /api/locations/history/1?limit=20
router.get('/history/:busId', async (req, res) => {
  try {
    const busId = toPositiveInt(req.params.busId);
    if (!busId) {
      return res.status(400).json({
        success: false,
        message: 'busId must be a positive integer',
      });
    }

    const rawLimit = req.query.limit;
    const parsedLimit = rawLimit === undefined ? 50 : Number(rawLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'limit must be a positive integer',
      });
    }

    const limit = Math.min(parsedLimit, 500);
    const history = await locationModel.getLocationHistory(
      busId,
      limit
    );
    res.json({
      success: true,
      data: history,
      message: 'Location history fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching location history',
      error: error.message,
    });
  }
});

// POST /api/locations - Update bus location
// Body should contain: { bus_id, latitude, longitude }
// This endpoint receives GPS updates from buses
router.post('/', async (req, res) => {
  try {
    const result = await locationModel.updateLocation(req.body);
    const latest = await locationModel.getLatestLocationByBusId(req.body.bus_id);
    const io = req.app.get('io');
    if (io && latest) {
      io.emit('locations:update', latest);
    }
    res.status(201).json({
      success: true,
      data: latest || result,
      message: 'Location updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message,
    });
  }
});

module.exports = router;
