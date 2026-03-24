const pool = require('../config/database');

const getTicketsByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT tk.*, tr.departure_time, tr.arrival_time, tr.fare, r.route_name, b.name AS bus_name
     FROM tickets tk
     JOIN trips tr ON tr.id = tk.trip_id
     JOIN routes r ON r.id = tr.route_id
     JOIN buses b ON b.id = tr.bus_id
     WHERE tk.user_id = ?
     ORDER BY tk.created_at DESC`,
    [userId]
  );
  return rows;
};

const getAllTickets = async () => {
  const [rows] = await pool.query(
    `SELECT tk.*, u.name AS user_name, u.email, tr.departure_time, tr.arrival_time, tr.fare, r.route_name, b.name AS bus_name
     FROM tickets tk
     JOIN users u ON u.id = tk.user_id
     JOIN trips tr ON tr.id = tk.trip_id
     JOIN routes r ON r.id = tr.route_id
     JOIN buses b ON b.id = tr.bus_id
     ORDER BY tk.created_at DESC`
  );
  return rows;
};

const getBookedSeatsByTripId = async (tripId) => {
  const [rows] = await pool.query("SELECT seat_numbers FROM tickets WHERE trip_id = ? AND status != 'cancelled'", [tripId]);
  const seats = [];
  rows.forEach((row) => {
    try {
      const parsed = JSON.parse(row.seat_numbers || '[]');
      seats.push(...parsed);
    } catch {
      // ignore bad seat payloads
    }
  });
  return seats;
};

const createTicket = async ({ user_id, trip_id, seat_numbers, passenger_name, total_price }) => {
  const [result] = await pool.query(
    `INSERT INTO tickets (user_id, trip_id, seat_numbers, passenger_name, total_price)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, trip_id, JSON.stringify(seat_numbers), passenger_name, total_price]
  );
  return result;
};

const cancelTicket = async (id, userId, role) => {
  if (role === 'admin') {
    const [result] = await pool.query("UPDATE tickets SET status = 'cancelled' WHERE id = ?", [id]);
    return result;
  }
  const [result] = await pool.query("UPDATE tickets SET status = 'cancelled' WHERE id = ? AND user_id = ?", [id, userId]);
  return result;
};

module.exports = {
  getTicketsByUserId,
  getAllTickets,
  getBookedSeatsByTripId,
  createTicket,
  cancelTicket,
};
