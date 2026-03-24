-- Dhaka Bus Tracking System - Database Schema
-- This file creates all tables needed for the application

-- Create the main database
CREATE DATABASE IF NOT EXISTS dhaka_bus;
USE dhaka_bus;

-- Table 1: Routes
-- Stores all bus routes (simplified - just metadata)
CREATE TABLE IF NOT EXISTS routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(255) NOT NULL UNIQUE,
  start_point VARCHAR(100) NOT NULL,
  end_point VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 1.5: Bus Stops
-- Stores ordered stops along a route with coordinates
CREATE TABLE IF NOT EXISTS bus_stops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  stop_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  stop_order INT NOT NULL, -- Order of stop along route
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_id (route_id),
  INDEX idx_stop_order (stop_order)
);

-- Table 1.6: Route Waypoints
-- Stores detailed waypoints that follow actual roads between stops
-- Allows realistic road-based bus movement instead of straight lines
CREATE TABLE IF NOT EXISTS route_waypoints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  stop_from_order INT NOT NULL, -- Starting stop order
  stop_to_order INT NOT NULL, -- Ending stop order
  waypoint_sequence INT NOT NULL, -- Order within this segment
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_segment (route_id, stop_from_order, stop_to_order),
  INDEX idx_route_waypoint (route_id, waypoint_sequence)
);

-- Table 2: Buses
-- Stores information about each bus
CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL, -- Bus name/number (e.g., "Airport Express 1")
  route_id INT NOT NULL, -- Foreign key to routes table
  capacity INT DEFAULT 40, -- Number of seats
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_id (route_id),
  INDEX idx_status (status)
);

-- Table 3: Locations
-- Stores GPS locations of buses (real-time or simulated)
-- This table can grow large, so in production you'd archive old data
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL, -- -90 to 90
  longitude DECIMAL(9, 6) NOT NULL, -- -180 to 180
  speed_kmh DECIMAL(6, 2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_bus_time (bus_id, timestamp) -- For faster queries
);

-- Create indexes for better query performance
CREATE INDEX idx_bus_route ON buses(route_id);
CREATE INDEX idx_location_latest ON locations(bus_id, timestamp DESC);

-- Table 4: Users
-- Authentication users (admin and regular users)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Trips
-- A scheduled departure of a bus on a route
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

-- Table 6: Tickets
-- Bookings created by users against a trip
CREATE TABLE IF NOT EXISTS tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  seat_numbers JSON NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE INDEX idx_trip_route ON trips(route_id, departure_time);
CREATE INDEX idx_trip_bus ON trips(bus_id);
CREATE INDEX idx_ticket_user ON tickets(user_id, created_at DESC);
