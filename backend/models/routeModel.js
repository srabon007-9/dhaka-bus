// Route Model - Functions to get route data from database

const pool = require('../config/database');

// Get all routes
// Routes define the path a bus takes (e.g., Gulshan -> Dhanmondi -> Motijheel)
const getAllRoutes = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM routes');
    return rows;
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
};

// Get a single route by ID
const getRouteById = async (routeId) => {
  try {
    const [rows] = await pool.query('SELECT * FROM routes WHERE id = ?', [
      routeId,
    ]);
    // Parse coordinates safely (string or already parsed JSON)
    if (rows[0] && typeof rows[0].coordinates === 'string') {
      rows[0].coordinates = JSON.parse(rows[0].coordinates);
    }
    return rows[0];
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
};

// Get route by name
const getRouteByName = async (routeName) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM routes WHERE route_name = ?',
      [routeName]
    );
    if (rows[0] && typeof rows[0].coordinates === 'string') {
      rows[0].coordinates = JSON.parse(rows[0].coordinates);
    }
    return rows[0];
  } catch (error) {
    console.error('Error fetching route by name:', error);
    throw error;
  }
};

// Add a new route
const addRoute = async (routeData) => {
  try {
    const { route_name, coordinates } = routeData;
    const [result] = await pool.query(
      'INSERT INTO routes (route_name, coordinates) VALUES (?, ?)',
      [route_name, JSON.stringify(coordinates)]
    );
    return result;
  } catch (error) {
    console.error('Error adding route:', error);
    throw error;
  }
};

const updateRoute = async (routeId, routeData) => {
  try {
    const { route_name, coordinates } = routeData;
    const [result] = await pool.query(
      'UPDATE routes SET route_name = ?, coordinates = ? WHERE id = ?',
      [route_name, JSON.stringify(coordinates), routeId]
    );
    return result;
  } catch (error) {
    console.error('Error updating route:', error);
    throw error;
  }
};

const deleteRoute = async (routeId) => {
  try {
    const [result] = await pool.query('DELETE FROM routes WHERE id = ?', [routeId]);
    return result;
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  getRouteByName,
  addRoute,
  updateRoute,
  deleteRoute,
};
