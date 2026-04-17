const pool = require('../config/database');

const bookedSeatsSubquery = `
  SELECT tk.trip_id, COUNT(*) AS count
  FROM ticket_seats ts
  JOIN tickets tk ON tk.id = ts.ticket_id
  WHERE tk.status != 'cancelled'
  GROUP BY tk.trip_id
`;

const getAllTrips = async () => {
  const [rows] = await pool.query(
    `SELECT 
       t.*,
       r.route_name,
       b.name AS bus_name,
       b.status AS bus_status,
       b.capacity AS bus_capacity,
       COALESCE(booked_count.count, 0) AS booked_seats
     FROM trips t
     JOIN routes r ON r.id = t.route_id
     JOIN buses b ON b.id = t.bus_id
     LEFT JOIN (${bookedSeatsSubquery}) booked_count ON booked_count.trip_id = t.id
     ORDER BY t.departure_time ASC`
  );
  return rows.map(row => ({
    ...row,
    booked_seats: row.booked_seats || 0,
    available_seats: Math.max(0, row.total_seats - (row.booked_seats || 0)),
    occupancy_percentage: row.total_seats > 0 ? Math.round(((row.booked_seats || 0) / row.total_seats) * 100) : 0
  }));
};

const getTripsByRouteId = async (routeId) => {
  const [rows] = await pool.query(
    `SELECT 
       t.*,
       r.route_name,
       b.name AS bus_name,
       b.status AS bus_status,
       b.capacity AS bus_capacity,
       COALESCE(booked_count.count, 0) AS booked_seats
     FROM trips t
     JOIN routes r ON r.id = t.route_id
     JOIN buses b ON b.id = t.bus_id
     LEFT JOIN (${bookedSeatsSubquery}) booked_count ON booked_count.trip_id = t.id
     WHERE t.route_id = ?
     ORDER BY t.departure_time ASC`,
    [routeId]
  );
  return rows.map(row => ({
    ...row,
    booked_seats: row.booked_seats || 0,
    available_seats: Math.max(0, row.total_seats - (row.booked_seats || 0)),
    occupancy_percentage: row.total_seats > 0 ? Math.round(((row.booked_seats || 0) / row.total_seats) * 100) : 0
  }));
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
