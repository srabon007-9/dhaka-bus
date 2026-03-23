// Bus Routes - API endpoints for bus operations
// Endpoints: GET /api/buses, GET /api/buses/:id, GET /api/buses/route/:name, POST /api/buses

const express = require('express');
const busModel = require('../models/busModel');

const router = express.Router();

// GET /api/buses - Get all buses
// Returns a JSON array of all buses in the system
router.get('/', async (req, res) => {
  try {
    const buses = await busModel.getAllBuses();
    res.json({
      success: true,
      data: buses,
      message: 'All buses fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching buses',
      error: error.message,
    });
  }
});

// GET /api/buses/:id - Get a specific bus by ID
// Example: /api/buses/5
router.get('/:id', async (req, res) => {
  try {
    const bus = await busModel.getBusById(req.params.id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }
    res.json({
      success: true,
      data: bus,
      message: 'Bus fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bus',
      error: error.message,
    });
  }
});

// GET /api/buses/route/:name - Get buses by route name
// Example: /api/buses/route/Gulshan%20to%20Motijheel
router.get('/route/:name', async (req, res) => {
  try {
    const buses = await busModel.getBusesByRoute(req.params.name);
    res.json({
      success: true,
      data: buses,
      message: 'Buses for route fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching buses for route',
      error: error.message,
    });
  }
});

// POST /api/buses - Add a new bus
// Body should contain: { name, route_name, start_point, end_point }
router.post('/', async (req, res) => {
  try {
    const result = await busModel.addBus(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Bus added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding bus',
      error: error.message,
    });
  }
});

module.exports = router;
