-- Dhaka Bus Tracking System - Seed Data
-- ROUTE 1: Dhanmondi–Airport Express (15 stops)
-- 
-- This is a scalable, multi-route system.
-- You can add more routes in the future by:
-- 1. INSERT new route into routes table
-- 2. INSERT stops into bus_stops with route_id
-- 3. INSERT buses into buses table with route_id
-- 4. Buses will automatically start tracking via simulator
--
-- See ROUTES_BUSES_SCALING_GUIDE.md for complete setup instructions

USE dhaka_bus;

-- Clear existing data (safe during development)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tickets;
TRUNCATE TABLE trips;
TRUNCATE TABLE locations;
TRUNCATE TABLE bus_stops;
TRUNCATE TABLE buses;
TRUNCATE TABLE routes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- USERS - Demo accounts for authentication
-- ==========================================
-- Password for admin@dhakabus.com: admin123
-- Password for user@dhakabus.com: user123
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@dhakabus.com', '$2b$10$EWn/WPJkxGRndQuN6J9KA.pqyzICNCkqGeNEHuxpw03Fu4MmPh8S6', 'admin'),
('Demo User', 'user@dhakabus.com', '$2b$10$pJMO5xgbU/3a5bL2wpAtUeM8rQ/wJq3yQVqHJwYObh7q7Y5nN4wH2', 'user');

-- ==========================================
-- ROUTES - Single Route: Dhanmondi-Airport Express
-- ==========================================
INSERT INTO routes (route_name, start_point, end_point) VALUES
('Dhanmondi–Airport Express', 'Dhanmondi 27', 'Hazrat Shahjalal International Airport');

-- ==========================================
-- BUS_STOPS - 15 Ordered Stops with Real Dhaka Coordinates
-- ==========================================
-- Route runs from Dhanmondi through central Dhaka to Airport
INSERT INTO bus_stops (route_id, stop_name, latitude, longitude, stop_order) VALUES
-- Stop 1: Dhanmondi 27
(1, 'Dhanmondi 27', 23.7419, 90.3734, 1),

-- Stop 2: Dhanmondi 32
(1, 'Dhanmondi 32', 23.7445, 90.3780, 2),

-- Stop 3: Science Lab
(1, 'Science Lab', 23.7550, 90.3850, 3),

-- Stop 4: New Market
(1, 'New Market', 23.7620, 90.3912, 4),

-- Stop 5: Nilkhet
(1, 'Nilkhet', 23.7680, 90.3965, 5),

-- Stop 6: Shahbag
(1, 'Shahbag', 23.7745, 90.4023, 6),

-- Stop 7: Matsya Bhaban
(1, 'Matsya Bhaban', 23.7810, 90.4078, 7),

-- Stop 8: Kakrail
(1, 'Kakrail', 23.7890, 90.4145, 8),

-- Stop 9: Malibag
(1, 'Malibag', 23.8001, 90.4210, 9),

-- Stop 10: Rampura
(1, 'Rampura', 23.8089, 90.4278, 10),

-- Stop 11: Badda
(1, 'Badda', 23.8167, 90.4340, 11),

-- Stop 12: Notun Bazar
(1, 'Notun Bazar', 23.8245, 90.4390, 12),

-- Stop 13: Kuril Bishwa Road
(1, 'Kuril Bishwa Road', 23.8312, 90.4445, 13),

-- Stop 14: Khilkhet
(1, 'Khilkhet', 23.8378, 90.4500, 14),

-- Stop 15: Airport (Hazrat Shahjalal International Airport)
(1, 'Airport', 23.8433, 90.4066, 15);

-- ==========================================
-- BUSES - 10 Active Buses on the Same Route
-- ==========================================
INSERT INTO buses (name, route_id, capacity, status) VALUES
('Airport Express 1', 1, 40, 'active'),
('Airport Express 2', 1, 40, 'active'),
('Airport Express 3', 1, 40, 'active'),
('Airport Express 4', 1, 40, 'active'),
('Airport Express 5', 1, 40, 'active'),
('Airport Express 6', 1, 40, 'active'),
('Airport Express 7', 1, 40, 'active'),
('Airport Express 8', 1, 40, 'active'),
('Airport Express 9', 1, 40, 'active'),
('Airport Express 10', 1, 40, 'active');

-- ==========================================
-- ROUTE WAYPOINTS - Realistic road-based path
-- ==========================================
-- These waypoints follow actual Dhaka roads instead of straight lines
-- Each segment connects two consecutive stops

-- Segment 1: Dhanmondi 27 → Dhanmondi 32 (short segment)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 1, 2, 1, 23.7419, 90.3734),  -- Start at Dhanmondi 27
(1, 1, 2, 2, 23.7425, 90.3745),  -- Head east
(1, 1, 2, 3, 23.7432, 90.3760),  -- Continue east
(1, 1, 2, 4, 23.7445, 90.3780);  -- Arrive at Dhanmondi 32

-- Segment 2: Dhanmondi 32 → Science Lab (Shaheed Minar road)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 2, 3, 1, 23.7445, 90.3780),  -- Start at Dhanmondi 32
(1, 2, 3, 2, 23.7480, 90.3810),  -- Head north-east along Shaheed Minar road
(1, 2, 3, 3, 23.7515, 90.3835),  -- Continue north-east
(1, 2, 3, 4, 23.7550, 90.3850);  -- Arrive at Science Lab

-- Segment 3: Science Lab → New Market (continue on main road)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 3, 4, 1, 23.7550, 90.3850),  -- Start at Science Lab
(1, 3, 4, 2, 23.7575, 90.3875),  -- Head north-east
(1, 3, 4, 3, 23.7600, 90.3895),  -- Continue
(1, 3, 4, 4, 23.7620, 90.3912);  -- Arrive at New Market

-- Segment 4: New Market → Nilkhet (continue north)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 4, 5, 1, 23.7620, 90.3912),  -- Start at New Market
(1, 4, 5, 2, 23.7640, 90.3930),  -- Head north
(1, 4, 5, 3, 23.7660, 90.3950),  -- Continue north
(1, 4, 5, 4, 23.7680, 90.3965);  -- Arrive at Nilkhet

-- Segment 5: Nilkhet → Shahbag (via Nilkhet main road)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 5, 6, 1, 23.7680, 90.3965),  -- Start at Nilkhet
(1, 5, 6, 2, 23.7700, 90.3985),  -- Head north
(1, 5, 6, 3, 23.7722, 90.4005),  -- Continue north
(1, 5, 6, 4, 23.7745, 90.4023);  -- Arrive at Shahbag

-- Segment 6: Shahbag → Matsya Bhaban (move east on main road)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 6, 7, 1, 23.7745, 90.4023),  -- Start at Shahbag
(1, 6, 7, 2, 23.7765, 90.4045),  -- Head east
(1, 6, 7, 3, 23.7788, 90.4062),  -- Continue east
(1, 6, 7, 4, 23.7810, 90.4078);  -- Arrive at Matsya Bhaban

-- Segment 7: Matsya Bhaban → Kakrail (continue east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 7, 8, 1, 23.7810, 90.4078),  -- Start at Matsya Bhaban
(1, 7, 8, 2, 23.7845, 90.4105),  -- Head east
(1, 7, 8, 3, 23.7868, 90.4125),  -- Continue east
(1, 7, 8, 4, 23.7890, 90.4145);  -- Arrive at Kakrail

-- Segment 8: Kakrail → Malibag (move north-east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 8, 9, 1, 23.7890, 90.4145),  -- Start at Kakrail
(1, 8, 9, 2, 23.7935, 90.4165),  -- Head north-east
(1, 8, 9, 3, 23.7968, 90.4185),  -- Continue north-east
(1, 8, 9, 4, 23.8001, 90.4210);  -- Arrive at Malibag

-- Segment 9: Malibag → Rampura (continue east-north)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 9, 10, 1, 23.8001, 90.4210),  -- Start at Malibag
(1, 9, 10, 2, 23.8034, 90.4238),  -- Head east-north
(1, 9, 10, 3, 23.8062, 90.4258),  -- Continue
(1, 9, 10, 4, 23.8089, 90.4278);  -- Arrive at Rampura

-- Segment 10: Rampura → Badda (continue north-east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 10, 11, 1, 23.8089, 90.4278),  -- Start at Rampura
(1, 10, 11, 2, 23.8120, 90.4305),  -- Head north-east
(1, 10, 11, 3, 23.8143, 90.4325),  -- Continue
(1, 10, 11, 4, 23.8167, 90.4340);  -- Arrive at Badda

-- Segment 11: Badda → Notun Bazar (move north-east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 11, 12, 1, 23.8167, 90.4340),  -- Start at Badda
(1, 11, 12, 2, 23.8200, 90.4360),  -- Head north-east
(1, 11, 12, 3, 23.8223, 90.4375),  -- Continue
(1, 11, 12, 4, 23.8245, 90.4390);  -- Arrive at Notun Bazar

-- Segment 12: Notun Bazar → Kuril Bishwa Road (continue north-east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 12, 13, 1, 23.8245, 90.4390),  -- Start at Notun Bazar
(1, 12, 13, 2, 23.8268, 90.4410),  -- Head north-east
(1, 12, 13, 3, 23.8290, 90.4428),  -- Continue
(1, 12, 13, 4, 23.8312, 90.4445);  -- Arrive at Kuril Bishwa Road

-- Segment 13: Kuril Bishwa Road → Khilkhet (continue north-east)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 13, 14, 1, 23.8312, 90.4445),  -- Start at Kuril Bishwa Road
(1, 13, 14, 2, 23.8335, 90.4465),  -- Head north-east
(1, 13, 14, 3, 23.8356, 90.4483),  -- Continue
(1, 13, 14, 4, 23.8378, 90.4500);  -- Arrive at Khilkhet

-- Segment 14: Khilkhet → Airport (head west-north to airport)
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(1, 14, 15, 1, 23.8378, 90.4500),  -- Start at Khilkhet
(1, 14, 15, 2, 23.8412, 90.4350),  -- Head west-north towards airport
(1, 14, 15, 3, 23.8423, 90.4150),  -- Continue west
(1, 14, 15, 4, 23.8433, 90.4066);  -- Arrive at Airport

-- ==========================================
-- INITIAL LOCATIONS - Buses distributed across different stops for maximum coverage
-- Each bus starts at a different point along the route
-- ==========================================
INSERT INTO locations (bus_id, latitude, longitude, speed_kmh, timestamp) VALUES
-- Bus 1: Dhanmondi 27 (Stop 1)
(1, 23.7419, 90.3734, 0, NOW()),
-- Bus 2: Dhanmondi 32 (Stop 2)
(2, 23.7445, 90.3780, 0, NOW()),
-- Bus 3: Science Lab (Stop 3)
(3, 23.7550, 90.3850, 0, NOW()),
-- Bus 4: New Market (Stop 4)
(4, 23.7620, 90.3912, 0, NOW()),
-- Bus 5: Nilkhet (Stop 5)
(5, 23.7680, 90.3965, 0, NOW()),
-- Bus 6: Shahbag (Stop 6)
(6, 23.7745, 90.4023, 0, NOW()),
-- Bus 7: Matsya Bhaban (Stop 7)
(7, 23.7810, 90.4078, 0, NOW()),
-- Bus 8: Kakrail (Stop 8)
(8, 23.7890, 90.4145, 0, NOW()),
-- Bus 9: Malibag (Stop 9)
(9, 23.8001, 90.4210, 0, NOW()),
-- Bus 10: Rampura (Stop 10)
(10, 23.8089, 90.4278, 0, NOW());

-- ==========================================
-- TRIPS - Sample trips for booking
-- ==========================================
-- Today's trips (departure times distributed throughout the day)
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, fare, total_seats, status) VALUES
(1, 1, CONCAT(DATE(NOW()), ' 06:00:00'), CONCAT(DATE(NOW()), ' 07:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 08:00:00'), CONCAT(DATE(NOW()), ' 09:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 10:00:00'), CONCAT(DATE(NOW()), ' 11:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 12:00:00'), CONCAT(DATE(NOW()), ' 13:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 14:00:00'), CONCAT(DATE(NOW()), ' 15:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 16:00:00'), CONCAT(DATE(NOW()), ' 17:30:00'), 150.00, 40, 'scheduled'),
(1, 1, CONCAT(DATE(NOW()), ' 18:00:00'), CONCAT(DATE(NOW()), ' 19:30:00'), 150.00, 40, 'scheduled');

-- ==========================================
-- SAMPLE TICKETS (optional - for testing)
-- ==========================================
-- User books seats on first trip
INSERT INTO tickets (user_id, trip_id, seat_numbers, passenger_name, total_price, status) VALUES
(2, 1, '[1, 2, 3]', 'Ahmed Hassan', 450.00, 'active'),
(2, 1, '[15, 16]', 'Fatima Khan', 300.00, 'active');
