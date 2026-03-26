const pool = require('../config/database');

const getAllBuses = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, r.route_name, r.start_point, r.end_point
       FROM buses b
       JOIN routes r ON r.id = b.route_id
       ORDER BY b.id ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching buses:', error);
    throw error;
  }
};

const getBusById = async (busId) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, r.route_name, r.start_point, r.end_point
       FROM buses b
       JOIN routes r ON r.id = b.route_id
       WHERE b.id = ?`,
      [busId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching bus:', error);
    throw error;
  }
};

const getBusesByRouteId = async (routeId) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, r.route_name, r.start_point, r.end_point
       FROM buses b
       JOIN routes r ON r.id = b.route_id
       WHERE b.route_id = ?
       ORDER BY b.id ASC`,
      [routeId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching buses by route:', error);
    throw error;
  }
};

const getBusesByRoute = async (routeName) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, r.route_name, r.start_point, r.end_point
       FROM buses b
       JOIN routes r ON r.id = b.route_id
       WHERE r.route_name = ?
       ORDER BY b.id ASC`,
      [routeName]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching buses by route name:', error);
    throw error;
  }
};

const addBus = async (busData) => {
  try {
    const { name, route_id, capacity, status } = busData;
    const [result] = await pool.query(
      'INSERT INTO buses (name, route_id, capacity, status) VALUES (?, ?, ?, ?)',
      [name, route_id, capacity || 40, status || 'active']
    );
    return result;
  } catch (error) {
    console.error('Error adding bus:', error);
    throw error;
  }
};

const updateBus = async (busId, busData) => {
  try {
    const { name, route_id, capacity, status } = busData;
    const [result] = await pool.query(
      `UPDATE buses
       SET name = ?, route_id = ?, capacity = ?, status = ?
       WHERE id = ?`,
      [name, route_id, capacity, status, busId]
    );
    return result;
  } catch (error) {
    console.error('Error updating bus:', error);
    throw error;
  }
};

const deleteBus = async (busId) => {
  try {
    const [result] = await pool.query('DELETE FROM buses WHERE id = ?', [busId]);
    return result;
  } catch (error) {
    console.error('Error deleting bus:', error);
    throw error;
  }
};

module.exports = {
  getAllBuses,
  getBusById,
  getBusesByRouteId,
  getBusesByRoute,
  addBus,
  updateBus,
  deleteBus,
};
