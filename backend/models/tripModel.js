const pool = require('../config/database');

const getAllTrips = async () => {
  const [rows] = await pool.query(
    `SELECT t.*, r.route_name, b.name AS bus_name, b.status AS bus_status, b.capacity AS bus_capacity
     FROM trips t
     JOIN routes r ON r.id = t.route_id
     JOIN buses b ON b.id = t.bus_id
     ORDER BY t.departure_time ASC`
  );
  return rows;
};

const getTripsByRouteId = async (routeId) => {
  const [rows] = await pool.query(
    `SELECT t.*, r.route_name, b.name AS bus_name, b.status AS bus_status, b.capacity AS bus_capacity
     FROM trips t
     JOIN routes r ON r.id = t.route_id
     JOIN buses b ON b.id = t.bus_id
     WHERE t.route_id = ?
     ORDER BY t.departure_time ASC`,
    [routeId]
  );
  return rows;
};

const getTripById = async (tripId) => {
  const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [tripId]);
  return rows[0] || null;
};

const createTrip = async ({ route_id, bus_id, departure_time, arrival_time, fare, total_seats }) => {
  const [result] = await pool.query(
    `INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, fare, total_seats)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [route_id, bus_id, departure_time, arrival_time, fare, total_seats]
  );
  return result;
};

const updateTrip = async (id, payload) => {
  const { route_id, bus_id, departure_time, arrival_time, fare, total_seats, status } = payload;
  const [result] = await pool.query(
    `UPDATE trips
     SET route_id = ?, bus_id = ?, departure_time = ?, arrival_time = ?, fare = ?, total_seats = ?, status = ?
     WHERE id = ?`,
    [route_id, bus_id, departure_time, arrival_time, fare, total_seats, status, id]
  );
  return result;
};

const deleteTrip = async (id) => {
  const [result] = await pool.query('DELETE FROM trips WHERE id = ?', [id]);
  return result;
};

module.exports = {
  getAllTrips,
  getTripsByRouteId,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
};
