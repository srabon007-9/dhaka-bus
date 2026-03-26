const pool = require('../config/database');

class TicketValidationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'TicketValidationError';
    this.statusCode = statusCode;
  }
}

const normalizeSeatNumbers = (seatNumbers) => {
  if (!Array.isArray(seatNumbers)) return [];

  return [...new Set(
    seatNumbers
      .map((seat) => Number(seat))
      .filter((seat) => Number.isInteger(seat) && seat > 0)
  )];
};

const parseSeatPayload = (value) => {
  if (Array.isArray(value)) return normalizeSeatNumbers(value);

  if (typeof value === 'string') {
    try {
      return normalizeSeatNumbers(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
};

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizePrice = (value) => Number(Number(value).toFixed(2));

const getSegmentMetadata = async (connection, tripId, boardingStopId, dropoffStopId, lockTrip = false) => {
  const [trips] = await connection.query(
    `SELECT id, route_id, fare, total_seats, status
     FROM trips
     WHERE id = ?${lockTrip ? ' FOR UPDATE' : ''}`,
    [tripId]
  );
  const trip = trips[0];

  if (!trip) {
    throw new TicketValidationError('Trip not found', 404);
  }

  const [stops] = await connection.query(
    `SELECT id, route_id, stop_name, stop_order
     FROM bus_stops
     WHERE id IN (?, ?)`,
    [boardingStopId, dropoffStopId]
  );

  const boardingStop = stops.find((stop) => stop.id === boardingStopId);
  const dropoffStop = stops.find((stop) => stop.id === dropoffStopId);

  if (!boardingStop || !dropoffStop) {
    throw new TicketValidationError('Please select valid boarding and destination stops', 400);
  }

  if (boardingStop.route_id !== trip.route_id || dropoffStop.route_id !== trip.route_id) {
    throw new TicketValidationError('Selected stops do not belong to this trip route', 400);
  }

  if (boardingStop.stop_order >= dropoffStop.stop_order) {
    throw new TicketValidationError('Destination must come after boarding stop', 400);
  }

  const [bounds] = await connection.query(
    `SELECT MIN(stop_order) AS min_order, MAX(stop_order) AS max_order
     FROM bus_stops
     WHERE route_id = ?`,
    [trip.route_id]
  );

  const minOrder = Number(bounds[0]?.min_order);
  const maxOrder = Number(bounds[0]?.max_order);
  const totalSegments = Math.max(1, maxOrder - minOrder);
  const segmentLength = dropoffStop.stop_order - boardingStop.stop_order;

  return {
    trip,
    boardingStop,
    dropoffStop,
    totalSegments,
    segmentLength,
  };
};

const getConflictingSeats = (rows, boardingOrder, dropoffOrder) => rows.flatMap((row) => {
  if (row.boarding_order >= dropoffOrder || row.dropoff_order <= boardingOrder) {
    return [];
  }

  return parseSeatPayload(row.seat_numbers);
});

const getTicketsByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT tk.*, tr.departure_time, tr.arrival_time, tr.fare, r.route_name, b.name AS bus_name,
            board.stop_name AS boarding_stop_name, board.stop_order AS boarding_stop_order,
            dropoff.stop_name AS dropoff_stop_name, dropoff.stop_order AS dropoff_stop_order
     FROM tickets tk
     JOIN trips tr ON tr.id = tk.trip_id
     JOIN routes r ON r.id = tr.route_id
     JOIN buses b ON b.id = tr.bus_id
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     WHERE tk.user_id = ?
     ORDER BY tk.created_at DESC`,
    [userId]
  );
  return rows;
};

const getAllTickets = async () => {
  const [rows] = await pool.query(
    `SELECT tk.*, u.name AS user_name, u.email, tr.departure_time, tr.arrival_time, tr.fare, r.route_name, b.name AS bus_name,
            board.stop_name AS boarding_stop_name, board.stop_order AS boarding_stop_order,
            dropoff.stop_name AS dropoff_stop_name, dropoff.stop_order AS dropoff_stop_order
     FROM tickets tk
     JOIN users u ON u.id = tk.user_id
     JOIN trips tr ON tr.id = tk.trip_id
     JOIN routes r ON r.id = tr.route_id
     JOIN buses b ON b.id = tr.bus_id
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     ORDER BY tk.created_at DESC`
  );
  return rows;
};

const getBookedSeatsByTripId = async (tripId, boardingStopId, dropoffStopId) => {
  const normalizedBoardingStopId = toPositiveInt(boardingStopId);
  const normalizedDropoffStopId = toPositiveInt(dropoffStopId);

  if (!normalizedBoardingStopId || !normalizedDropoffStopId) {
    const [rows] = await pool.query(
      "SELECT seat_numbers FROM tickets WHERE trip_id = ? AND status != 'cancelled'",
      [tripId]
    );
    return rows.flatMap((row) => {
      return parseSeatPayload(row.seat_numbers);
    });
  }

  const metadata = await getSegmentMetadata(pool, tripId, normalizedBoardingStopId, normalizedDropoffStopId);
  const [rows] = await pool.query(
    `SELECT tk.seat_numbers, board.stop_order AS boarding_order, dropoff.stop_order AS dropoff_order
     FROM tickets tk
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     WHERE tk.trip_id = ? AND tk.status != 'cancelled'`,
    [tripId]
  );

  return [...new Set(
    getConflictingSeats(rows, metadata.boardingStop.stop_order, metadata.dropoffStop.stop_order)
  )];
};

const getBookingQuote = async ({ trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers }) => {
  const normalizedSeats = normalizeSeatNumbers(seat_numbers);
  if (!normalizedSeats.length) {
    throw new TicketValidationError('At least one valid seat number is required', 400);
  }

  const normalizedBoardingStopId = toPositiveInt(boarding_stop_id);
  const normalizedDropoffStopId = toPositiveInt(dropoff_stop_id);
  if (!normalizedBoardingStopId || !normalizedDropoffStopId) {
    throw new TicketValidationError('boarding_stop_id and dropoff_stop_id are required', 400);
  }

  const metadata = await getSegmentMetadata(pool, trip_id, normalizedBoardingStopId, normalizedDropoffStopId);
  const { trip, boardingStop, dropoffStop, totalSegments, segmentLength } = metadata;

  if (trip.status === 'cancelled' || trip.status === 'completed') {
    throw new TicketValidationError('This trip is not available for booking', 409);
  }

  const outOfRangeSeat = normalizedSeats.find((seat) => seat > Number(trip.total_seats));
  if (outOfRangeSeat) {
    throw new TicketValidationError(`Seat ${outOfRangeSeat} is not available on this trip`, 400);
  }

  const [rows] = await pool.query(
    `SELECT tk.seat_numbers, board.stop_order AS boarding_order, dropoff.stop_order AS dropoff_order
     FROM tickets tk
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     WHERE tk.trip_id = ? AND tk.status != 'cancelled'`,
    [trip_id]
  );

  const bookedSeats = getConflictingSeats(rows, boardingStop.stop_order, dropoffStop.stop_order);
  const conflict = normalizedSeats.find((seat) => bookedSeats.includes(seat));
  if (conflict) {
    throw new TicketValidationError(`Seat ${conflict} is already booked`, 409);
  }

  const segmentFare = normalizePrice((Number(trip.fare) * segmentLength) / totalSegments);
  const totalPrice = normalizePrice(segmentFare * normalizedSeats.length);

  return {
    trip,
    boarding_stop_id: normalizedBoardingStopId,
    dropoff_stop_id: normalizedDropoffStopId,
    seat_numbers: normalizedSeats,
    segment_fare: segmentFare,
    total_price: totalPrice,
    boarding_stop_name: boardingStop.stop_name,
    dropoff_stop_name: dropoffStop.stop_name,
  };
};

const reserveTicket = async ({ user_id, trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers, passenger_name }) => {
  const normalizedSeats = normalizeSeatNumbers(seat_numbers);
  if (!normalizedSeats.length) {
    throw new TicketValidationError('At least one valid seat number is required', 400);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const normalizedBoardingStopId = toPositiveInt(boarding_stop_id);
    const normalizedDropoffStopId = toPositiveInt(dropoff_stop_id);
    if (!normalizedBoardingStopId || !normalizedDropoffStopId) {
      throw new TicketValidationError('boarding_stop_id and dropoff_stop_id are required', 400);
    }

    const metadata = await getSegmentMetadata(
      connection,
      trip_id,
      normalizedBoardingStopId,
      normalizedDropoffStopId,
      true
    );
    const { trip, boardingStop, dropoffStop, totalSegments, segmentLength } = metadata;

    if (trip.status === 'cancelled' || trip.status === 'completed') {
      throw new TicketValidationError('This trip is not available for booking', 409);
    }

    const outOfRangeSeat = normalizedSeats.find((seat) => seat > Number(trip.total_seats));
    if (outOfRangeSeat) {
      throw new TicketValidationError(`Seat ${outOfRangeSeat} is not available on this trip`, 400);
    }

    const [rows] = await connection.query(
      `SELECT tk.seat_numbers, board.stop_order AS boarding_order, dropoff.stop_order AS dropoff_order
       FROM tickets tk
       JOIN bus_stops board ON board.id = tk.boarding_stop_id
       JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
       WHERE tk.trip_id = ? AND tk.status != 'cancelled'
       FOR UPDATE`,
      [trip_id]
    );

    const bookedSeats = getConflictingSeats(rows, boardingStop.stop_order, dropoffStop.stop_order);

    const conflict = normalizedSeats.find((seat) => bookedSeats.includes(seat));
    if (conflict) {
      throw new TicketValidationError(`Seat ${conflict} is already booked`, 409);
    }

    const segmentFare = normalizePrice((Number(trip.fare) * segmentLength) / totalSegments);
    const total_price = normalizePrice(segmentFare * normalizedSeats.length);
    const [result] = await connection.query(
      `INSERT INTO tickets (user_id, trip_id, boarding_stop_id, dropoff_stop_id, seat_numbers, passenger_name, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        trip_id,
        normalizedBoardingStopId,
        normalizedDropoffStopId,
        JSON.stringify(normalizedSeats),
        passenger_name,
        total_price,
      ]
    );

    await connection.commit();
    return {
      id: result.insertId,
      total_price,
      segment_fare: segmentFare,
      seat_numbers: normalizedSeats,
      boarding_stop_name: boardingStop.stop_name,
      dropoff_stop_name: dropoffStop.stop_name,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const cancelTicket = async (id, userId, role) => {
  if (role === 'admin') {
    const [result] = await pool.query("UPDATE tickets SET status = 'cancelled' WHERE id = ?", [id]);
    return result;
  }
  const [result] = await pool.query("UPDATE tickets SET status = 'cancelled' WHERE id = ? AND user_id = ?", [id, userId]);
  return result;
};

const getTicketById = async (id) => {
  const [rows] = await pool.query(
    `SELECT tk.*, tr.departure_time, tr.arrival_time, tr.fare, r.route_name, b.name AS bus_name,
            board.stop_name AS boarding_stop_name, board.stop_order AS boarding_stop_order,
            dropoff.stop_name AS dropoff_stop_name, dropoff.stop_order AS dropoff_stop_order
     FROM tickets tk
     JOIN trips tr ON tr.id = tk.trip_id
     JOIN routes r ON r.id = tr.route_id
     JOIN buses b ON b.id = tr.bus_id
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     WHERE tk.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

module.exports = {
  TicketValidationError,
  getTicketsByUserId,
  getAllTickets,
  getBookedSeatsByTripId,
  getBookingQuote,
  reserveTicket,
  cancelTicket,
  getTicketById,
};
