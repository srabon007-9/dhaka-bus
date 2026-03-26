USE dhaka_bus;

-- =====================================================
-- Level 1: Data integrity constraints (course topic)
-- =====================================================
SET @chk_trips_time_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'trips'
    AND CONSTRAINT_NAME = 'chk_trips_time_window'
);

SET @add_chk_trips_time := IF(
  @chk_trips_time_exists = 0,
  'ALTER TABLE trips ADD CONSTRAINT chk_trips_time_window CHECK (arrival_time > departure_time)',
  'SELECT 1'
);
PREPARE stmt_add_chk_trips_time FROM @add_chk_trips_time;
EXECUTE stmt_add_chk_trips_time;
DEALLOCATE PREPARE stmt_add_chk_trips_time;

SET @chk_trips_fare_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'trips'
    AND CONSTRAINT_NAME = 'chk_trips_fare_non_negative'
);

SET @add_chk_trips_fare := IF(
  @chk_trips_fare_exists = 0,
  'ALTER TABLE trips ADD CONSTRAINT chk_trips_fare_non_negative CHECK (fare >= 0 AND total_seats > 0)',
  'SELECT 1'
);
PREPARE stmt_add_chk_trips_fare FROM @add_chk_trips_fare;
EXECUTE stmt_add_chk_trips_fare;
DEALLOCATE PREPARE stmt_add_chk_trips_fare;

SET @chk_tickets_price_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'chk_tickets_price_non_negative'
);

SET @add_chk_tickets_price := IF(
  @chk_tickets_price_exists = 0,
  'ALTER TABLE tickets ADD CONSTRAINT chk_tickets_price_non_negative CHECK (total_price >= 0)',
  'SELECT 1'
);
PREPARE stmt_add_chk_tickets_price FROM @add_chk_tickets_price;
EXECUTE stmt_add_chk_tickets_price;
DEALLOCATE PREPARE stmt_add_chk_tickets_price;

SET @chk_tickets_stops_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'chk_tickets_distinct_stops'
);

SET @add_chk_tickets_stops := IF(
  @chk_tickets_stops_exists = 0,
  'ALTER TABLE tickets ADD CONSTRAINT chk_tickets_distinct_stops CHECK (boarding_stop_id <> dropoff_stop_id)',
  'SELECT 1'
);
PREPARE stmt_add_chk_tickets_stops FROM @add_chk_tickets_stops;
EXECUTE stmt_add_chk_tickets_stops;
DEALLOCATE PREPARE stmt_add_chk_tickets_stops;

-- =====================================================
-- Level 2: Uniqueness rules for logical consistency
-- =====================================================
SET @uq_stops_order_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bus_stops'
    AND CONSTRAINT_NAME = 'uq_bus_stops_route_order'
);

SET @add_uq_stops_order := IF(
  @uq_stops_order_exists = 0,
  'ALTER TABLE bus_stops ADD CONSTRAINT uq_bus_stops_route_order UNIQUE (route_id, stop_order)',
  'SELECT 1'
);
PREPARE stmt_add_uq_stops_order FROM @add_uq_stops_order;
EXECUTE stmt_add_uq_stops_order;
DEALLOCATE PREPARE stmt_add_uq_stops_order;

SET @uq_stops_name_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bus_stops'
    AND CONSTRAINT_NAME = 'uq_bus_stops_route_name'
);

SET @add_uq_stops_name := IF(
  @uq_stops_name_exists = 0,
  'ALTER TABLE bus_stops ADD CONSTRAINT uq_bus_stops_route_name UNIQUE (route_id, stop_name)',
  'SELECT 1'
);
PREPARE stmt_add_uq_stops_name FROM @add_uq_stops_name;
EXECUTE stmt_add_uq_stops_name;
DEALLOCATE PREPARE stmt_add_uq_stops_name;

-- =====================================================
-- Level 3: Query performance indexes
-- =====================================================
SET @idx_tickets_trip_status_created_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND INDEX_NAME = 'idx_tickets_trip_status_created'
);

SET @add_idx_tickets_trip_status_created := IF(
  @idx_tickets_trip_status_created_exists = 0,
  'CREATE INDEX idx_tickets_trip_status_created ON tickets(trip_id, status, created_at)',
  'SELECT 1'
);
PREPARE stmt_add_idx_tickets_trip_status_created FROM @add_idx_tickets_trip_status_created;
EXECUTE stmt_add_idx_tickets_trip_status_created;
DEALLOCATE PREPARE stmt_add_idx_tickets_trip_status_created;

SET @idx_tickets_user_status_created_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND INDEX_NAME = 'idx_tickets_user_status_created'
);

SET @add_idx_tickets_user_status_created := IF(
  @idx_tickets_user_status_created_exists = 0,
  'CREATE INDEX idx_tickets_user_status_created ON tickets(user_id, status, created_at)',
  'SELECT 1'
);
PREPARE stmt_add_idx_tickets_user_status_created FROM @add_idx_tickets_user_status_created;
EXECUTE stmt_add_idx_tickets_user_status_created;
DEALLOCATE PREPARE stmt_add_idx_tickets_user_status_created;

SET @manual_payments_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
);

SET @idx_mp_status_expires_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
    AND INDEX_NAME = 'idx_manual_payments_status_expires'
);

SET @add_idx_mp_status_expires := IF(
  @manual_payments_table_exists = 1 AND @idx_mp_status_expires_exists = 0,
  'CREATE INDEX idx_manual_payments_status_expires ON manual_payments(status, expires_at)',
  'SELECT 1'
);
PREPARE stmt_add_idx_mp_status_expires FROM @add_idx_mp_status_expires;
EXECUTE stmt_add_idx_mp_status_expires;
DEALLOCATE PREPARE stmt_add_idx_mp_status_expires;

SET @idx_mp_user_status_created_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
    AND INDEX_NAME = 'idx_manual_payments_user_status_created'
);

SET @add_idx_mp_user_status_created := IF(
  @manual_payments_table_exists = 1 AND @idx_mp_user_status_created_exists = 0,
  'CREATE INDEX idx_manual_payments_user_status_created ON manual_payments(user_id, status, created_at)',
  'SELECT 1'
);
PREPARE stmt_add_idx_mp_user_status_created FROM @add_idx_mp_user_status_created;
EXECUTE stmt_add_idx_mp_user_status_created;
DEALLOCATE PREPARE stmt_add_idx_mp_user_status_created;

SET @idx_mp_method_status_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
    AND INDEX_NAME = 'idx_manual_payments_method_status'
);

SET @add_idx_mp_method_status := IF(
  @manual_payments_table_exists = 1 AND @idx_mp_method_status_exists = 0,
  'CREATE INDEX idx_manual_payments_method_status ON manual_payments(payment_method, status)',
  'SELECT 1'
);
PREPARE stmt_add_idx_mp_method_status FROM @add_idx_mp_method_status;
EXECUTE stmt_add_idx_mp_method_status;
DEALLOCATE PREPARE stmt_add_idx_mp_method_status;

-- =====================================================
-- Level 4: Audit tables + triggers (change history)
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_status_audit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  old_status VARCHAR(32) NOT NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(128) NULL,
  INDEX idx_ticket_status_audit_ticket_time (ticket_id, changed_at),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manual_payment_status_audit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(50) NOT NULL,
  old_status VARCHAR(32) NOT NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(128) NULL,
  INDEX idx_manual_payment_status_audit_payment_time (payment_id, changed_at)
);

DROP TRIGGER IF EXISTS trg_tickets_status_audit;
DROP TRIGGER IF EXISTS trg_manual_payments_status_audit;

DELIMITER $$
CREATE TRIGGER trg_tickets_status_audit
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO ticket_status_audit (ticket_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, CURRENT_USER());
  END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_manual_payments_status_audit
AFTER UPDATE ON manual_payments
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO manual_payment_status_audit (payment_id, old_status, new_status, changed_by)
    VALUES (NEW.payment_id, OLD.status, NEW.status, CURRENT_USER());
  END IF;
END$$
DELIMITER ;

-- =====================================================
-- Level 5: DB automation + analytical view
-- =====================================================
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS ev_cancel_expired_manual_payments;

DELIMITER $$
CREATE EVENT ev_cancel_expired_manual_payments
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
  UPDATE manual_payments
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND expires_at <= NOW();
END$$
DELIMITER ;

CREATE OR REPLACE VIEW vw_route_daily_revenue AS
SELECT
  DATE(tk.created_at) AS revenue_date,
  tr.route_id,
  r.route_name,
  COUNT(*) AS tickets_sold,
  ROUND(SUM(tk.total_price), 2) AS gross_revenue
FROM tickets tk
JOIN trips tr ON tr.id = tk.trip_id
JOIN routes r ON r.id = tr.route_id
WHERE tk.status = 'active'
GROUP BY DATE(tk.created_at), tr.route_id, r.route_name;
