USE dhaka_bus;

-- Partition the high-write locations table by month using timestamp.
-- This migration creates a partitioned replacement table, migrates data,
-- and keeps a backup of the previous unpartitioned table.

SET @locations_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'locations'
);

SET @already_partitioned := (
  SELECT COUNT(*)
  FROM information_schema.PARTITIONS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'locations'
    AND PARTITION_NAME IS NOT NULL
);

-- Run only when locations exists and is not already partitioned.
SET @run_partition_migration := IF(@locations_exists = 1 AND @already_partitioned = 0, 1, 0);

SET @drop_tmp := IF(
  @run_partition_migration = 1,
  'DROP TABLE IF EXISTS locations_partitioned_tmp',
  'SELECT 1'
);
PREPARE stmt_drop_tmp FROM @drop_tmp;
EXECUTE stmt_drop_tmp;
DEALLOCATE PREPARE stmt_drop_tmp;

SET @create_partitioned := IF(
  @run_partition_migration = 1,
  'CREATE TABLE locations_partitioned_tmp (
      id INT NOT NULL AUTO_INCREMENT,
      bus_id INT NOT NULL,
      latitude DECIMAL(9, 6) NOT NULL,
      longitude DECIMAL(9, 6) NOT NULL,
      speed_kmh DECIMAL(6, 2) DEFAULT 0,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, timestamp),
      INDEX idx_bus_time (bus_id, timestamp),
      INDEX idx_location_latest (bus_id, timestamp DESC)
    )
    PARTITION BY RANGE COLUMNS(timestamp) (
      PARTITION p2026_01 VALUES LESS THAN (''2026-02-01''),
      PARTITION p2026_02 VALUES LESS THAN (''2026-03-01''),
      PARTITION p2026_03 VALUES LESS THAN (''2026-04-01''),
      PARTITION p2026_04 VALUES LESS THAN (''2026-05-01''),
      PARTITION p2026_05 VALUES LESS THAN (''2026-06-01''),
      PARTITION p2026_06 VALUES LESS THAN (''2026-07-01''),
      PARTITION p2026_07 VALUES LESS THAN (''2026-08-01''),
      PARTITION p2026_08 VALUES LESS THAN (''2026-09-01''),
      PARTITION p2026_09 VALUES LESS THAN (''2026-10-01''),
      PARTITION p2026_10 VALUES LESS THAN (''2026-11-01''),
      PARTITION p2026_11 VALUES LESS THAN (''2026-12-01''),
      PARTITION p2026_12 VALUES LESS THAN (''2027-01-01''),
      PARTITION p2027_01 VALUES LESS THAN (''2027-02-01''),
      PARTITION p2027_02 VALUES LESS THAN (''2027-03-01''),
      PARTITION p2027_03 VALUES LESS THAN (''2027-04-01''),
      PARTITION p2027_04 VALUES LESS THAN (''2027-05-01''),
      PARTITION p2027_05 VALUES LESS THAN (''2027-06-01''),
      PARTITION p2027_06 VALUES LESS THAN (''2027-07-01''),
      PARTITION p2027_07 VALUES LESS THAN (''2027-08-01''),
      PARTITION p2027_08 VALUES LESS THAN (''2027-09-01''),
      PARTITION p2027_09 VALUES LESS THAN (''2027-10-01''),
      PARTITION p2027_10 VALUES LESS THAN (''2027-11-01''),
      PARTITION p2027_11 VALUES LESS THAN (''2027-12-01''),
      PARTITION p2027_12 VALUES LESS THAN (''2028-01-01''),
      PARTITION pmax VALUES LESS THAN (MAXVALUE)
    )',
  'SELECT 1'
);
PREPARE stmt_create_partitioned FROM @create_partitioned;
EXECUTE stmt_create_partitioned;
DEALLOCATE PREPARE stmt_create_partitioned;

SET @copy_data := IF(
  @run_partition_migration = 1,
  'INSERT INTO locations_partitioned_tmp (id, bus_id, latitude, longitude, speed_kmh, timestamp)
   SELECT id, bus_id, latitude, longitude, speed_kmh, timestamp
   FROM locations
   ORDER BY id ASC',
  'SELECT 1'
);
PREPARE stmt_copy_data FROM @copy_data;
EXECUTE stmt_copy_data;
DEALLOCATE PREPARE stmt_copy_data;

SET @set_auto_increment := IF(
  @run_partition_migration = 1,
  'SET @next_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM locations_partitioned_tmp)',
  'SELECT 1'
);
PREPARE stmt_set_auto_increment FROM @set_auto_increment;
EXECUTE stmt_set_auto_increment;
DEALLOCATE PREPARE stmt_set_auto_increment;

SET @apply_auto_increment := IF(
  @run_partition_migration = 1,
  CONCAT('ALTER TABLE locations_partitioned_tmp AUTO_INCREMENT = ', @next_id),
  'SELECT 1'
);
PREPARE stmt_apply_auto_increment FROM @apply_auto_increment;
EXECUTE stmt_apply_auto_increment;
DEALLOCATE PREPARE stmt_apply_auto_increment;

SET @drop_old_backup := IF(
  @run_partition_migration = 1,
  'DROP TABLE IF EXISTS locations_unpartitioned_backup',
  'SELECT 1'
);
PREPARE stmt_drop_old_backup FROM @drop_old_backup;
EXECUTE stmt_drop_old_backup;
DEALLOCATE PREPARE stmt_drop_old_backup;

SET @swap_tables := IF(
  @run_partition_migration = 1,
  'RENAME TABLE locations TO locations_unpartitioned_backup,
                locations_partitioned_tmp TO locations',
  'SELECT 1'
);
PREPARE stmt_swap_tables FROM @swap_tables;
EXECUTE stmt_swap_tables;
DEALLOCATE PREPARE stmt_swap_tables;

-- MySQL does not support foreign keys on partitioned InnoDB tables.
-- Add trigger-based guards/cascade to preserve integrity behavior.
DROP TRIGGER IF EXISTS trg_locations_validate_bus_insert;
DROP TRIGGER IF EXISTS trg_locations_validate_bus_update;
DROP TRIGGER IF EXISTS trg_buses_delete_locations_cascade;

DELIMITER $$
CREATE TRIGGER trg_locations_validate_bus_insert
BEFORE INSERT ON locations
FOR EACH ROW
BEGIN
  IF (SELECT COUNT(*) FROM buses WHERE id = NEW.bus_id) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid bus_id for locations insert';
  END IF;
END$$

CREATE TRIGGER trg_locations_validate_bus_update
BEFORE UPDATE ON locations
FOR EACH ROW
BEGIN
  IF NEW.bus_id <> OLD.bus_id AND (SELECT COUNT(*) FROM buses WHERE id = NEW.bus_id) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid bus_id for locations update';
  END IF;
END$$

CREATE TRIGGER trg_buses_delete_locations_cascade
AFTER DELETE ON buses
FOR EACH ROW
BEGIN
  DELETE FROM locations WHERE bus_id = OLD.id;
END$$
DELIMITER ;
