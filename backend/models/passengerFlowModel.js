const pool = require('../config/database');

class PassengerFlowValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'PassengerFlowValidationError';
    this.statusCode = statusCode;
  }
}

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSeatNumbers = (seatNumbers) => {
  if (!Array.isArray(seatNumbers)) return [];

  return [...new Set(
    seatNumbers
      .map((seat) => toPositiveInt(seat))
      .filter(Boolean)
  )];
};

const getTicketEventContext = async (connection, ticketId, lock = false) => {
  const [rows] = await connection.query(
    `SELECT tk.id AS ticket_id, tk.user_id, tk.trip_id, tk.status,
            tk.boarding_stop_id, tk.dropoff_stop_id,
            board.stop_order AS boarding_stop_order,
            dropoff.stop_order AS dropoff_stop_order
     FROM tickets tk
     JOIN bus_stops board ON board.id = tk.boarding_stop_id
     JOIN bus_stops dropoff ON dropoff.id = tk.dropoff_stop_id
     WHERE tk.id = ?
     LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [ticketId]
  );

  if (!rows[0]) {
    throw new PassengerFlowValidationError('Ticket not found', 404);
  }

  if (rows[0].status !== 'active') {
    throw new PassengerFlowValidationError('Only active tickets can record passenger events', 409);
  }

  return rows[0];
};

const getSeatPassengers = async (connection, ticketId, normalizedSeats) => {
  const [seatRows] = await connection.query(
    `SELECT seat_number, passenger_name
     FROM ticket_seats
     WHERE ticket_id = ?
     ORDER BY seat_number ASC`,
    [ticketId]
  );

  if (!seatRows.length) {
    throw new PassengerFlowValidationError('No seat-level passenger data found for this ticket', 409);
  }

  const seatMap = new Map();
  seatRows.forEach((row) => {
    seatMap.set(Number(row.seat_number), row.passenger_name);
  });

  const seatsToUse = normalizedSeats.length ? normalizedSeats : seatRows.map((row) => Number(row.seat_number));
  const invalidSeat = seatsToUse.find((seat) => !seatMap.has(seat));
  if (invalidSeat) {
    throw new PassengerFlowValidationError(`Seat ${invalidSeat} does not belong to this ticket`, 400);
  }

  return seatsToUse.map((seat) => ({
    seat_number: seat,
    passenger_name: seatMap.get(seat),
  }));
};

const validateStopForEvent = async (connection, tripId, stopId, context, eventType) => {
  const [stopRows] = await connection.query(
    `SELECT id, route_id, stop_order, stop_name
     FROM bus_stops
     WHERE id = ?
     LIMIT 1`,
    [stopId]
  );

  if (!stopRows[0]) {
    throw new PassengerFlowValidationError('Stop not found', 404);
  }

  const [tripRows] = await connection.query(
    `SELECT route_id FROM trips WHERE id = ? LIMIT 1`,
    [tripId]
  );

  if (!tripRows[0]) {
    throw new PassengerFlowValidationError('Trip not found', 404);
  }

  const stop = stopRows[0];
  if (Number(stop.route_id) !== Number(tripRows[0].route_id)) {
    throw new PassengerFlowValidationError('Stop does not belong to this trip route', 400);
  }

  const stopOrder = Number(stop.stop_order);
  const boardingOrder = Number(context.boarding_stop_order);
  const dropoffOrder = Number(context.dropoff_stop_order);

  if (eventType === 'board' && (stopOrder < boardingOrder || stopOrder >= dropoffOrder)) {
    throw new PassengerFlowValidationError('Boarding must happen between ticket boarding and dropoff stops', 400);
  }

  if (eventType === 'alight' && (stopOrder <= boardingOrder || stopOrder > dropoffOrder)) {
    throw new PassengerFlowValidationError('Alighting must happen after boarding stop and up to dropoff stop', 400);
  }

  return stop;
};

const getLatestSeatEventMap = async (connection, ticketId, seatNumbers) => {
  const [latestRows] = await connection.query(
    `SELECT seat_number, event_type
     FROM passenger_events pe
     WHERE pe.ticket_id = ?
       AND pe.seat_number IN (?)
       AND pe.id IN (
         SELECT MAX(pe2.id)
         FROM passenger_events pe2
         WHERE pe2.ticket_id = ?
           AND pe2.seat_number IN (?)
         GROUP BY pe2.seat_number
       )`,
    [ticketId, seatNumbers, ticketId, seatNumbers]
  );

  const latestMap = new Map();
  latestRows.forEach((row) => {
    latestMap.set(Number(row.seat_number), row.event_type);
  });

  return latestMap;
};

const recordEvent = async ({
  ticketId,
  eventType,
  stopId,
  seatNumbers,
  recordedByUserId,
  notes,
}) => {
  const normalizedTicketId = toPositiveInt(ticketId);
  const normalizedStopId = toPositiveInt(stopId);
  const normalizedSeats = normalizeSeatNumbers(seatNumbers);

  if (!normalizedTicketId) {
    throw new PassengerFlowValidationError('A valid ticket id is required', 400);
  }

  if (!['board', 'alight'].includes(eventType)) {
    throw new PassengerFlowValidationError('eventType must be board or alight', 400);
  }

  if (!normalizedStopId) {
    throw new PassengerFlowValidationError('stop_id is required', 400);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const context = await getTicketEventContext(connection, normalizedTicketId, true);
    const seats = await getSeatPassengers(connection, normalizedTicketId, normalizedSeats);
    const stop = await validateStopForEvent(connection, context.trip_id, normalizedStopId, context, eventType);

    const seatNumberList = seats.map((seat) => seat.seat_number);
    const latestSeatEvents = await getLatestSeatEventMap(connection, normalizedTicketId, seatNumberList);

    seats.forEach((seat) => {
      const previous = latestSeatEvents.get(seat.seat_number);

      if (eventType === 'board' && previous === 'board') {
        throw new PassengerFlowValidationError(`Seat ${seat.seat_number} is already boarded`, 409);
      }

      if (eventType === 'alight' && previous !== 'board') {
        throw new PassengerFlowValidationError(`Seat ${seat.seat_number} must be boarded before alighting`, 409);
      }
    });

    const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 255) : null;
    const now = new Date();

    await connection.query(
      `INSERT INTO passenger_events
         (ticket_id, trip_id, stop_id, seat_number, passenger_name, event_type, event_time, recorded_by_user_id, notes)
       VALUES ?`,
      [
        seats.map((seat) => [
          normalizedTicketId,
          context.trip_id,
          normalizedStopId,
          seat.seat_number,
          seat.passenger_name,
          eventType,
          now,
          toPositiveInt(recordedByUserId),
          cleanNotes,
        ]),
      ]
    );

    await connection.commit();

    return {
      ticket_id: normalizedTicketId,
      trip_id: context.trip_id,
      stop_id: normalizedStopId,
      stop_name: stop.stop_name,
      event_type: eventType,
      seat_numbers: seatNumberList,
      event_time: now.toISOString(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getTicketEvents = async ({ ticketId, requesterUserId, requesterRole }) => {
  const normalizedTicketId = toPositiveInt(ticketId);
  if (!normalizedTicketId) {
    throw new PassengerFlowValidationError('A valid ticket id is required', 400);
  }

  const [contextRows] = await pool.query(
    `SELECT id, user_id FROM tickets WHERE id = ? LIMIT 1`,
    [normalizedTicketId]
  );

  if (!contextRows[0]) {
    throw new PassengerFlowValidationError('Ticket not found', 404);
  }

  if (requesterRole !== 'admin' && Number(contextRows[0].user_id) !== Number(requesterUserId)) {
    throw new PassengerFlowValidationError('You are not allowed to view these passenger events', 403);
  }

  const [rows] = await pool.query(
    `SELECT pe.id, pe.ticket_id, pe.trip_id, pe.stop_id, bs.stop_name,
            pe.seat_number, pe.passenger_name, pe.event_type, pe.event_time,
            pe.recorded_by_user_id, recorder.name AS recorded_by_name, pe.notes
     FROM passenger_events pe
     JOIN bus_stops bs ON bs.id = pe.stop_id
     LEFT JOIN users recorder ON recorder.id = pe.recorded_by_user_id
     WHERE pe.ticket_id = ?
     ORDER BY pe.event_time ASC, pe.id ASC`,
    [normalizedTicketId]
  );

  return rows;
};

const getTripPassengerFlow = async (tripId) => {
  const normalizedTripId = toPositiveInt(tripId);
  if (!normalizedTripId) {
    throw new PassengerFlowValidationError('A valid trip id is required', 400);
  }

  const [tripRows] = await pool.query('SELECT id FROM trips WHERE id = ? LIMIT 1', [normalizedTripId]);
  if (!tripRows[0]) {
    throw new PassengerFlowValidationError('Trip not found', 404);
  }

  const [rows] = await pool.query(
    `SELECT bs.id AS stop_id, bs.stop_name, bs.stop_order,
            SUM(CASE WHEN pe.event_type = 'board' THEN 1 ELSE 0 END) AS boarded,
            SUM(CASE WHEN pe.event_type = 'alight' THEN 1 ELSE 0 END) AS alighted
     FROM bus_stops bs
     JOIN trips tr ON tr.route_id = bs.route_id
     LEFT JOIN passenger_events pe ON pe.trip_id = tr.id AND pe.stop_id = bs.id
     WHERE tr.id = ?
     GROUP BY bs.id, bs.stop_name, bs.stop_order
     ORDER BY bs.stop_order ASC`,
    [normalizedTripId]
  );

  let onboard = 0;
  const stops = rows.map((row) => {
    const boarded = Number(row.boarded || 0);
    const alighted = Number(row.alighted || 0);
    onboard += boarded - alighted;

    return {
      stop_id: row.stop_id,
      stop_name: row.stop_name,
      stop_order: row.stop_order,
      boarded,
      alighted,
      onboard_after_stop: onboard,
    };
  });

  return {
    trip_id: normalizedTripId,
    stops,
    totals: {
      boarded: stops.reduce((sum, stop) => sum + stop.boarded, 0),
      alighted: stops.reduce((sum, stop) => sum + stop.alighted, 0),
      onboard_latest: stops.length ? stops[stops.length - 1].onboard_after_stop : 0,
    },
  };
};

module.exports = {
  PassengerFlowValidationError,
  recordEvent,
  getTicketEvents,
  getTripPassengerFlow,
};
