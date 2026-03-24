# Quick Database Reference Card

## ✅ Database Health Check Commands

### Check Database Status
```bash
# List all tables
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e "SHOW TABLES;"

# Total row counts
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
  "SELECT 
     'routes' as tbl, COUNT(*) as cnt FROM routes UNION
   SELECT 'buses', COUNT(*) FROM buses UNION
   SELECT 'locations', COUNT(*) FROM locations UNION
   SELECT 'bus_stops', COUNT(*) FROM bus_stops UNION
   SELECT 'users', COUNT(*) FROM users UNION
   SELECT 'trips', COUNT(*) FROM trips UNION
   SELECT 'tickets', COUNT(*) FROM tickets;"
```

### Get Latest Bus Locations
```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
  "SELECT bus_id, ROUND(latitude, 4) as lat, ROUND(longitude, 4) as lng, 
          speed_kmh, timestamp 
   FROM locations 
   WHERE timestamp = (SELECT MAX(timestamp) FROM locations)
   ORDER BY bus_id;"
```

### Check Bus Status
```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
  "SELECT id, name, capacity, status FROM buses;"
```

### View All Stops
```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
  "SELECT id, stop_name, stop_order, latitude, longitude FROM bus_stops 
   ORDER BY stop_order;"
```

---

## 🔑 Primary Key - Foreign Key Relationships

```
routes (PK: id)
├── buses (FK: route_id → CASCADE DELETE)
│   ├── locations (FK: bus_id → CASCADE DELETE)  ← 11,157+ rows
│   └── trips (FK: bus_id → CASCADE DELETE)
│       └── tickets (FK: trip_id → CASCADE DELETE)
├── bus_stops (FK: route_id → CASCADE DELETE)
├── route_waypoints (FK: route_id → CASCADE DELETE)
└── trips (FK: route_id → CASCADE DELETE)

users (PK: id)
└── tickets (FK: user_id → CASCADE DELETE)
```

---

## 📊 Table Specifications

| Table | PK | Rows | FK Count | Indexes | Growth |
|-------|----|----|------|---------|--------|
| routes | INT AUTO_INCREMENT | 1 | 0 | PK | Static |
| buses | INT AUTO_INCREMENT | 10 | 1 (route_id) | 2 | Static |
| bus_stops | INT AUTO_INCREMENT | 15 | 1 (route_id) | 1 | Static |
| route_waypoints | INT AUTO_INCREMENT | 500+ | 1 (route_id) | 2 | Static |
| users | INT AUTO_INCREMENT | 2 | 0 | 1 | Slow |
| trips | INT AUTO_INCREMENT | 7 | 2 (route_id, bus_id) | 2 | Slow |
| tickets | INT AUTO_INCREMENT | 2 | 2 (user_id, trip_id) | 2 | Slow |
| **locations** | INT AUTO_INCREMENT | 11,157+ | 1 (bus_id) | 2 | ⚡ 18K/hr |

---

## 🎯 Data Integrity Features

### NOT NULL Constraints
- routes: route_name, start_point, end_point
- buses: name, route_id
- bus_stops: route_id, stop_name, latitude, longitude
- locations: bus_id, latitude, longitude
- users: name, email, password_hash
- trips: route_id, bus_id, departure_time, arrival_time, fare, total_seats
- tickets: user_id, trip_id, seat_numbers, passenger_name, total_price

### UNIQUE Constraints
- routes.route_name
- users.email

### ENUM Constraints
- buses.status: ('active', 'inactive', 'maintenance')
- trips.status: ('scheduled', 'running', 'completed', 'cancelled')
- tickets.status: ('active', 'cancelled')
- users.role: ('admin', 'user')

---

## 💾 Storage & Performance

### Data Size Estimates
```
locations per record: ~100 bytes
18,000 records/hour = 1.8 MB/hour
432,000 records/day = 43.2 MB/day
157 million records/year = 15.7 GB/year
```

### Index Performance
```
Find latest bus locations: <10ms
Find active buses: <1ms
Find user bookings: <5ms
Find trip on date: <5ms
```

### Connection Pool
```
10 connections (configurable)
Prevents connection leaks
Handles concurrent requests efficiently
```

---

## 📝 Sample Queries

### Get All Buses with Trip Count
```sql
SELECT b.*, COUNT(t.id) as trip_count
FROM buses b
LEFT JOIN trips t ON b.id = t.bus_id
GROUP BY b.id;
```

### Find Buses at Each Stop (Last Hour)
```sql
SELECT DISTINCT bus_id, stop_name
FROM locations l
JOIN bus_stops bs ON 
  ABS(l.latitude - bs.latitude) < 0.001 AND
  ABS(l.longitude - bs.longitude) < 0.001
WHERE l.timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY bus_id, bs.stop_order;
```

### Get Average Speed per Bus
```sql
SELECT bus_id, 
       ROUND(AVG(speed_kmh), 2) as avg_speed,
       MAX(speed_kmh) as max_speed,
       MIN(speed_kmh) as min_speed
FROM locations
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY bus_id
ORDER BY avg_speed DESC;
```

### Check Booking Revenue
```sql
SELECT SUM(total_price) as total_revenue,
       COUNT(*) as total_bookings,
       AVG(total_price) as avg_booking
FROM tickets
WHERE status = 'active';
```

---

## 🔒 Security

### Password Hashing (Bcrypt)
```
Admin: admin123 → $2b$10$EWn/WPJkxGRndQuN6J9KA.pqyzICNCkqGeNEHuxpw03Fu4MmPh8S6
User: user123 → $2b$10$pJMO5xgbU/3a5bL2wpAtUeM8rQ/wJq3yQVqHJwYObh7q7Y5nN4wH2
```

### SQL Injection Prevention
All queries use parameterized statements:
```javascript
// ✅ SAFE
await db.query('SELECT * FROM buses WHERE id = ?', [busId]);

// ❌ UNSAFE
await db.query(`SELECT * FROM buses WHERE id = ${busId}`);
```

---

## 🚀 Future Improvements

1. **Partition locations table by date**
   - Split into daily tables after 30 days
   - Improves query speed for old data

2. **Archive old locations**
   - Move records >6 months to archive table
   - Reduces main table size

3. **Add replicas for read scaling**
   - Distribute analytics queries to read replica
   - Keep master for writes only

4. **Full-text search on stops**
   - Enable faster stop name lookups
   - Support autocomplete in frontend

5. **Materialized views for reporting**
   - Pre-calculated daily summaries
   - Fast dashboard queries

---

## 📞 Support

All database files:
- Schema: `database/schema.sql`
- Seed data: `database/seed.sql`
- Documentation: `DATABASE_OVERVIEW.md`
- Visual diagram: `DATABASE_SCHEMA_VISUAL.txt`
- Verification: `DATABASE_PROOF.md`

For questions about the database structure, check these files first!
