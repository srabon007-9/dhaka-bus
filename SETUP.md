# Setup Guide

This guide explains how to run the project on your own machine in a simple way.

The project is already containerized, so you do not need to install Node.js, MySQL, or phpMyAdmin manually. Docker will run the full stack for you.

## What you need before starting

Install these tools first:

- Git
- Docker Desktop on Windows or macOS, or Docker Engine on Linux

That is enough for most users.

## First-time setup

### 1. Download the project

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

### 2. Start all services

```bash
docker compose up --build -d
```

This command starts:
- MySQL
- Backend API
- Frontend
- phpMyAdmin

### 3. Open the project in your browser

- Frontend: `http://localhost`
- Backend health check: `http://localhost:3000/api/health`
- phpMyAdmin: `http://localhost:8080`

## Default login accounts

After the seed data is loaded, you can sign in with:

- Admin account: `admin@dhakabus.com` / `admin123`
- User account: `user@dhakabus.com` / `user123`

## Local services and ports

By default, the project uses these ports:

- `80`: frontend
- `3000`: backend API
- `8080`: phpMyAdmin
- `3306`: MySQL by default, unless `MYSQL_PORT` is changed in your environment

If one of these ports is already being used by another app on your machine, Docker may fail to start. In that case, stop the other app or change the port mapping in `docker-compose.yml`.

## Useful Docker commands

Start the app:

```bash
docker compose up --build -d
```

Stop the app:

```bash
docker compose down
```

Restart the app:

```bash
docker compose down
docker compose up --build -d
```

See running containers:

```bash
docker compose ps
```

Watch logs:

```bash
docker compose logs -f
```

## Reset everything

If you want to remove all local database data and start from a clean state:

```bash
docker compose down -v
docker compose up --build -d
```

This will remove the MySQL volume, recreate the database, and reload the schema and seed data.

## How the setup works

When the MySQL container starts for the first time:

- `database/schema.sql` creates the database tables
- `database/seed.sql` inserts sample data

The backend then connects to MySQL, and the frontend connects to the backend API.

## Troubleshooting

### Docker is installed but the app does not start

Check whether Docker Desktop or Docker Engine is actually running.

### A port is already in use

This is one of the most common problems. Another service on your machine may already be using port `80`, `3000`, `3306`, or `8080`.

### The frontend loads but data does not appear

Check whether the backend is healthy:

```bash
curl http://localhost:3000/api/health
```

### The app still shows old UI changes

If you changed frontend code and the browser still shows the old version, rebuild and restart:

```bash
docker compose up --build -d
```

Then do a hard refresh in the browser.

## If you want to contribute

A simple workflow is:

```bash
git checkout -b feature/your-change
```

Then make your edits, test locally, commit your work, and open a pull request.

## Final note

If your goal is just to run the project, the shortest path is:

```bash
docker compose up --build -d
```

Then open `http://localhost`.
