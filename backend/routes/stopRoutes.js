// Stop Routes - API endpoints for bus stops
// GET /api/stops - Get all stops (with filter by route)
// GET /api/stops/:stopId - Get specific stop

const express = require('express');
const busStopModel = require('../models/busStopModel');

const router = express.Router();

/**
 * GET /api/stops/:routeId
 * Get all stops for a specific route, ordered by stop_order
 */
router.get('/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!routeId || isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID',
      });
    }

    const stops = await busStopModel.getStopsByRouteId(parseInt(routeId));

    if (!stops || stops.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No stops found for route ${routeId}`,
      });
    }

    res.json({
      success: true,
      data: stops,
      count: stops.length,
    });
  } catch (error) {
    console.error('Error fetching stops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stops',
      error: error.message,
    });
  }
});

/**
 * GET /api/stops/stop/:stopId
 * Get a specific stop by ID
 */
router.get('/stop/:stopId', async (req, res) => {
  try {
    const { stopId } = req.params;

    if (!stopId || isNaN(stopId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stop ID',
      });
    }

    const stop = await busStopModel.getStopById(parseInt(stopId));

    if (!stop) {
      return res.status(404).json({
        success: false,
        message: `Stop ${stopId} not found`,
      });
    }

    res.json({
      success: true,
      data: stop,
    });
  } catch (error) {
    console.error('Error fetching stop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stop',
      error: error.message,
    });
  }
});

module.exports = router;
