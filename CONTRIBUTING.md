# Contributing to Dhaka Bus Tracking

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### 1. Fork & Clone the Repository
```bash
# Fork on GitHub (click Fork button)
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

### 2. Set Up Development Environment
```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start with Docker
docker-compose up --build
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

## Development Workflow

### Frontend Development
```bash
cd frontend
npm run dev
# Vite dev server runs on http://localhost:5173
```

### Backend Development
```bash
cd backend
npm run dev
# Express server runs on http://localhost:3000
```

### With Docker
```bash
docker-compose up --build
# Frontend: http://localhost
# Backend: http://localhost:3000
```

## Making Changes

### Code Style
- Use **meaningful variable names**
- Add **comments for complex logic**
- Keep functions **small and focused**
- Use **Tailwind CSS** for styling (frontend)

### Commit Messages
```bash
git commit -m "feat: add real-time bus tracking"
git commit -m "fix: resolve distance calculation bug"
git commit -m "docs: update README"
```

**Prefixes:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` CSS/formatting
- `refactor:` Code improvements
- `perf:` Performance improvements
- `test:` Tests

## Testing Your Changes

### Run the Application
1. Start Docker: `docker-compose up`
2. Visit http://localhost
3. Test your feature/fix thoroughly

### Check for Errors
```bash
# Frontend linting
cd frontend && npm run build

# Backend check
cd backend && npm run start
```

## Submitting Changes

### 1. Push Your Branch
```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request (PR)
- Go to GitHub → Your Fork
- Click "Compare & pull request"
- Write a clear PR description:
  - What problem does it solve?
  - What changes did you make?
  - How to test it?

### 3. PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] UI improvement

## Testing Done
How did you test this?

## Screenshots (if UI change)
[Add screenshots if applicable]
```

## Project Structure

```
dhaka-bus/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx      # Main app
│   │   └── App.css      # Tailwind styles
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── server.js       # Main server
│   ├── models/         # Database models
│   ├── routes/         # API endpoints
│   └── package.json
├── database/          # MySQL schema & seed
│   ├── schema.sql
│   └── seed.sql
└── docker-compose.yml # Docker setup
```

## Areas to Contribute

### Frontend
- [ ] Improve map UI
- [ ] Add bus schedule display
- [ ] Real-time notifications
- [ ] Offline mode support
- [ ] Mobile app (React Native)

### Backend
- [ ] Add bus location prediction
- [ ] Historical route tracking
- [ ] User authentication
- [ ] API caching
- [ ] Rate limiting

### Data
- [ ] Add more bus routes
- [ ] Improve location accuracy
- [ ] Add timing data

### Documentation
- [ ] Deployment guides
- [ ] API documentation
- [ ] Architecture diagrams

## Common Issues

### Docker won't start
```bash
# Remove old containers
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Changes not reflecting
```bash
# Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
docker-compose down
docker-compose up --build
```

### Port conflicts
```bash
# Check what's using port 80/3000
lsof -i :80
lsof -i :3000

# Kill if needed
kill -9 <PID>
```

## Need Help?

- Check existing issues/PRs
- Read the README.md
- Ask in discussions
- Comment on related issues

## Code of Conduct

- Be respectful and inclusive
- Help others learn
- Provide constructive feedback
- Celebrate each other's contributions

Thank you for contributing! 🙏
