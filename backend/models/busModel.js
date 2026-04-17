const pool = require('../config/database');

const busStatsSelect = `
  SELECT
    b.*,
    r.route_name,
    r.start_point,
    r.end_point,
    next_trip.id AS next_trip_id,
    next_trip.departure_time AS next_departure_time,
    next_trip.arrival_time AS next_arrival_time,
    next_trip.status AS next_trip_status,
    COALESCE(next_trip.total_seats, b.capacity, 0) AS trip_total_seats,
    COALESCE(trip_sales.booked_seats, 0) AS booked_seats,
    GREATEST(COALESCE(next_trip.total_seats, b.capacity, 0) - COALESCE(trip_sales.booked_seats, 0), 0) AS available_seats,
    COALESCE(trip_sales.ticket_count, 0) AS passenger_tickets,
    COALESCE(trip_flow.onboard_passengers, 0) AS onboard_passengers
  FROM buses b
  JOIN routes r ON r.id = b.route_id
  LEFT JOIN trips next_trip
    ON next_trip.id = (
      SELECT t2.id
      FROM trips t2
      WHERE t2.bus_id = b.id
        AND t2.status IN ('running', 'scheduled')
      ORDER BY
        CASE WHEN t2.status = 'running' THEN 0 ELSE 1 END ASC,
        t2.departure_time ASC
      LIMIT 1
    )
  LEFT JOIN (
    SELECT
      tk.trip_id,
      COUNT(*) AS booked_seats,
      COUNT(DISTINCT tk.id) AS ticket_count
    FROM tickets tk
    JOIN ticket_seats ts ON ts.ticket_id = tk.id
    WHERE tk.status = 'active'
    GROUP BY tk.trip_id
  ) trip_sales ON trip_sales.trip_id = next_trip.id
  LEFT JOIN (
    SELECT
      pe.trip_id,
      COUNT(*) AS onboard_passengers
    FROM passenger_events pe
    JOIN (
      SELECT ticket_id, seat_number, MAX(id) AS last_event_id
      FROM passenger_events
      GROUP BY ticket_id, seat_number
    ) latest
      ON latest.last_event_id = pe.id
    WHERE pe.event_type = 'board'
    GROUP BY pe.trip_id
  ) trip_flow ON trip_flow.trip_id = next_trip.id
`;

const getAllBuses = async () => {
  try {
    const [rows] = await pool.query(
      `${busStatsSelect}
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
      `${busStatsSelect}
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
      `${busStatsSelect}
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
      `${busStatsSelect}
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
