# Setup Guide

This guide is for local setup on Windows, macOS, or Linux.

## Requirements

- Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux)
- Git

## 1. Clone the project

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

## 2. Start all services

```bash
docker compose up --build
```

On first run it can take a few minutes.

## 3. Open the app

- Frontend: http://localhost
- Backend: http://localhost:3000
- Health endpoint: http://localhost:3000/api/health
- phpMyAdmin: http://localhost:8080

Demo users:
- Admin: admin@dhakabus.com / admin123
- User: user@dhakabus.com / user123

## Useful commands

```bash
# show containers
docker compose ps

# show logs
docker compose logs -f

# stop containers
docker compose down

# stop and remove DB data (fresh start)
docker compose down -v
```

## Database notes

- On a fresh database volume, schema and seed run automatically from `database/schema.sql` and `database/seed.sql`.
- Migration files are in `database/migrations`.
- Production migration helper is `scripts/apply_migrations.sh`.

## If something does not start

1. Run `docker compose down`.
2. Run `docker compose up --build` again.
3. If ports are busy, free these ports: `80`, `3000`, `3306`, `8080`.

## Contribution flow

```bash
git checkout -b feature/your-change
# edit code
git add .
git commit -m "feat: short message"
git push origin feature/your-change
```

Then open a pull request.
