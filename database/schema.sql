-- Core schema for the Dhaka Bus system

CREATE DATABASE IF NOT EXISTS dhaka_bus;
USE dhaka_bus;

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(255) NOT NULL UNIQUE,
  start_point VARCHAR(100) NOT NULL,
  end_point VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stops per route in travel order
CREATE TABLE IF NOT EXISTS bus_stops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  stop_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  stop_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_id (route_id),
  INDEX idx_stop_order (stop_order)
);

-- Waypoints between stops for road-following movement
CREATE TABLE IF NOT EXISTS route_waypoints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  stop_from_order INT NOT NULL,
  stop_to_order INT NOT NULL,
  waypoint_sequence INT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_segment (route_id, stop_from_order, stop_to_order),
  INDEX idx_route_waypoint (route_id, waypoint_sequence)
);

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  route_id INT NOT NULL,
  capacity INT DEFAULT 40,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_id (route_id),
  INDEX idx_status (status)
);

-- Live/simulated location history for buses
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  speed_kmh DECIMAL(6, 2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_bus_time (bus_id, timestamp)
);

-- Extra indexes for common lookups
CREATE INDEX idx_bus_route ON buses(route_id);
CREATE INDEX idx_location_latest ON locations(bus_id, timestamp DESC);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  email_verified_at DATETIME NULL,
  verification_token_hash VARCHAR(128) NULL,
  verification_expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled trips
CREATE TABLE IF NOT EXISTS trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  bus_id INT NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  fare DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_seats INT NOT NULL DEFAULT 40,
  status ENUM('scheduled', 'running', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  boarding_stop_id INT NOT NULL,
  dropoff_stop_id INT NOT NULL,
  seat_numbers JSON NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (boarding_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (dropoff_stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT
);

-- Offline/manual payment attempts
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
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_manual_payments_status_expires (status, expires_at),
  INDEX idx_manual_payments_user_status_created (user_id, status, created_at),
  INDEX idx_manual_payments_method_status (payment_method, status)
);

-- Nagad gateway payment attempts
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_nagad_payments_user_id (user_id)
);

-- Checkout sessions before ticket creation
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
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  INDEX idx_payment_sessions_user_status (user_id, status)
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_user_expires (user_id, expires_at)
);

-- Per-seat passenger records per ticket
CREATE TABLE IF NOT EXISTS ticket_seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  seat_number INT NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ticket_seat (ticket_id, seat_number),
  INDEX idx_ticket_seats_ticket (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Boarding and alighting logs by stop
CREATE TABLE IF NOT EXISTS passenger_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  trip_id INT NOT NULL,
  stop_id INT NOT NULL,
  seat_number INT NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  event_type ENUM('board', 'alight') NOT NULL,
  event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recorded_by_user_id INT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_passenger_events_trip_stop (trip_id, stop_id, event_time),
  INDEX idx_passenger_events_ticket_seat (ticket_id, seat_number, event_time),
  INDEX idx_passenger_events_recorded_by_user (recorded_by_user_id),
  UNIQUE KEY uq_passenger_event_stop (ticket_id, seat_number, stop_id, event_type),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_trip_route ON trips(route_id, departure_time);
CREATE INDEX idx_trip_bus ON trips(bus_id);
CREATE INDEX idx_ticket_user ON tickets(user_id, created_at DESC);
CREATE INDEX idx_ticket_trip_segment ON tickets(trip_id, boarding_stop_id, dropoff_stop_id, status);
