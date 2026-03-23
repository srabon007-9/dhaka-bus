# Contributing to Dhaka Bus Tracking System

## How to Contribute

We welcome contributions! Here's how you can help:

### 1. Clone the Repository

```bash
# Fork the repository on GitHub (click Fork button)
# Then clone your fork:
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

### 2. Create a Feature Branch

```bash
# Always create a new branch for your work
git checkout -b feature/your-feature-name

# Branch naming conventions:
# feature/add-login        - For new features
# bugfix/fix-map-issue     - For bug fixes
# docs/update-readme       - For documentation
```

### 3. Make Changes & Test

```bash
# Start the application
docker-compose up --build

# Make your changes to:
# - frontend/ for UI changes
# - backend/ for API changes
# - database/ for schema changes

# Test your changes at http://localhost
```

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat: add new feature description"

# or for bug fixes
git commit -m "fix: resolve issue description"

# or for documentation
git commit -m "docs: update documentation"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to https://github.com/srabon007-9/dhaka-bus
2. Click "New Pull Request"
3. Select your branch
4. Add a description of what you changed
5. Click "Create Pull Request"

## Code Style

- Use **descriptive variable names**: `isLoading` instead of `loading`
- Add **comments for complex logic**
- Use **ES6+ syntax** in JavaScript/React
- Keep functions **small and focused**
- Format code with **2 spaces** indentation

## Pull Request Checklist

Before submitting a PR:

- [ ] Your code follows the style guide
- [ ] You've tested your changes locally
- [ ] Commit messages are clear and descriptive
- [ ] You've pulled the latest changes from main
- [ ] No console errors or warnings

## Areas to Contribute

**Frontend (React)**
- Improve map visualization
- Add new features to the search component
- Enhance mobile responsiveness
- Add new styling with Tailwind CSS

**Backend (Node.js)**
- Add new API endpoints
- Improve error handling
- Add data validation
- Optimize database queries

**Database**
- Add more bus routes
- Improve data accuracy
- Add new tables if needed

**Documentation**
- Improve README
- Add code comments
- Create guides

## Common Issues & Solutions

**Issue: Docker containers won't start**
```bash
# Solution: Rebuild everything
docker-compose down
docker-compose up --build
```

**Issue: Port already in use**
```bash
# Solution: Use different port in docker-compose.yml
# Change "80:80" to "8080:80" for example
```

**Issue: Database connection error**
```bash
# Solution: Check MySQL container
docker-compose logs mysql
```

**Issue: Changes not showing up**
```bash
# Solution: Rebuild containers
docker-compose down
docker-compose up --build
```

## Questions?

- Open an issue on GitHub
- Check existing issues for solutions
- Ask in pull request comments

## Code of Conduct

- Be respectful and helpful
- No harassment or discrimination
- Welcome all skill levels
- Constructive feedback only

---

**Thank you for contributing!** 🙏
