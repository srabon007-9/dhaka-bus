const pool = require('../config/database');
const { rethrowIfMissingTable } = require('./tableDependencyError');

const mapSeatRows = (rows) => rows.map((row) => ({
  id: Number(row.id),
  seat_number: Number(row.seat_number),
  passenger_name: row.passenger_name,
}));

const hydrateBookingRequest = async (runner, row) => {
  if (!row) return null;

  const [seatRows] = await runner.query(
    `SELECT id, seat_number, passenger_name
     FROM booking_request_seats
     WHERE booking_request_id = ?
     ORDER BY seat_number ASC`,
    [row.id]
  );

  const passengerDetails = mapSeatRows(seatRows);

  return {
    ...row,
    passenger_details: passengerDetails,
    seat_numbers: passengerDetails.map((seat) => seat.seat_number),
    passenger_name: passengerDetails[0]?.passenger_name || '',
  };
};

const createBookingRequest = async ({
  userId,
  tripId,
  boardingStopId,
  dropoffStopId,
  totalPrice,
  currency = 'bdt',
  passengerDetails,
}, connection = null) => {
  const runner = connection || pool;
  const normalizedPassengers = Array.isArray(passengerDetails) ? passengerDetails : [];

  if (!normalizedPassengers.length) {
    throw new Error('booking request requires at least one seat');
  }

  try {
    const [result] = await runner.query(
      `INSERT INTO booking_requests
         (user_id, trip_id, boarding_stop_id, dropoff_stop_id, total_price, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, tripId, boardingStopId, dropoffStopId, totalPrice, currency]
    );

    const rows = normalizedPassengers.map((seat) => [
      result.insertId,
      seat.seat_number,
      seat.passenger_name,
    ]);

    await runner.query(
      `INSERT INTO booking_request_seats
         (booking_request_id, seat_number, passenger_name)
       VALUES ?`,
      [rows]
    );

    return getBookingRequestById(result.insertId, connection);
  } catch (error) {
    rethrowIfMissingTable(error, 'booking_requests');
  }
};

const getBookingRequestById = async (bookingRequestId, connection = null) => {
  const runner = connection || pool;

  try {
    const [rows] = await runner.query(
      `SELECT *
       FROM booking_requests
       WHERE id = ?
       LIMIT 1`,
      [bookingRequestId]
    );

    return hydrateBookingRequest(runner, rows[0] || null);
  } catch (error) {
    rethrowIfMissingTable(error, 'booking_requests');
  }
};

const markBookingRequestFulfilled = async (bookingRequestId, ticketId, connection = null) => {
  const runner = connection || pool;

  try {
    const [result] = await runner.query(
      `UPDATE booking_requests
       SET status = 'fulfilled', ticket_id = ?
       WHERE id = ?`,
      [ticketId, bookingRequestId]
    );

    return result;
  } catch (error) {
    rethrowIfMissingTable(error, 'booking_requests');
  }
};

module.exports = {
  createBookingRequest,
  getBookingRequestById,
  markBookingRequestFulfilled,
};
