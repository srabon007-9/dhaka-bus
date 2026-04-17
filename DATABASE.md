# The Database Setup 🗄️

Since this is a database-focused project, I spent a lot of time making sure the MySQL architecture is solid. It's not just a flat list of JSONs; it's a real relational database with proper foreign keys, indexing, and everything else you'd expect in a production app.

## What are we actually storing?

Here are the main tables I set up:
- `routes`, `bus_stops`, and `route_waypoints` (handles all the mapping and pathing data)
- `buses` and `locations` (live tracking coordinates)
- `users`, `trips`, `tickets`, and `ticket_seats` (the whole booking engine)
- `manual_payments`, `nagad_payments`, and `payment_sessions` (handles the money stuff)
- `passenger_events` (analytics)

How everything connects:
- A route has many buses, and buses spam location data.
- Trips belong to routes, and users buy tickets for those trips.
- Every ticket locks down specific rows in the `ticket_seats` table.

## Why I'm proud of this database structure

I didn't just throw this together. Here's why it's a "real" database project:
- Every table has a proper primary key.
- I used strict foreign key constraints. If an admin deletes a trip, it automatically handles the cascading so we don't end up with ghost tickets.
- I indexed the columns we query the most (like bus locations and trip dates) so the dashboard stays fast.
- I separated the payment logic from the ticketing logic so it's clean and scalable.

## Getting the database running locally

If you just cloned the repo and want to test it, don't worry about manually creating tables. 
When you run Docker for the very first time, it automatically reads my `database/schema.sql` and `database/seed.sql` files and sets up everything for you.

Just run:
```bash
docker compose up --build -d
```

If you messed up the data while testing and just want to reset everything back to a clean state, you can nuke the Docker volume like this:
```bash
docker compose down -v
docker compose up --build -d
```

## Useful Commands

If you want to poke around the database while it's running, here are some commands I use a lot. You can just copy-paste these into your terminal.

See how many rows are in the main tables:
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

Check the live GPS pings coming in:
```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT bus_id, ROUND(latitude, 5) AS lat, ROUND(longitude, 5) AS lng, speed_kmh, timestamp
 FROM locations
 ORDER BY id DESC
 LIMIT 10;"
```

See who just bought tickets:
```bash
docker exec dhaka-bus-mysql mysql -u root -ppassword dhaka_bus -e \
"SELECT id, user_id, trip_id, total_price, status, created_at
 FROM tickets
 ORDER BY id DESC
 LIMIT 20;"
```

**Quick note:** The default MySQL container is named `dhaka-bus-mysql`. If you run into port conflicts (like if you already have MySQL running on your laptop), you can change the port mapping in the `docker-compose.yml` file.
