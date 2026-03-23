-- Dhaka Bus Tracking System - Database Schema
-- This file creates all tables needed for the application

-- Create the main database
CREATE DATABASE IF NOT EXISTS dhaka_bus;
USE dhaka_bus;

-- Table 1: Routes
-- Stores all bus routes with their path coordinates
-- Example: Gulshan to Motijheel route with waypoints
CREATE TABLE IF NOT EXISTS routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(255) NOT NULL UNIQUE,
  coordinates JSON NOT NULL, -- Stores array of [lat, lng] pairs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Buses
-- Stores information about each bus
CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL, -- Bus name/number (e.g., "Bus 25A")
  route_name VARCHAR(255) NOT NULL,
  start_point VARCHAR(100) NOT NULL, -- Starting location
  end_point VARCHAR(100) NOT NULL, -- Ending location
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_name) REFERENCES routes(route_name) ON DELETE CASCADE
);

-- Table 3: Locations
-- Stores GPS locations of buses (real-time or simulated)
-- This table can grow large, so in production you'd archive old data
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL, -- -90 to 90
  longitude DECIMAL(9, 6) NOT NULL, -- -180 to 180
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_bus_time (bus_id, timestamp) -- For faster queries
);

-- Create indexes for better query performance
CREATE INDEX idx_bus_name ON buses(name);
CREATE INDEX idx_route_name ON buses(route_name);
CREATE INDEX idx_location_latest ON locations(bus_id, timestamp DESC);
