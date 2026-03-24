// Bus Stop Model - Functions to get bus stops data from database

const pool = require('../config/database');

/**
 * Get all stops for a specific route, ordered by stop_order
 * @param {number} routeId - The route ID
 * @returns {Promise<Array>} Array of stops with coordinates
 */
const getStopsByRouteId = async (routeId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_name, latitude, longitude, stop_order
       FROM bus_stops
       WHERE route_id = ?
       ORDER BY stop_order ASC`,
      [routeId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching stops by route:', error);
    throw error;
  }
};

/**
 * Get a specific stop by ID
 * @param {number} stopId - The stop ID
 * @returns {Promise<Object>} Stop record with coordinates
 */
const getStopById = async (stopId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_name, latitude, longitude, stop_order
       FROM bus_stops
       WHERE id = ?`,
      [stopId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching stop:', error);
    throw error;
  }
};

/**
 * Get the next stop in sequence for a route
 * @param {number} routeId - The route ID
 * @param {number} currentStopOrder - Current stop order number
 * @returns {Promise<Object>} Next stop record or null if at end of route
 */
const getNextStop = async (routeId, currentStopOrder) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_name, latitude, longitude, stop_order
       FROM bus_stops
       WHERE route_id = ? AND stop_order > ?
       ORDER BY stop_order ASC
       LIMIT 1`,
      [routeId, currentStopOrder]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching next stop:', error);
    throw error;
  }
};

/**
 * Get the first stop of a route (starting point)
 * @param {number} routeId - The route ID
 * @returns {Promise<Object>} First stop record
 */
const getFirstStop = async (routeId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_name, latitude, longitude, stop_order
       FROM bus_stops
       WHERE route_id = ?
       ORDER BY stop_order ASC
       LIMIT 1`,
      [routeId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching first stop:', error);
    throw error;
  }
};

/**
 * Get total number of stops on a route
 * @param {number} routeId - The route ID
 * @returns {Promise<number>} Total stop count
 */
const getStopCount = async (routeId) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM bus_stops WHERE route_id = ?`,
      [routeId]
    );
    return rows[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching stop count:', error);
    throw error;
  }
};

module.exports = {
  getStopsByRouteId,
  getStopById,
  getNextStop,
  getFirstStop,
  getStopCount,
};
