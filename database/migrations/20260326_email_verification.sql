USE dhaka_bus;

SET @verified_col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email_verified_at'
);

SET @token_col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'verification_token_hash'
);

SET @expires_col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'verification_expires_at'
);

SET @add_verified_col := IF(
  @verified_col_exists = 0,
  'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER role',
  'SELECT 1'
);
PREPARE stmt_verified_col FROM @add_verified_col;
EXECUTE stmt_verified_col;
DEALLOCATE PREPARE stmt_verified_col;

SET @add_token_col := IF(
  @token_col_exists = 0,
  'ALTER TABLE users ADD COLUMN verification_token_hash VARCHAR(128) NULL AFTER email_verified_at',
  'SELECT 1'
);
PREPARE stmt_token_col FROM @add_token_col;
EXECUTE stmt_token_col;
DEALLOCATE PREPARE stmt_token_col;

SET @add_expires_col := IF(
  @expires_col_exists = 0,
  'ALTER TABLE users ADD COLUMN verification_expires_at DATETIME NULL AFTER verification_token_hash',
  'SELECT 1'
);
PREPARE stmt_expires_col FROM @add_expires_col;
EXECUTE stmt_expires_col;
DEALLOCATE PREPARE stmt_expires_col;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, NOW())
WHERE email IN ('admin@dhakabus.com', 'user@dhakabus.com');
