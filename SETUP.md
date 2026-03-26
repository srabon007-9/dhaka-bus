# Setup Guide

This is super simple — just Docker and a few steps.

## What You Need

1. **Docker Desktop** (https://www.docker.com/products/docker-desktop) — handles everything, no need to install Node or MySQL separately
2. **Git** (https://git-scm.com/)

## Get the Code

**Option 1: Just want to test?**
```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

**Option 2: Want to contribute?**
1. Fork the repo on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

Forking lets you push changes to your own copy and submit pull requests.

## Run It

```bash
docker-compose up --build
```

Wait a minute or two on first run. You'll see:
- **Frontend:** http://localhost
- **Backend:** http://localhost:3000
- **Health check:** http://localhost:3000/api/health

**Demo accounts:**
- Admin: `admin@dhakabus.com` / `admin123`
- User: `user@dhakabus.com` / `user123`

## Useful Commands

```bash
# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

## Troubleshooting

**Services crashed?**
```bash
docker-compose down && docker-compose up --build
```

**Port conflict?** Something else is using port 80, 3000, or 3306. Kill it first.

**Email verification not working?** 
You need to set up SMTP. Create a `.env` file and add:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM=Dhaka Bus <your-email@example.com>
```
Then restart Docker. Without SMTP, verification links show on-screen instead.

## Contributing

**Make a branch:**
```bash
git checkout -b feature/your-idea
```

Branch names: `feature/...`, `bugfix/...`, `docs/...`

**Make your changes, test with Docker, then commit:**
```bash
git add .
git commit -m "feat: what you changed"
git push origin feature/your-idea
```

Then open a PR on GitHub. Keep commits tidy and describe what you did.
