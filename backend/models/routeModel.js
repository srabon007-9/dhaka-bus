// Route Model - Functions to get route data from database

const pool = require('../config/database');

const attachCoordinates = async (route) => {
  if (!route) return null;

  const [waypoints] = await pool.query(
    `SELECT latitude, longitude
     FROM route_waypoints
     WHERE route_id = ?
     ORDER BY stop_from_order ASC, stop_to_order ASC, waypoint_sequence ASC`,
    [route.id]
  );

  const [stops] = await pool.query(
    `SELECT stop_name, latitude, longitude, stop_order
     FROM bus_stops
     WHERE route_id = ?
     ORDER BY stop_order ASC`,
    [route.id]
  );

  return {
    ...route,
    coordinates: (waypoints.length ? waypoints : stops).map((point) => [
      Number(point.latitude),
      Number(point.longitude),
    ]),
    stops,
  };
};

// Get all routes
// Routes define the path a bus takes (e.g., Gulshan -> Dhanmondi -> Motijheel)
const getAllRoutes = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM routes ORDER BY route_name ASC');
    return Promise.all(rows.map(attachCoordinates));
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
};

// Get a single route by ID
const getRouteById = async (routeId) => {
  try {
    const [rows] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
    return attachCoordinates(rows[0] || null);
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
    return attachCoordinates(rows[0] || null);
  } catch (error) {
    console.error('Error fetching route by name:', error);
    throw error;
  }
};

// Add a new route
const addRoute = async (routeData) => {
  try {
    const { route_name, start_point, end_point } = routeData;
    const [result] = await pool.query(
      'INSERT INTO routes (route_name, start_point, end_point) VALUES (?, ?, ?)',
      [route_name, start_point, end_point]
    );
    return result;
  } catch (error) {
    console.error('Error adding route:', error);
    throw error;
  }
};

const updateRoute = async (routeId, routeData) => {
  try {
    const { route_name, start_point, end_point } = routeData;
    const [result] = await pool.query(
      'UPDATE routes SET route_name = ?, start_point = ?, end_point = ? WHERE id = ?',
      [route_name, start_point, end_point, routeId]
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
