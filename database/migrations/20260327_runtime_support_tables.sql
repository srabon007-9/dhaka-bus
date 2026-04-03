USE dhaka_bus;

CREATE TABLE IF NOT EXISTS manual_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'bdt',
  payment_method ENUM('bkash', 'nagad', 'both') NOT NULL,
  booking_payload JSON NOT NULL,
  status ENUM('pending', 'verified', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
  payment_details JSON NULL,
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 30 MINUTE)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS nagad_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_ref_id VARCHAR(50) UNIQUE NOT NULL,
  merchant_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'bdt',
  booking_payload JSON NOT NULL,
  user_id INT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  booking_payload JSON NOT NULL,
  amount_expected DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'bdt',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  ticket_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SET @idx_mp_status_expires_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'manual_payments'
    AND INDEX_NAME = 'idx_manual_payments_status_expires'
);
SET @add_idx_mp_status_expires := IF(
  @idx_mp_status_expires_exists = 0,
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
  @idx_mp_user_status_created_exists = 0,
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
  @idx_mp_method_status_exists = 0,
  'CREATE INDEX idx_manual_payments_method_status ON manual_payments(payment_method, status)',
  'SELECT 1'
);
PREPARE stmt_add_idx_mp_method_status FROM @add_idx_mp_method_status;
EXECUTE stmt_add_idx_mp_method_status;
DEALLOCATE PREPARE stmt_add_idx_mp_method_status;

SET @idx_payment_sessions_user_status_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payment_sessions'
    AND INDEX_NAME = 'idx_payment_sessions_user_status'
);
SET @add_idx_payment_sessions_user_status := IF(
  @idx_payment_sessions_user_status_exists = 0,
  'CREATE INDEX idx_payment_sessions_user_status ON payment_sessions(user_id, status)',
  'SELECT 1'
);
PREPARE stmt_add_idx_payment_sessions_user_status FROM @add_idx_payment_sessions_user_status;
EXECUTE stmt_add_idx_payment_sessions_user_status;
DEALLOCATE PREPARE stmt_add_idx_payment_sessions_user_status;

SET @idx_password_reset_user_expires_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'password_reset_tokens'
    AND INDEX_NAME = 'idx_password_reset_user_expires'
);
SET @add_idx_password_reset_user_expires := IF(
  @idx_password_reset_user_expires_exists = 0,
  'CREATE INDEX idx_password_reset_user_expires ON password_reset_tokens(user_id, expires_at)',
  'SELECT 1'
);
PREPARE stmt_add_idx_password_reset_user_expires FROM @add_idx_password_reset_user_expires;
EXECUTE stmt_add_idx_password_reset_user_expires;
DEALLOCATE PREPARE stmt_add_idx_password_reset_user_expires;
