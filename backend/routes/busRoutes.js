// Bus Routes - API endpoints for bus operations
// Endpoints: GET /api/buses, GET /api/buses/:id, GET /api/buses/route/:name, POST /api/buses

const express = require('express');
const busModel = require('../models/busModel');
const { verifyToken, requireAdmin } = require('../middleware/auth');

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

// POST /api/buses - Add a new bus
// Body should contain: { name, route_name, start_point, end_point }
router.post('/', verifyToken, requireAdmin, async (req, res) => {
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

// PUT /api/buses/:id - Update bus
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const existing = await busModel.getBusById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const payload = {
      name: req.body.name ?? existing.name,
      route_name: req.body.route_name ?? existing.route_name,
      start_point: req.body.start_point ?? existing.start_point,
      end_point: req.body.end_point ?? existing.end_point,
    };

    const result = await busModel.updateBus(req.params.id, payload);
    res.json({ success: true, data: result, message: 'Bus updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating bus', error: error.message });
  }
});

// DELETE /api/buses/:id - Delete bus
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await busModel.deleteBus(req.params.id);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting bus', error: error.message });
  }
});

module.exports = router;
