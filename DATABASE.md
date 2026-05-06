# Database Guide

This project uses MySQL as the main database. The database stores routes, buses, live locations, users, trips, tickets, payments, and passenger flow records.

The goal of this file is to explain the database clearly, so a reader can understand both the big picture and the important details.

## Database overview

The database is relational. That means the main parts of the system are stored in separate tables and connected with foreign keys.

In simple terms:

- routes define where buses travel
- buses belong to routes
- trips represent scheduled journeys
- users book seats on trips
- tickets store bookings
- payment tables store payment-related data
- passenger flow tables track boarding and drop-off events

## Main table groups

### 1. Route and map data

- `routes`: basic route information
- `bus_stops`: stops for each route, including stop order
- `route_waypoints`: route path points between stops

These tables define where a bus goes and in what order passengers travel along a route.

### 2. Bus tracking data

- `buses`: bus records, capacity, and status
- `locations`: live or simulated location history for each bus

This part powers the tracking feature.

### 3. User and authentication data

- `users`: user accounts and roles
- `password_reset_tokens`: password reset support

The `users` table stores both normal users and admins.

### 4. Booking data

- `trips`: scheduled journeys for a bus on a route
- `tickets`: main booking records
- `ticket_seats`: per-seat passenger details for a ticket

This is the heart of the booking system.

### 5. Payment data

- `manual_payments`: manual payment attempts such as bKash or Nagad
- `nagad_payments`: Nagad payment records
- `payment_sessions`: checkout and payment session records

These tables are kept separate from the main ticket data to keep the system easier to manage.

### 6. Passenger flow data

- `passenger_events`: boarding and alighting records by stop

This supports tracking passenger movement during trips.

## Important relationships

Here are the main connections in plain language:

- one route can have many stops
- one route can have many buses
- one bus can have many location records
- one route can have many trips
- one trip belongs to one bus and one route
- one user can have many tickets
- one ticket can have many seat records in `ticket_seats`
- one ticket can also have many passenger events

## Why the structure is useful

This database design helps the project in a few important ways:

- data is organized by responsibility
- related records are connected with foreign keys
- common queries can run faster because of indexes
- booking, payment, and tracking logic stay separate

## Schema source files

The database is created from:

- `database/schema.sql`
- `database/seed.sql`

Extra changes over time are stored in:

- `database/migrations/`

There is also a helper script for applying migrations:

- `scripts/apply_migrations.sh`

## Running the database locally

If you start the project with Docker:

```bash
docker compose up --build -d
```

the MySQL container will create the schema automatically on first run.

## Resetting the database

If you want to delete all local data and start over:

```bash
docker compose down -v
docker compose up --build -d
```

Use this only when you are okay with losing the current local database contents.

## Useful SQL commands

### Count rows in key tables

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

### View recent bus location data

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT bus_id, ROUND(latitude, 5) AS lat, ROUND(longitude, 5) AS lng, speed_kmh, timestamp
 FROM locations
 ORDER BY id DESC
 LIMIT 10;"
```

### View recent ticket records

```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT id, user_id, trip_id, total_price, status, created_at
 FROM tickets
 ORDER BY id DESC
 LIMIT 20;"
```

## What to look at first

If you are new to the project and want to understand the database quickly, start with these tables in this order:

1. `routes`
2. `bus_stops`
3. `buses`
4. `trips`
5. `users`
6. `tickets`
7. `ticket_seats`

That path usually gives the clearest picture of how the application works.

## Practical summary

This database is built around the full journey of a bus booking:

route -> bus -> trip -> user -> ticket -> seat -> payment -> passenger event

Once you understand that flow, the rest of the schema becomes much easier to follow.
