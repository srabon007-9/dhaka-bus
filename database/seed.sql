-- Dhaka Bus Tracking System - Sample Data (Seed)
-- This file populates the database with realistic Dhaka bus routes and data

USE dhaka_bus;

-- Clear existing data (safe during development)
DELETE FROM locations;
DELETE FROM buses;
DELETE FROM routes;

-- ==========================================
-- ROUTES - Define major bus routes in Dhaka
-- ==========================================

-- Route 1: Gulshan to Motijheel
INSERT INTO routes (route_name, coordinates) VALUES (
  'Gulshan to Motijheel',
  '[[23.8103, 90.4189], [23.8090, 90.4167], [23.8045, 90.4123], [23.7980, 90.4056], [23.7890, 90.3956], [23.7712, 90.3823]]'
);

-- Route 2: Dhanmondi to Kawran Bazar
INSERT INTO routes (route_name, coordinates) VALUES (
  'Dhanmondi to Kawran Bazar',
  '[[23.7419, 90.3734], [23.7450, 90.3750], [23.7580, 90.3834], [23.7723, 90.3890], [23.7890, 90.3945], [23.8012, 90.3978]]'
);

-- Route 3: Mirpur to Sadarghat
INSERT INTO routes (route_name, coordinates) VALUES (
  'Mirpur to Sadarghat',
  '[[23.8244, 90.3656], [23.8212, 90.3712], [23.8156, 90.3778], [23.8045, 90.3889], [23.7834, 90.3945], [23.7623, 90.3934]]'
);

-- Route 4: Airport to Farmgate
INSERT INTO routes (route_name, coordinates) VALUES (
  'Airport to Farmgate',
  '[[23.8433, 90.4066], [23.8367, 90.4023], [23.8256, 90.3934], [23.8123, 90.3856], [23.7945, 90.3834], [23.7712, 90.3834]]'
);

-- Route 5: Uttara to Shahbag
INSERT INTO routes (route_name, coordinates) VALUES (
  'Uttara to Shahbag',
  '[[23.8756, 90.4089], [23.8645, 90.4045], [23.8534, 90.4000], [23.8390, 90.3945], [23.8256, 90.3912], [23.8100, 90.3890]]'
);

-- ==========================================
-- BUSES - Create buses for each route
-- ==========================================

-- Buses on Route 1: Gulshan to Motijheel
INSERT INTO buses (name, route_name, start_point, end_point) VALUES
('Bus 25A', 'Gulshan to Motijheel', 'Gulshan Circle', 'Motijheel'),
('Bus 25B', 'Gulshan to Motijheel', 'Gulshan Circle', 'Motijheel'),
('Bus 32', 'Gulshan to Motijheel', 'Gulshan Circle', 'Motijheel');

-- Buses on Route 2: Dhanmondi to Kawran Bazar
INSERT INTO buses (name, route_name, start_point, end_point) VALUES
('Bus 41', 'Dhanmondi to Kawran Bazar', 'Dhanmondi Lake', 'Kawran Bazar'),
('Bus 42', 'Dhanmondi to Kawran Bazar', 'Dhanmondi Lake', 'Kawran Bazar');

-- Buses on Route 3: Mirpur to Sadarghat
INSERT INTO buses (name, route_name, start_point, end_point) VALUES
('Bus 50', 'Mirpur to Sadarghat', 'Mirpur 10', 'Sadarghat'),
('Bus 51', 'Mirpur to Sadarghat', 'Mirpur 10', 'Sadarghat'),
('Bus 52', 'Mirpur to Sadarghat', 'Mirpur 10', 'Sadarghat');

-- Buses on Route 4: Airport to Farmgate
INSERT INTO buses (name, route_name, start_point, end_point) VALUES
('Bus 65', 'Airport to Farmgate', 'Hazrat Shahjalal Airport', 'Farmgate'),
('Bus 66', 'Airport to Farmgate', 'Hazrat Shahjalal Airport', 'Farmgate');

-- Buses on Route 5: Uttara to Shahbag
INSERT INTO buses (name, route_name, start_point, end_point) VALUES
('Bus 77', 'Uttara to Shahbag', 'Uttara Sector 7', 'Shahbag'),
('Bus 78', 'Uttara to Shahbag', 'Uttara Sector 7', 'Shahbag');

-- ==========================================
-- LOCATIONS - Live bus positions
-- These are simulated GPS locations for buses
-- ==========================================

-- Bus 25A at Gulshan
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(1, 23.8103, 90.4189),
(1, 23.8095, 90.4175);

-- Bus 25B between Gulshan and Motijheel
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(2, 23.8000, 90.4050),
(2, 23.7989, 90.4030);

-- Bus 32 near Motijheel
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(3, 23.7712, 90.3823),
(3, 23.7690, 90.3810);

-- Bus 41 at Dhanmondi
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(4, 23.7419, 90.3734),
(4, 23.7435, 90.3748);

-- Bus 42 moving towards Kawran Bazar
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(5, 23.7723, 90.3890),
(5, 23.7756, 90.3912);

-- Bus 50 at Mirpur
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(6, 23.8244, 90.3656),
(6, 23.8230, 90.3670);

-- Bus 51 between Mirpur and Sadarghat
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(7, 23.8045, 90.3889),
(7, 23.8020, 90.3910);

-- Bus 52 near Sadarghat
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(8, 23.7623, 90.3934),
(8, 23.7610, 90.3920);

-- Bus 65 at Airport
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(9, 23.8433, 90.4066),
(9, 23.8420, 90.4055);

-- Bus 66 approaching Farmgate
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(10, 23.7712, 90.3834),
(10, 23.7695, 90.3825);

-- Bus 77 at Uttara
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(11, 23.8756, 90.4089),
(11, 23.8740, 90.4100);

-- Bus 78 moving towards Shahbag
INSERT INTO locations (bus_id, latitude, longitude) VALUES
(12, 23.8100, 90.3890),
(12, 23.8080, 90.3875);
