// Route Routes - API endpoints for route operations
// Endpoints: GET /api/routes, GET /api/routes/:id, GET /api/routes/by-name/:name, POST /api/routes

const express = require('express');
const routeModel = require('../models/routeModel');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/routes - Get all routes
// Returns all bus routes with their coordinates for drawing on map
router.get('/', async (req, res) => {
  try {
    const routes = await routeModel.getAllRoutes();
    // Parse coordinates safely (can come as JSON string or native object)
    const parsedRoutes = routes.map((route) => ({
      ...route,
      coordinates:
        typeof route.coordinates === 'string'
          ? JSON.parse(route.coordinates)
          : route.coordinates,
    }));
    res.json({
      success: true,
      data: parsedRoutes,
      message: 'All routes fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching routes',
      error: error.message,
    });
  }
});

// GET /api/routes/by-name/:name - Get route by name
// Example: /api/routes/by-name/Gulshan%20to%20Motijheel
router.get('/by-name/:name', async (req, res) => {
  try {
    const route = await routeModel.getRouteByName(req.params.name);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }
    res.json({
      success: true,
      data: route,
      message: 'Route fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
    });
  }
});

// GET /api/routes/:id - Get a specific route by ID
// Example: /api/routes/2
router.get('/:id', async (req, res) => {
  try {
    const route = await routeModel.getRouteById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }
    res.json({
      success: true,
      data: route,
      message: 'Route fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
    });
  }
});

// POST /api/routes - Add a new route (admin only)
// Body should contain: { route_name, coordinates: [[lat, lng], [lat, lng], ...] }
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await routeModel.addRoute(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Route added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding route',
      error: error.message,
    });
  }
});

// PUT /api/routes/:id - Update a route (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const existing = await routeModel.getRouteById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const payload = {
      route_name: req.body.route_name ?? existing.route_name,
      coordinates: req.body.coordinates ?? existing.coordinates,
    };

    const result = await routeModel.updateRoute(req.params.id, payload);
    res.json({ success: true, data: result, message: 'Route updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating route', error: error.message });
  }
});

// DELETE /api/routes/:id - Delete route (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await routeModel.deleteRoute(req.params.id);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting route', error: error.message });
  }
});

module.exports = router;
