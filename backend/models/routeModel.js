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
    // Parse the coordinates JSON since it's stored as string in database
    if (rows[0]) {
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
    if (rows[0]) {
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

module.exports = {
  getAllRoutes,
  getRouteById,
  getRouteByName,
  addRoute,
};
