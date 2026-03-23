# 🚀 Quick Reference Card for Friends

## For Your Friends: "How to Contribute"

### First Time Setup
```bash
# 1. Clone the repo
git clone https://github.com/yourusername/dhaka-bus.git
cd dhaka-bus

# 2. Install & run
docker-compose up --build

# 3. Visit http://localhost
```

### Making Changes
```bash
# 1. Create a branch
git checkout -b feature/your-feature

# 2. Make changes in your editor

# 3. Test locally
# - Frontend: http://localhost
# - Backend: http://localhost:3000
# - Check for console errors

# 4. Commit changes
git add .
git commit -m "feat: describe what you added"

# 5. Push to GitHub
git push origin feature/your-feature

# 6. Create Pull Request on GitHub
# - Go to https://github.com/yourusername/dhaka-bus
# - Click "Compare & pull request"
# - Add description
# - Click "Create pull request"
```

### Example Contributions

**Frontend Change (Add a button):**
```bash
git checkout -b feature/add-refresh-button
# Edit frontend/src/components/Map.jsx
git commit -m "feat: add refresh button to map"
git push origin feature/add-refresh-button
```

**Backend Change (Fix an API):**
```bash
git checkout -b bugfix/fix-bus-search
# Edit backend/routes/busRoutes.js
git commit -m "fix: improve bus search filtering"
git push origin bugfix/fix-bus-search
```

**Documentation:**
```bash
git checkout -b docs/update-setup-guide
# Edit README.md or create new guide
git commit -m "docs: clarify Docker setup"
git push origin docs/update-setup-guide
```

## Branch Naming Guide

| Type | Example |
|------|---------|
| Feature | `feature/real-time-notifications` |
| Bug Fix | `bugfix/map-crash` |
| Documentation | `docs/api-guide` |
| Performance | `perf/optimize-queries` |

## Commit Message Examples

❌ **Bad:**
```
git commit -m "stuff"
git commit -m "fixed things"
git commit -m "update"
```

✅ **Good:**
```
git commit -m "feat: add user authentication"
git commit -m "fix: resolve bus location sync delay"
git commit -m "docs: add API documentation"
```

## Common Issues & Solutions

### "My branch is behind main"
```bash
git pull origin main
git push origin feature/name
```

### "Merge conflict"
1. Pull latest: `git pull origin main`
2. Fix conflicts in your editor
3. `git add .`
4. `git push origin feature/name`

### "Accidentally changed main"
```bash
git checkout main
git reset --hard origin/main
git checkout -b feature/new-branch
```

### "Can't push changes"
```bash
# Make sure you're on correct branch
git branch

# If behind main, pull first
git pull origin main

# Then push
git push origin feature/name
```

## Testing Checklist

Before creating Pull Request:

- [ ] Code runs without errors
- [ ] No console warnings/errors
- [ ] Tested on desktop
- [ ] Tested on mobile browser (resize window)
- [ ] Changes don't break existing features
- [ ] Docker builds without errors

## Code Style Tips

### JavaScript/React
```jsx
// ✅ Good: Descriptive names, clear logic
const handleBusSearch = (searchTerm) => {
  const filtered = buses.filter(bus => 
    bus.name.includes(searchTerm.toLowerCase())
  );
  setFilteredBuses(filtered);
};

// ❌ Bad: Unclear, no comments
const fn = (x) => {
  const y = buses.filter(b => b.name.includes(x));
  setFilteredBuses(y);
};
```

### Comments
```javascript
// ❌ Don't: Over-commenting obvious code
const x = 1; // Set x to 1

// ✅ Do: Comment complex logic
// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  // ... implementation
};
```

## File You Can Edit

**Frontend Components:**
- `frontend/src/components/Map.jsx` - Map display
- `frontend/src/components/BusSearch.jsx` - Search bar
- `frontend/src/components/BusList.jsx` - Bus list
- `frontend/src/App.jsx` - Main app

**Backend:**
- `backend/routes/busRoutes.js` - Bus API
- `backend/models/busModel.js` - Bus data
- `backend/server.js` - Main server

**Database:**
- `database/seed.sql` - Add bus data
- `database/schema.sql` - Update tables

**Documentation:**
- `README.md` - Main guide
- `CONTRIBUTING.md` - Contribution rules

## Important: Don't Edit These

❌ **Don't change without asking:**
- `docker-compose.yml` - Docker setup
- `package.json` - Dependencies
- `.env` - Environment config
- `.gitignore` - Git ignore rules

## Getting Help

**If stuck:**
1. Check `CONTRIBUTING.md`
2. Look at existing code for examples
3. Check `README.md` for setup help
4. Create GitHub Issue with question
5. Ask in the team chat

## Commands Cheat Sheet

```bash
# View current branch
git branch

# View all branches
git branch -a

# Switch branch
git checkout branch-name

# Create & switch branch
git checkout -b new-branch

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "message"

# Push
git push origin branch-name

# Pull latest
git pull origin main

# View commit history
git log

# See what changed
git diff
```

## Project Structure Quick Reference

```
dhaka-bus/
├── frontend/src/
│   ├── components/     ← React components
│   ├── App.jsx        ← Main component
│   └── App.css        ← Styles
├── backend/
│   ├── routes/        ← API endpoints
│   ├── models/        ← Database models
│   └── server.js      ← Main server
└── database/
    ├── schema.sql     ← Tables
    └── seed.sql       ← Sample data
```

## What NOT to Commit

Never commit:
- ❌ `node_modules/` folder
- ❌ `.env` file
- ❌ `.DS_Store` (Mac only)
- ❌ `*.log` files
- ❌ `dist/` or `build/` folders

(Already in `.gitignore` - you're safe!)

---

**You're ready to contribute! 🎉**

When you're done:
1. Create PR on GitHub
2. Add description
3. Wait for review
4. Address feedback
5. Get merged!

Questions? Ask in team chat! 💬
