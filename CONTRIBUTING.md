# How to Contribute to This Project

This guide is for your friends who want to help improve the app.

## Before You Start - IMPORTANT!

⚠️ **You MUST have Docker installed!**

If you don't have Docker:
1. Go to: https://www.docker.com/products/docker-desktop
2. Download and install it
3. Open Docker and wait for it to fully load
4. Come back and follow the steps below

---

## Step 1: Copy the Code to Your Computer

```bash
# Open Terminal (Mac) or Command Prompt (Windows)
# Copy and paste this:
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

## Step 2: Create Your Own Branch

```bash
# Copy and paste this:
git checkout -b feature/your-feature-name

# Branch naming (just follow these):
# feature/add-new-button      - for new features
# bugfix/fix-search           - for bug fixes
# docs/update-readme          - for documentation changes
```

## Step 3: Make Your Changes and Test

```bash
# Start the app:
docker-compose up --build

# Open http://localhost in your browser
# Test your changes to make sure they work

# Edit files in:
# - frontend/ folder (for website changes)
# - backend/ folder (for server changes)
# - database/ folder (for database changes)
```

## Step 4: Save Your Changes

```bash
# Copy and paste this:
git add .

# Save with a message:
git commit -m "feat: describe what you changed"

# Examples:
# git commit -m "feat: add search filter"
# git commit -m "fix: fix map bug"
# git commit -m "docs: update README"
```

## Step 5: Send Your Changes

```bash
# Copy and paste this:
git push origin feature/your-feature-name
```

## Step 6: Create a Pull Request

1. Go to: https://github.com/srabon007-9/dhaka-bus
2. Click "New Pull Request"
3. Select your branch
4. Click "Create Pull Request"
5. Describe what you changed
6. Click "Create Pull Request"

---

## Code Style (Keep It Simple)

- Use clear names: `isLoading` instead of `loading`
- Add comments for complicated parts
- Use 2 spaces for indentation
- Keep functions small

---

## Common Problems and Fixes

| Problem | Solution |
|---------|----------|
| Docker won't start | Restart Docker app |
| Port 3000 already in use | Close other apps using port 3000 |
| MySQL connection error | Make sure Docker is running: `docker-compose ps` |
| Changes not showing | Rebuild: `docker-compose down` then `docker-compose up --build` |
| Git commands not working | Make sure Git is installed |

---

## What Can You Help With?

**Frontend (Make it look better):**
- Improve the map
- Make search better
- Make it work on phone
- Add new buttons

**Backend (Make it work better):**
- Add new features
- Fix bugs
- Make it faster

**Database:**
- Add more bus routes
- Fix bad data

**Docs:**
- Write better instructions
- Add examples

---

## Questions?

- Open an issue on GitHub
- Ask in the pull request comments
- Send a message

## Be Nice!

- Be respectful
- Help each other
- No mean comments
- Welcome everyone

---

**Thanks for helping!** 🙏
