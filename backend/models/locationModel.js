// Location Model - Functions to get/update bus location data

const pool = require('../config/database');

// Get all current locations for all buses
const getAllLocations = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM locations');
    return rows;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

// Get latest location for every bus
const getLatestLocations = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*
       FROM locations l
       INNER JOIN (
         SELECT bus_id, MAX(id) AS latest_id
         FROM locations
         GROUP BY bus_id
       ) latest ON latest.latest_id = l.id
       ORDER BY l.bus_id ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching latest locations:', error);
    throw error;
  }
};

// Get latest location for a specific bus
// This is used to show the current position of a bus on the map
const getLatestLocationByBusId = async (busId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 1',
      [busId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
};

// Get location history for a bus
// Useful to see the path a bus took during a time period
const getLocationHistory = async (busId, limit = 50) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT ?',
      [busId, limit]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching location history:', error);
    throw error;
  }
};

// Update/add bus location
// This is called by GPS tracking or simulated updates
const updateLocation = async (locationData) => {
  try {
    const { bus_id, latitude, longitude, speed_kmh } = locationData;
    const [result] = await pool.query(
      'INSERT INTO locations (bus_id, latitude, longitude, speed_kmh, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [bus_id, latitude, longitude, Number.isFinite(Number(speed_kmh)) ? Number(speed_kmh) : 0]
    );
    return result;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

module.exports = {
  getAllLocations,
  getLatestLocations,
  getLatestLocationByBusId,
  getLocationHistory,
  updateLocation,
};
