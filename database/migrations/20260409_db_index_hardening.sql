USE dhaka_bus;

SET @idx_nagad_user_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'nagad_payments'
    AND INDEX_NAME = 'idx_nagad_payments_user_id'
);
SET @add_idx_nagad_user := IF(
  @idx_nagad_user_exists = 0,
  'CREATE INDEX idx_nagad_payments_user_id ON nagad_payments(user_id)',
  'SELECT 1'
);
PREPARE stmt_add_idx_nagad_user FROM @add_idx_nagad_user;
EXECUTE stmt_add_idx_nagad_user;
DEALLOCATE PREPARE stmt_add_idx_nagad_user;

SET @idx_events_recorded_by_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passenger_events'
    AND INDEX_NAME = 'idx_passenger_events_recorded_by_user'
);
SET @add_idx_events_recorded_by := IF(
  @idx_events_recorded_by_exists = 0,
  'CREATE INDEX idx_passenger_events_recorded_by_user ON passenger_events(recorded_by_user_id)',
  'SELECT 1'
);
PREPARE stmt_add_idx_events_recorded_by FROM @add_idx_events_recorded_by;
EXECUTE stmt_add_idx_events_recorded_by;
DEALLOCATE PREPARE stmt_add_idx_events_recorded_by;
