// Route Waypoint Model - Functions to get route waypoints from database

const pool = require('../config/database');

/**
 * Get all waypoints for a specific route, ordered by sequence
 * @param {number} routeId - The route ID
 * @returns {Promise<Array>} Array of waypoints with coordinates
 */
const getWaypointsByRouteId = async (routeId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude
       FROM route_waypoints
       WHERE route_id = ?
       ORDER BY stop_from_order ASC, stop_to_order ASC, waypoint_sequence ASC`,
      [routeId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching waypoints by route:', error);
    throw error;
  }
};

/**
 * Get waypoints for a specific segment (between two stops)
 * @param {number} routeId - The route ID
 * @param {number} fromStopOrder - Starting stop order
 * @param {number} toStopOrder - Ending stop order
 * @returns {Promise<Array>} Array of waypoints for this segment
 */
const getWaypointsBySegment = async (routeId, fromStopOrder, toStopOrder) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude
       FROM route_waypoints
       WHERE route_id = ? AND stop_from_order = ? AND stop_to_order = ?
       ORDER BY waypoint_sequence ASC`,
      [routeId, fromStopOrder, toStopOrder]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching waypoints by segment:', error);
    throw error;
  }
};

module.exports = {
  getWaypointsByRouteId,
  getWaypointsBySegment,
};
