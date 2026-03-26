USE dhaka_bus;

SET @forward_route_id := (
  SELECT id
  FROM routes
  WHERE route_name = 'Dhanmondi–Airport Express'
  ORDER BY id
  LIMIT 1
);

INSERT INTO routes (route_name, start_point, end_point)
SELECT 'Airport to Dhanmondi 27', 'Airport', 'Dhanmondi 27'
FROM DUAL
WHERE @forward_route_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM routes WHERE route_name = 'Airport to Dhanmondi 27'
  );

SET @reverse_route_id := (
  SELECT id
  FROM routes
  WHERE route_name = 'Airport to Dhanmondi 27'
  ORDER BY id
  LIMIT 1
);

SET @max_stop_order := (
  SELECT MAX(stop_order)
  FROM bus_stops
  WHERE route_id = @forward_route_id
);

INSERT INTO bus_stops (route_id, stop_name, latitude, longitude, stop_order)
SELECT
  @reverse_route_id,
  stop_name,
  latitude,
  longitude,
  (@max_stop_order + 1 - stop_order) AS stop_order
FROM bus_stops
WHERE route_id = @forward_route_id
  AND @reverse_route_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bus_stops WHERE route_id = @reverse_route_id
  )
ORDER BY stop_order DESC;

INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude)
SELECT
  @reverse_route_id,
  (@max_stop_order + 1 - src.stop_to_order) AS stop_from_order,
  (@max_stop_order + 1 - src.stop_from_order) AS stop_to_order,
  (seg.segment_count + 1 - src.waypoint_sequence) AS waypoint_sequence,
  src.latitude,
  src.longitude
FROM route_waypoints src
JOIN (
  SELECT route_id, stop_from_order, stop_to_order, MAX(waypoint_sequence) AS segment_count
  FROM route_waypoints
  WHERE route_id = @forward_route_id
  GROUP BY route_id, stop_from_order, stop_to_order
) seg
  ON seg.route_id = src.route_id
 AND seg.stop_from_order = src.stop_from_order
 AND seg.stop_to_order = src.stop_to_order
WHERE src.route_id = @forward_route_id
  AND @reverse_route_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM route_waypoints WHERE route_id = @reverse_route_id
  )
ORDER BY stop_from_order ASC, stop_to_order ASC, waypoint_sequence ASC;

INSERT INTO buses (name, route_id, capacity, status)
SELECT CONCAT('Airport Return ', seq.n), @reverse_route_id, 40, 'active'
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) seq
WHERE @reverse_route_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM buses WHERE route_id = @reverse_route_id
  );

INSERT INTO locations (bus_id, latitude, longitude, speed_kmh, timestamp)
SELECT b.id, s.latitude, s.longitude, 0, NOW()
FROM buses b
JOIN (
  SELECT route_id, stop_order, latitude, longitude
  FROM bus_stops
  WHERE route_id = @reverse_route_id AND stop_order BETWEEN 1 AND 5
) s
  ON s.route_id = b.route_id
 AND s.stop_order = (
   CAST(SUBSTRING_INDEX(b.name, ' ', -1) AS UNSIGNED)
 )
WHERE b.route_id = @reverse_route_id
  AND NOT EXISTS (
    SELECT 1 FROM locations l WHERE l.bus_id = b.id
  );

INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, fare, total_seats, status)
SELECT
  @reverse_route_id,
  b.id,
  trip_schedule.departure_time,
  trip_schedule.arrival_time,
  150.00,
  40,
  'scheduled'
FROM (
  SELECT
    1 AS trip_number,
    CONCAT(DATE(NOW()), ' 07:00:00') AS departure_time,
    CONCAT(DATE(NOW()), ' 08:30:00') AS arrival_time
  UNION ALL
  SELECT 2, CONCAT(DATE(NOW()), ' 09:00:00'), CONCAT(DATE(NOW()), ' 10:30:00')
  UNION ALL
  SELECT 3, CONCAT(DATE(NOW()), ' 11:00:00'), CONCAT(DATE(NOW()), ' 12:30:00')
  UNION ALL
  SELECT 4, CONCAT(DATE(NOW()), ' 13:00:00'), CONCAT(DATE(NOW()), ' 14:30:00')
  UNION ALL
  SELECT 5, CONCAT(DATE(NOW()), ' 15:00:00'), CONCAT(DATE(NOW()), ' 16:30:00')
  UNION ALL
  SELECT 6, CONCAT(DATE(NOW()), ' 17:00:00'), CONCAT(DATE(NOW()), ' 18:30:00')
) trip_schedule
JOIN (
  SELECT id
  FROM buses
  WHERE route_id = @reverse_route_id
  ORDER BY id
  LIMIT 1
) b
WHERE @reverse_route_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM trips WHERE route_id = @reverse_route_id
  );
