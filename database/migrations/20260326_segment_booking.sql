USE dhaka_bus;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS boarding_stop_id INT NULL AFTER trip_id,
  ADD COLUMN IF NOT EXISTS dropoff_stop_id INT NULL AFTER boarding_stop_id;

UPDATE tickets tk
JOIN trips tr ON tr.id = tk.trip_id
JOIN (
  SELECT r.id AS route_id,
         (
           SELECT bs.id
           FROM bus_stops bs
           WHERE bs.route_id = r.id
           ORDER BY bs.stop_order ASC
           LIMIT 1
         ) AS first_stop_id,
         (
           SELECT bs.id
           FROM bus_stops bs
           WHERE bs.route_id = r.id
           ORDER BY bs.stop_order DESC
           LIMIT 1
         ) AS last_stop_id
  FROM routes r
) stop_bounds ON stop_bounds.route_id = tr.route_id
SET
  tk.boarding_stop_id = COALESCE(tk.boarding_stop_id, stop_bounds.first_stop_id),
  tk.dropoff_stop_id = COALESCE(tk.dropoff_stop_id, stop_bounds.last_stop_id)
WHERE tk.boarding_stop_id IS NULL OR tk.dropoff_stop_id IS NULL;

ALTER TABLE tickets
  MODIFY COLUMN boarding_stop_id INT NOT NULL,
  MODIFY COLUMN dropoff_stop_id INT NOT NULL;

SET @boarding_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'fk_tickets_boarding_stop'
);

SET @dropoff_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'fk_tickets_dropoff_stop'
);

SET @add_boarding_fk := IF(
  @boarding_fk_exists = 0,
  'ALTER TABLE tickets ADD CONSTRAINT fk_tickets_boarding_stop FOREIGN KEY (boarding_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_boarding_fk FROM @add_boarding_fk;
EXECUTE stmt_boarding_fk;
DEALLOCATE PREPARE stmt_boarding_fk;

SET @add_dropoff_fk := IF(
  @dropoff_fk_exists = 0,
  'ALTER TABLE tickets ADD CONSTRAINT fk_tickets_dropoff_stop FOREIGN KEY (dropoff_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_dropoff_fk FROM @add_dropoff_fk;
EXECUTE stmt_dropoff_fk;
DEALLOCATE PREPARE stmt_dropoff_fk;

SET @segment_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND INDEX_NAME = 'idx_ticket_trip_segment'
);

SET @add_segment_idx := IF(
  @segment_idx_exists = 0,
  'CREATE INDEX idx_ticket_trip_segment ON tickets(trip_id, boarding_stop_id, dropoff_stop_id, status)',
  'SELECT 1'
);
PREPARE stmt_segment_idx FROM @add_segment_idx;
EXECUTE stmt_segment_idx;
DEALLOCATE PREPARE stmt_segment_idx;
