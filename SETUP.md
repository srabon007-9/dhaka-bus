# Setup Guide (Docker Only)

This guide is intentionally simple so anyone can run the app and contribute.

## 1) Install required tools

Docker runs everything in containers. You don't need to install Node, MySQL, or anything else separately.

1. Docker Desktop: https://www.docker.com/products/docker-desktop
2. Git: https://git-scm.com/

Open Docker Desktop and wait until it is running.

## 2) Get the project

Use only ONE of the following options:

### Option A: Just run the app (quick test)

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

### Option B: Contribute code (recommended for friends)

1. Fork this repo on GitHub (click **Fork**)
2. Clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

Why this exists: you cannot push directly to the main repo unless you have write access.
Forking lets you push to your own copy and open a pull request.

## 3) Run the app

From the project root:

```bash
docker-compose up --build
```

Wait 1-2 minutes on first startup.

Open:

- Frontend: http://localhost
- Backend: http://localhost:3000
- Health: http://localhost:3000/api/health

Demo users:

- Admin: `admin@dhakabus.com` / `admin123`
- User: `user@dhakabus.com` / `user123`

## 4) Useful Docker commands

```bash
# See if containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after changes
docker-compose up --build
```

---

## Troubleshooting

### Docker container crashes

```bash
# Rebuild everything
docker-compose down
docker-compose up --build
```

### Port already in use

Something else is using port `80`, `3000`, or `3306`.
Stop that app and run Docker again.

### Changes not appearing

```bash
docker-compose down
docker-compose up --build
```

### Signup works but no verification email arrives

Email verification requires SMTP settings in the backend container.

1. Create a `.env` file in the project root (same level as `docker-compose.yml`)
2. Add your SMTP provider values:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM=Dhaka Bus <your-email@example.com>
```

3. Restart services:

```bash
docker-compose down
docker-compose up --build
```

If SMTP is not configured, the app falls back to showing a verification link in the auth screen instead of sending a real inbox email.

### Full reset

```bash
docker-compose down -v
docker-compose up --build
```

### Still stuck?

Open an issue on GitHub: https://github.com/srabon007-9/dhaka-bus/issues

---

## Next Steps

1. Run the app with Docker
2. Check if http://localhost works
3. Follow the contribution workflow below

---

## Contributing Workflow

### 1) Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

### 2) Create a Branch

```bash
git checkout -b feature/your-idea
```

Branch naming examples:
- `feature/add-notification`
- `bugfix/fix-login`
- `docs/update-setup`

### 3) Make Changes and Test

- Frontend: `frontend/src/`
- Backend: `backend/`
- Database: `database/`

```bash
# Run and test with Docker
docker-compose up --build
```

### 4) Commit

```bash
git add .
git commit -m "feat: short description"
```

Commit prefixes:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` cleanup

### 5) Push and Open PR

```bash
git push origin feature/your-idea
```

Then open a pull request on GitHub and describe your changes.

### 6) Owner Control (protect main branch)

Repository owner should enable branch protection so no one can push directly to main/master.

GitHub steps:

1. Open your repo on GitHub
2. Go to **Settings → Branches → Add branch protection rule**
3. Branch name pattern: `main` (or `master`, whichever you use)
4. Enable:
	- **Require a pull request before merging**
	- **Require approvals** (at least 1)
	- **Require status checks to pass** (if CI exists)
	- **Block force pushes**
	- **Restrict who can push** (optional: owner only)

Result: contributors can only submit pull requests, and only you (or approved maintainers) can merge to main/master.

### Code Style

- Use clear names (`isLoading` over `load`)
- Add comments only where needed
- Keep formatting consistent
- Remove debug logs before PR

### Common Git Issue

```bash
git pull origin master
# resolve conflicts if any
git push
```
