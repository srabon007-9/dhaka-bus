// Bus Model - Functions to get/add bus data from database

const pool = require('../config/database');

// Get all buses
// This queries the 'buses' table and returns all buses
const getAllBuses = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM buses');
    return rows;
  } catch (error) {
    console.error('Error fetching buses:', error);
    throw error;
  }
};

// Get a single bus by ID
const getBusById = async (busId) => {
  try {
    const [rows] = await pool.query('SELECT * FROM buses WHERE id = ?', [busId]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching bus:', error);
    throw error;
  }
};

// Get buses by route ID
// Useful for finding all buses on a specific route
const getBusesByRouteId = async (routeId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM buses WHERE route_id = ?',
      [routeId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching buses by route:', error);
    throw error;
  }
};

// Add a new bus (for testing/admin purposes)
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
  addBus,
  updateBus,
  deleteBus,
};
