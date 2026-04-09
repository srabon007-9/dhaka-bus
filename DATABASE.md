# Database Guide

This project uses MySQL and is designed around real relational data.

## What is stored

Main tables:
- `routes`
- `bus_stops`
- `route_waypoints`
- `buses`
- `locations`
- `users`
- `trips`
- `tickets`
- `ticket_seats`
- `manual_payments`
- `nagad_payments`
- `payment_sessions`
- `password_reset_tokens`
- `passenger_events`

Main relationship flow:
- `routes -> buses -> locations`
- `routes -> trips -> tickets -> ticket_seats`
- `users -> tickets`
- `users -> manual_payments`

The schema uses foreign keys, indexes, and status enums.

## Why this is a database project

- Primary key on every table
- Foreign key constraints with clear delete behavior
- Indexed columns for common queries
- Separate tables for booking, payment, and passenger events
- Migration files for controlled database changes

## Local database setup

When you run Docker for the first time, these files initialize the local database:
- `database/schema.sql`
- `database/seed.sql`

Start services:

```bash
docker compose up --build
```

Reset local database (if needed):

```bash
docker compose down -v
docker compose up --build
```

## Migration workflow

- Put new SQL changes in `database/migrations` as a new file.
- In production, apply with `scripts/apply_migrations.sh`.
- Do not edit an already applied migration file.

## Quick database checks

List tables:

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e "SHOW TABLES;"
```

Show row counts for key tables:

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT 'routes' AS tbl, COUNT(*) AS cnt FROM routes UNION ALL
 SELECT 'buses', COUNT(*) FROM buses UNION ALL
 SELECT 'bus_stops', COUNT(*) FROM bus_stops UNION ALL
 SELECT 'locations', COUNT(*) FROM locations UNION ALL
 SELECT 'users', COUNT(*) FROM users UNION ALL
 SELECT 'trips', COUNT(*) FROM trips UNION ALL
 SELECT 'tickets', COUNT(*) FROM tickets;"
```

Check latest location rows:

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT bus_id, ROUND(latitude, 5) AS lat, ROUND(longitude, 5) AS lng, speed_kmh, timestamp
 FROM locations
 ORDER BY id DESC
 LIMIT 10;"
```

Check active trips:

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT id, route_id, bus_id, departure_time, arrival_time, status
 FROM trips
 ORDER BY departure_time ASC;"
```

Check recent bookings:

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT id, user_id, trip_id, total_price, status, created_at
 FROM tickets
 ORDER BY id DESC
 LIMIT 20;"
```

## Notes

- For local development, default MySQL container name is `dhaka-bus-mysql`.
- If you change service names in `docker-compose.yml`, update the commands above.
- For production deployment details, see `DEPLOY_FREE.md`.
