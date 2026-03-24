# Adding Routes & Buses - Scalable Setup Guide

## Current Setup

Your system is already set up for multiple routes! Currently configured with:
- **Route 1**: Dhanmondi–Airport Express (15 stops, 10 buses)

## How to Add a New Route

### Step 1: Insert Route into Database

```sql
INSERT INTO routes (route_name, start_point, end_point) VALUES
('Route Name Here', 'Start Location', 'End Location');
```

**Example - Add Route 2:**
```sql
INSERT INTO routes (route_name, start_point, end_point) VALUES
('Mirpur–Motijheel Express', 'Mirpur 1', 'Motijheel');
```

Check the new route ID:
```sql
SELECT id, route_name FROM routes;
```

### Step 2: Add Bus Stops for the Route

```sql
INSERT INTO bus_stops (route_id, stop_name, latitude, longitude, stop_order) VALUES
(2, 'Stop 1 Name', 23.8103, 90.3797, 1),
(2, 'Stop 2 Name', 23.8150, 90.3850, 2),
(2, 'Stop 3 Name', 23.8200, 90.3900, 3),
... more stops ...
(2, 'Final Stop', 23.8300, 90.4000, 10);
```

**Requirements:**
- `route_id` must match your new route ID
- `stop_order` must be sequential (1, 2, 3, ...)
- `latitude` and `longitude` must be valid Dhaka coordinates

### Step 3: Add Route Waypoints (Optional but Recommended)

Waypoints are the actual road geometry between stops (not just straight lines).

```sql
INSERT INTO route_waypoints (route_id, stop_from_order, stop_to_order, waypoint_sequence, latitude, longitude) VALUES
(2, 1, 2, 1, 23.8103, 90.3797),  -- Start at stop 1
(2, 1, 2, 2, 23.8115, 90.3820),  -- Intermediate point
(2, 1, 2, 3, 23.8150, 90.3850);  -- End at stop 2
-- Repeat for all stop segments
```

### Step 4: Assign Buses to the Route

```sql
INSERT INTO buses (name, route_id, capacity, status) VALUES
('Route 2 Bus 1', 2, 40, 'active'),
('Route 2 Bus 2', 2, 40, 'active'),
('Route 2 Bus 3', 2, 40, 'active');
```

**Alternatively, transfer existing buses:**
```sql
UPDATE buses SET route_id = 2 WHERE id IN (11, 12, 13);
```

### Step 5: Initialize Locations for New Buses

```sql
INSERT INTO locations (bus_id, latitude, longitude, speed_kmh, timestamp) VALUES
(11, 23.8103, 90.3797, 0, NOW()),  -- Bus 11 at Route 2 Stop 1
(12, 23.8150, 90.3850, 0, NOW()),  -- Bus 12 at Route 2 Stop 2
(13, 23.8200, 90.3900, 0, NOW());  -- Bus 13 at Route 2 Stop 3
```

---

## Database Relationships (Scalable Design)

```
routes (1) ──────────┬─→ buses (many)
                     │
                     ├─→ bus_stops (many)
                     │
                     └─→ route_waypoints (many)

buses (1) ─────────→ locations (many)
```

**Benefits:**
- ✅ Each route has its own stops & waypoints
- ✅ Buses can be reassigned to different routes
- ✅ No limit on number of routes or buses
- ✅ CASCADE DELETE ensures data consistency

---

## API Endpoints (Available Now)

### Get All Routes
```
GET /api/routes
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "route_name": "Dhanmondi–Airport Express",
      "start_point": "Dhanmondi 27",
      "end_point": "Hazrat Shahjalal International Airport",
      "created_at": "2026-03-24T17:15:42.000Z"
    }
  ]
}
```

### Get Buses by Route
```
GET /api/buses?route_id=1
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Airport Express 1",
      "route_id": 1,
      "capacity": 40,
      "status": "active"
    },
    ... 9 more buses
  ]
}
```

### Get All Bus Stops for Route
```
GET /api/stops?route_id=1
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "stop_name": "Dhanmondi 27",
      "stop_order": 1,
      "latitude": "23.7419",
      "longitude": "90.3734"
    },
    ... 14 more stops
  ]
}
```

### Get Live Locations for Route
```
GET /api/locations?route_id=1
```

---

## Scaling Strategy

### Phase 1 (Current): 1 Route, 10 Buses ✅
- Route 1: Dhanmondi–Airport (single direction)
- 10 buses distributed across stops
- ~18,000 location records/hour

### Phase 2: Add More Routes
```
Route 2: Mirpur–Motijheel (5 buses)
Route 3: Gulshan–Demra (8 buses)
Route 4: Uttara–Motijheel (6 buses)
Total: 29 buses across 4 routes
```

### Phase 3: Two-Way Routes (Bidirectional)
Currently: Buses travel 1 → 15
Future: Add return buses 15 → 1
```
Route 1A: Dhanmondi → Airport (5 buses)
Route 1B: Airport → Dhanmondi (5 buses)
Total: 10 buses, same stops, different direction
```

### Phase 4: Load Balancing
- Separate database by route for sharding
- Caching for frequently queried routes
- CDN for static stop data

---

## Complete Example: Adding Route 2

### SQL Script
```sql
-- Insert new route
INSERT INTO routes (route_name, start_point, end_point) VALUES
('Mirpur–Motijheel Express', 'Mirpur 1', 'Motijheel');

-- Get the new route ID (should be 2)
-- Use SELECT LAST_INSERT_ID(); or SELECT MAX(id) FROM routes;

-- Add 10 stops for Route 2
INSERT INTO bus_stops (route_id, stop_name, latitude, longitude, stop_order) VALUES
(2, 'Mirpur 1', 23.8103, 90.3797, 1),
(2, 'Mirpur 2', 23.8120, 90.3820, 2),
(2, 'Mirpur 12', 23.8150, 90.3850, 3),
(2, 'Kazipara', 23.8200, 90.3900, 4),
(2, 'Shyamoli', 23.8250, 90.3950, 5),
(2, 'Karwan Bazar', 23.7950, 90.3800, 6),
(2, 'Kawran Bazar', 23.7900, 90.3750, 7),
(2, 'Paltan', 23.7850, 90.3700, 8),
(2, 'Motijheel', 23.7800, 90.3650, 9),
(2, 'Purana Paltan', 23.7750, 90.3600, 10);

-- Add 5 buses to Route 2
INSERT INTO buses (name, route_id, capacity, status) VALUES
('Mirpur Express 1', 2, 40, 'active'),
('Mirpur Express 2', 2, 40, 'active'),
('Mirpur Express 3', 2, 40, 'active'),
('Mirpur Express 4', 2, 40, 'active'),
('Mirpur Express 5', 2, 40, 'active');

-- Initial locations for Route 2 buses (distributed across stops)
INSERT INTO locations (bus_id, latitude, longitude, speed_kmh, timestamp) VALUES
(11, 23.8103, 90.3797, 0, NOW()),  -- Bus 11 at Stop 1
(12, 23.8150, 90.3850, 0, NOW()),  -- Bus 12 at Stop 3
(13, 23.8200, 90.3900, 0, NOW()),  -- Bus 13 at Stop 4
(14, 23.7950, 90.3800, 0, NOW()),  -- Bus 14 at Stop 6
(15, 23.7750, 90.3600, 0, NOW());  -- Bus 15 at Stop 10
```

### Backend Changes (Automatic)
The simulator will automatically:
1. Detect new buses via route_id
2. Fetch stops for the route
3. Initialize movement simulation
4. Start broadcasting live locations

No code changes needed! ✅

---

## Database Integrity

### Constraints Enforcing Scalability
```sql
-- Can't add bus without valid route
FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE

-- Can't add stop without valid route
FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE

-- Can't track location without valid bus
FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE

-- If route deleted: all buses, stops, locations deleted automatically
```

---

## Querying Multiple Routes

### Get summary of all routes
```sql
SELECT 
  r.id,
  r.route_name,
  COUNT(DISTINCT b.id) as bus_count,
  COUNT(DISTINCT bs.id) as stop_count
FROM routes r
LEFT JOIN buses b ON r.id = b.route_id
LEFT JOIN bus_stops bs ON r.id = bs.route_id
GROUP BY r.id;
```

### Get buses currently active
```sql
SELECT b.id, b.name, r.route_name, COUNT(l.id) as location_records
FROM buses b
JOIN routes r ON b.route_id = r.id
LEFT JOIN locations l ON b.id = l.bus_id
WHERE b.status = 'active'
GROUP BY b.id
ORDER BY r.id, b.id;
```

### Get latest position of all buses for all routes
```sql
SELECT 
  r.route_name,
  b.name,
  l.latitude,
  l.longitude,
  l.speed_kmh,
  l.timestamp
FROM locations l
JOIN buses b ON l.bus_id = b.id
JOIN routes r ON b.route_id = r.id
WHERE l.timestamp = (
  SELECT MAX(timestamp) FROM locations l2 WHERE l2.bus_id = l.bus_id
)
ORDER BY r.id, b.id;
```

---

## Future Enhancement: Route Management API

```javascript
// POST /api/routes
// Body: { route_name, start_point, end_point }
// Creates new route

// PUT /api/routes/:id
// Updates route metadata

// DELETE /api/routes/:id
// Deletes route (cascade deletes all buses, stops, locations)

// POST /api/routes/:routeId/buses
// Add bus to specific route

// POST /api/routes/:routeId/stops
// Add stop to specific route
```

---

## Current System State (After Setup)

| Item | Quantity | Status |
|------|----------|--------|
| Routes | 1 | Active |
| Buses | 10 | All distributed |
| Stops/Route | 15 | All configured |
| Daily Locations | 432K | Growing |
| Capacity (Routes) | ∞ | Unlimited |
| Capacity (Buses/Route) | ∞ | Unlimited |

✅ **Ready to scale!**
