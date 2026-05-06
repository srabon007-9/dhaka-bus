# Dhaka Bus Tracking System

Dhaka Bus Tracking System is a full-stack web application for bus tracking and ticket booking. It was built to make bus travel easier to understand and manage. A passenger can check routes, see bus movement, book seats, and review tickets. An admin can manage buses, routes, trips, payments, and passenger flow from one dashboard.

The project uses:
- React and Vite for the frontend
- Node.js and Express for the backend API
- MySQL for the database
- Docker Compose to run everything locally

## What this project does

This system combines three main ideas in one application:
- live bus tracking
- online seat booking
- admin management for routes, buses, trips, and payments

It is designed as a real full-stack project, not just a frontend demo. The app includes authentication, role-based access, ticket records, payment flows, and a relational database with linked tables.

## Main features

### For passengers
- View available bus routes
- Check live bus tracking data
- Choose boarding and drop-off stops
- Select seats before booking
- Book tickets for a trip
- View current and past tickets

### For admins
- Access a protected admin dashboard
- Manage buses
- Manage routes
- Manage trips
- Review ticket-related payment activity
- Monitor passenger flow information

## Project structure

- `frontend/`: React app and UI code
- `backend/`: Express API, business logic, and authentication
- `database/`: SQL schema, seed data, and migrations
- `docker-compose.yml`: local development stack
- `scripts/`: helper scripts, including database migration support

## Pages in the app

The main frontend routes are:
- `/`: home page
- `/routes`: route listing
- `/tracking`: live tracking page
- `/booking`: protected booking page
- `/tickets`: protected tickets page
- `/admin`: protected admin dashboard
- `/auth`: login and account flow

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

### 2. Start the application

```bash
docker compose up --build -d
```

The first run may take a few minutes because Docker needs to build the images.

### 3. Open the app

- Frontend: `http://localhost`
- Backend API health check: `http://localhost:3000/api/health`
- phpMyAdmin: `http://localhost:8080`

## Demo accounts

You can use these sample accounts after the seed data is loaded:

- Admin: `admin@dhakabus.com` / `admin123`
- User: `user@dhakabus.com` / `user123`

## Helpful commands

Start the project:

```bash
docker compose up --build -d
```

Stop the project:

```bash
docker compose down
```

See container status:

```bash
docker compose ps
```

See logs:

```bash
docker compose logs -f
```

Reset the database and start fresh:

```bash
docker compose down -v
docker compose up --build -d
```

## Documentation guide

If you want more detail, these files will help:

- [SETUP.md](SETUP.md): local setup and troubleshooting
- [DATABASE.md](DATABASE.md): database structure and useful SQL commands
- [DEPLOY_FREE.md](DEPLOY_FREE.md): simple deployment guide for free hosting

## Notes

- The database schema is created automatically from `database/schema.sql`
- Initial sample data is loaded from `database/seed.sql`
- Extra database changes are stored in `database/migrations/`
- If you change frontend or backend code while using Docker, rebuild the containers to make sure your changes are reflected

## Summary

If someone wants to understand this project quickly, the short version is this:

Dhaka Bus Tracking System is a Docker-based full-stack web app for route browsing, live tracking, ticket booking, and admin operations. It includes a React frontend, an Express backend, and a MySQL database with structured relationships between routes, buses, trips, users, tickets, and payments.
