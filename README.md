# Dhaka Bus

Dhaka Bus is a student project for real-time bus tracking and ticket booking.

It has:
- React frontend
- Node.js and Express backend
- MySQL database
- Docker setup for local run on Windows, macOS, and Linux

## Quick start

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
docker compose up --build
```

Open:
- App: http://localhost
- API health: http://localhost:3000/api/health

Demo users:
- Admin: admin@dhakabus.com / admin123
- User: user@dhakabus.com / user123

## Main docs

- Setup and local development: [SETUP.md](SETUP.md)
- Database overview and checks: [DATABASE.md](DATABASE.md)
- Deployment notes: [DEPLOY_FREE.md](DEPLOY_FREE.md)

## Project structure

```text
dhaka-bus/
	frontend/          React app
	backend/           Express API
	database/          schema, seed, migrations
	scripts/           helper scripts
	docker-compose.yml local services
```

## Common commands

```bash
# start
docker compose up --build

# stop
docker compose down

# stop and reset DB volume
docker compose down -v
```

## Contributing

1. Create a branch.
2. Make your changes.
3. Test locally with Docker.
4. Open a pull request.

Branch examples:
- feature/add-ticket-filter
- bugfix/fix-seat-validation
- docs/update-setup
