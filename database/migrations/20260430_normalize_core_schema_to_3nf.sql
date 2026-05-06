USE dhaka_bus;

CREATE TABLE IF NOT EXISTS booking_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  boarding_stop_id INT NOT NULL,
  dropoff_stop_id INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'bdt',
  status ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
  ticket_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  legacy_source_table VARCHAR(32) NULL,
  legacy_source_row_id INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (boarding_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (dropoff_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS booking_request_seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_request_id INT NOT NULL,
  seat_number INT NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_request_seat (booking_request_id, seat_number),
  FOREIGN KEY (booking_request_id) REFERENCES booking_requests(id) ON DELETE CASCADE
);

-- Backfill seat-level ticket rows from legacy JSON tickets before removing legacy columns.
INSERT INTO ticket_seats (ticket_id, seat_number, passenger_name)
SELECT
  tk.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(tk.passenger_name), ''), 'Passenger') AS passenger_name
FROM tickets tk
JOIN JSON_TABLE(
  tk.seat_numbers,
  '$[*]' COLUMNS (seat_number INT PATH '$')
) AS jt
LEFT JOIN ticket_seats ts
  ON ts.ticket_id = tk.id
 AND ts.seat_number = jt.seat_number
WHERE ts.id IS NULL;

-- Create normalized booking requests from existing manual payments.
INSERT INTO booking_requests (
  user_id, trip_id, boarding_stop_id, dropoff_stop_id, total_price, currency, status, ticket_id, created_at, legacy_source_table, legacy_source_row_id
)
SELECT
  COALESCE(mp.user_id, CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.user_id')) AS UNSIGNED)),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.trip_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.boarding_stop_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.dropoff_stop_id')) AS UNSIGNED),
  mp.amount,
  COALESCE(mp.currency, 'bdt'),
  CASE
    WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.payment_details, '$.ticket_id')) AS UNSIGNED) IS NOT NULL THEN 'fulfilled'
    WHEN mp.status IN ('rejected', 'cancelled') THEN 'cancelled'
    ELSE 'pending'
  END,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(mp.payment_details, '$.ticket_id')) AS UNSIGNED),
  mp.created_at,
  'manual_payments',
  mp.id
FROM manual_payments mp
WHERE mp.booking_payload IS NOT NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(jt.passenger_name), ''), COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.passenger_name'))), ''), 'Passenger'))
FROM manual_payments mp
JOIN booking_requests br
  ON br.legacy_source_table = 'manual_payments'
 AND br.legacy_source_row_id = mp.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(mp.booking_payload, '$.passenger_details'), JSON_ARRAY()),
  '$[*]' COLUMNS (
    seat_number INT PATH '$.seat_number',
    passenger_name VARCHAR(120) PATH '$.passenger_name'
  )
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(mp.booking_payload, '$.passenger_name'))), ''), 'Passenger')
FROM manual_payments mp
JOIN booking_requests br
  ON br.legacy_source_table = 'manual_payments'
 AND br.legacy_source_row_id = mp.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(mp.booking_payload, '$.seat_numbers'), JSON_ARRAY()),
  '$[*]' COLUMNS (seat_number INT PATH '$')
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL
  AND JSON_LENGTH(COALESCE(JSON_EXTRACT(mp.booking_payload, '$.passenger_details'), JSON_ARRAY())) = 0;

-- Create normalized booking requests from existing Nagad payments.
INSERT INTO booking_requests (
  user_id, trip_id, boarding_stop_id, dropoff_stop_id, total_price, currency, status, ticket_id, created_at, legacy_source_table, legacy_source_row_id
)
SELECT
  COALESCE(np.user_id, CAST(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.user_id')) AS UNSIGNED)),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.trip_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.boarding_stop_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.dropoff_stop_id')) AS UNSIGNED),
  np.amount,
  COALESCE(np.currency, 'bdt'),
  CASE
    WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(np.payment_details, '$.ticket_id')) AS UNSIGNED) IS NOT NULL THEN 'fulfilled'
    WHEN np.status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'pending'
  END,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(np.payment_details, '$.ticket_id')) AS UNSIGNED),
  np.created_at,
  'nagad_payments',
  np.id
FROM nagad_payments np
WHERE np.booking_payload IS NOT NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(jt.passenger_name), ''), COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.passenger_name'))), ''), 'Passenger'))
FROM nagad_payments np
JOIN booking_requests br
  ON br.legacy_source_table = 'nagad_payments'
 AND br.legacy_source_row_id = np.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(np.booking_payload, '$.passenger_details'), JSON_ARRAY()),
  '$[*]' COLUMNS (
    seat_number INT PATH '$.seat_number',
    passenger_name VARCHAR(120) PATH '$.passenger_name'
  )
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(np.booking_payload, '$.passenger_name'))), ''), 'Passenger')
FROM nagad_payments np
JOIN booking_requests br
  ON br.legacy_source_table = 'nagad_payments'
 AND br.legacy_source_row_id = np.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(np.booking_payload, '$.seat_numbers'), JSON_ARRAY()),
  '$[*]' COLUMNS (seat_number INT PATH '$')
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL
  AND JSON_LENGTH(COALESCE(JSON_EXTRACT(np.booking_payload, '$.passenger_details'), JSON_ARRAY())) = 0;

-- Create normalized booking requests from existing payment sessions.
INSERT INTO booking_requests (
  user_id, trip_id, boarding_stop_id, dropoff_stop_id, total_price, currency, status, ticket_id, created_at, legacy_source_table, legacy_source_row_id
)
SELECT
  ps.user_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ps.booking_payload, '$.trip_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ps.booking_payload, '$.boarding_stop_id')) AS UNSIGNED),
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ps.booking_payload, '$.dropoff_stop_id')) AS UNSIGNED),
  ps.amount_expected,
  COALESCE(ps.currency, 'bdt'),
  CASE
    WHEN ps.ticket_id IS NOT NULL THEN 'fulfilled'
    WHEN ps.status = 'failed' THEN 'cancelled'
    ELSE 'pending'
  END,
  ps.ticket_id,
  ps.created_at,
  'payment_sessions',
  ps.id
FROM payment_sessions ps
WHERE ps.booking_payload IS NOT NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(jt.passenger_name), ''), COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(ps.booking_payload, '$.passenger_name'))), ''), 'Passenger'))
FROM payment_sessions ps
JOIN booking_requests br
  ON br.legacy_source_table = 'payment_sessions'
 AND br.legacy_source_row_id = ps.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(ps.booking_payload, '$.passenger_details'), JSON_ARRAY()),
  '$[*]' COLUMNS (
    seat_number INT PATH '$.seat_number',
    passenger_name VARCHAR(120) PATH '$.passenger_name'
  )
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL;

INSERT INTO booking_request_seats (booking_request_id, seat_number, passenger_name)
SELECT
  br.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(ps.booking_payload, '$.passenger_name'))), ''), 'Passenger')
FROM payment_sessions ps
JOIN booking_requests br
  ON br.legacy_source_table = 'payment_sessions'
 AND br.legacy_source_row_id = ps.id
JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(ps.booking_payload, '$.seat_numbers'), JSON_ARRAY()),
  '$[*]' COLUMNS (seat_number INT PATH '$')
) AS jt
LEFT JOIN booking_request_seats brs
  ON brs.booking_request_id = br.id
 AND brs.seat_number = jt.seat_number
WHERE brs.id IS NULL
  AND JSON_LENGTH(COALESCE(JSON_EXTRACT(ps.booking_payload, '$.passenger_details'), JSON_ARRAY())) = 0;

ALTER TABLE manual_payments ADD COLUMN IF NOT EXISTS booking_request_id INT NULL AFTER payment_id;
ALTER TABLE nagad_payments ADD COLUMN IF NOT EXISTS booking_request_id INT NULL AFTER merchant_id;
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS booking_request_id INT NULL AFTER session_id;
ALTER TABLE nagad_payments ADD COLUMN IF NOT EXISTS issuer_txn_id VARCHAR(100) NULL AFTER status;
ALTER TABLE nagad_payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255) NULL AFTER issuer_txn_id;
ALTER TABLE passenger_events ADD COLUMN IF NOT EXISTS ticket_seat_id INT NULL AFTER id;

UPDATE manual_payments mp
JOIN booking_requests br
  ON br.legacy_source_table = 'manual_payments'
 AND br.legacy_source_row_id = mp.id
SET mp.booking_request_id = br.id
WHERE mp.booking_request_id IS NULL;

UPDATE nagad_payments np
JOIN booking_requests br
  ON br.legacy_source_table = 'nagad_payments'
 AND br.legacy_source_row_id = np.id
SET np.booking_request_id = br.id,
    np.issuer_txn_id = COALESCE(np.issuer_txn_id, JSON_UNQUOTE(JSON_EXTRACT(np.payment_details, '$.issuerTxnID'))),
    np.failure_reason = COALESCE(np.failure_reason, JSON_UNQUOTE(JSON_EXTRACT(np.payment_details, '$.error')))
WHERE np.booking_request_id IS NULL;

UPDATE payment_sessions ps
JOIN booking_requests br
  ON br.legacy_source_table = 'payment_sessions'
 AND br.legacy_source_row_id = ps.id
SET ps.booking_request_id = br.id
WHERE ps.booking_request_id IS NULL;

UPDATE passenger_events pe
JOIN ticket_seats ts
  ON ts.ticket_id = pe.ticket_id
 AND ts.seat_number = pe.seat_number
SET pe.ticket_seat_id = ts.id
WHERE pe.ticket_seat_id IS NULL;

ALTER TABLE manual_payments MODIFY COLUMN booking_request_id INT NOT NULL;
ALTER TABLE nagad_payments MODIFY COLUMN booking_request_id INT NOT NULL;
ALTER TABLE payment_sessions MODIFY COLUMN booking_request_id INT NOT NULL;
ALTER TABLE passenger_events MODIFY COLUMN ticket_seat_id INT NOT NULL;

-- Drop legacy foreign keys before dropping legacy columns.
SET @fk_manual_user := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @drop_fk_manual_user := IF(@fk_manual_user IS NULL, 'SELECT 1', CONCAT('ALTER TABLE manual_payments DROP FOREIGN KEY `', @fk_manual_user, '`'));
PREPARE stmt_manual_user FROM @drop_fk_manual_user;
EXECUTE stmt_manual_user;
DEALLOCATE PREPARE stmt_manual_user;

SET @fk_nagad_user := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'nagad_payments'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @drop_fk_nagad_user := IF(@fk_nagad_user IS NULL, 'SELECT 1', CONCAT('ALTER TABLE nagad_payments DROP FOREIGN KEY `', @fk_nagad_user, '`'));
PREPARE stmt_nagad_user FROM @drop_fk_nagad_user;
EXECUTE stmt_nagad_user;
DEALLOCATE PREPARE stmt_nagad_user;

SET @fk_session_user := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payment_sessions'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @drop_fk_session_user := IF(@fk_session_user IS NULL, 'SELECT 1', CONCAT('ALTER TABLE payment_sessions DROP FOREIGN KEY `', @fk_session_user, '`'));
PREPARE stmt_session_user FROM @drop_fk_session_user;
EXECUTE stmt_session_user;
DEALLOCATE PREPARE stmt_session_user;

SET @fk_event_ticket := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passenger_events'
    AND COLUMN_NAME = 'ticket_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @drop_fk_event_ticket := IF(@fk_event_ticket IS NULL, 'SELECT 1', CONCAT('ALTER TABLE passenger_events DROP FOREIGN KEY `', @fk_event_ticket, '`'));
PREPARE stmt_event_ticket FROM @drop_fk_event_ticket;
EXECUTE stmt_event_ticket;
DEALLOCATE PREPARE stmt_event_ticket;

SET @fk_event_trip := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passenger_events'
    AND COLUMN_NAME = 'trip_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @drop_fk_event_trip := IF(@fk_event_trip IS NULL, 'SELECT 1', CONCAT('ALTER TABLE passenger_events DROP FOREIGN KEY `', @fk_event_trip, '`'));
PREPARE stmt_event_trip FROM @drop_fk_event_trip;
EXECUTE stmt_event_trip;
DEALLOCATE PREPARE stmt_event_trip;

ALTER TABLE tickets
  DROP COLUMN seat_numbers,
  DROP COLUMN passenger_name;

ALTER TABLE manual_payments
  DROP COLUMN user_id,
  DROP COLUMN booking_payload,
  DROP COLUMN payment_details;

ALTER TABLE nagad_payments
  DROP COLUMN user_id,
  DROP COLUMN booking_payload,
  DROP COLUMN payment_details;

ALTER TABLE payment_sessions
  DROP COLUMN user_id,
  DROP COLUMN booking_payload;

ALTER TABLE passenger_events
  DROP INDEX uq_passenger_event_stop,
  DROP INDEX idx_passenger_events_trip_stop,
  DROP INDEX idx_passenger_events_ticket_seat,
  DROP COLUMN ticket_id,
  DROP COLUMN trip_id,
  DROP COLUMN seat_number,
  DROP COLUMN passenger_name;

ALTER TABLE passenger_events
  ADD UNIQUE KEY uq_passenger_event_stop (ticket_seat_id, stop_id, event_type),
  ADD INDEX idx_passenger_events_stop_time (stop_id, event_time),
  ADD INDEX idx_passenger_events_ticket_seat (ticket_seat_id, event_time);

ALTER TABLE booking_requests
  DROP COLUMN legacy_source_table,
  DROP COLUMN legacy_source_row_id;
