# Setting Up GitHub for Collaboration

## Step 1: Create GitHub Repository

### On GitHub.com
1. Go to [github.com](https://github.com) and sign in
2. Click **+** → **New repository**
3. Fill in:
   - **Repository name**: `dhaka-bus`
   - **Description**: Dhaka Bus Tracking System
   - **Public** (recommended for collaboration)
   - **Initialize with**: Skip (we have local code)
4. Click **Create repository**

## Step 2: Push Local Code to GitHub

```bash
# Navigate to project directory
cd /Users/srabonahmed/Programming/Projects/dhaka-bus

# Initialize git (if not already done)
git init

# Add GitHub as remote
git remote add origin https://github.com/YOUR-USERNAME/dhaka-bus.git

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Setup Dhaka Bus Tracking System"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Invite Friends to Collaborate

### Method 1: Collaborators (Direct Access)
1. Go to your GitHub repository
2. Click **Settings** → **Collaborators**
3. Click **Add people**
4. Enter GitHub username of friend
5. Select role (**Maintain** or **Write**)
6. Send invitation

**Roles:**
- **Write** - Can push directly to repo (ideal for team)
- **Maintain** - Can manage settings
- **Pull** - Read-only access

### Method 2: Forks & Pull Requests (Open Contribution)
1. Friends fork your repo
2. Make changes in their fork
3. Create Pull Request
4. You review and merge

**Best for:** Open source, community contributions

## Step 4: Friends Setup Instructions

### For Direct Collaborators:
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus

# Create a branch for their work
git checkout -b feature/their-feature

# Make changes...

# Commit
git add .
git commit -m "feat: add their feature"

# Push
git push origin feature/their-feature
```

Then create Pull Request on GitHub for review.

### For Fork Contributors:
```bash
# Fork on GitHub first, then:
git clone https://github.com/THEIR-USERNAME/dhaka-bus.git
cd dhaka-bus

# Create feature branch
git checkout -b feature/amazing

# Make changes & commit
git add .
git commit -m "feat: amazing feature"

# Push to their fork
git push origin feature/amazing

# Go to GitHub and create Pull Request to main repo
```

## Step 5: Setup GitHub Workflow

### Branch Naming Convention
```
feature/description      # New features
bugfix/description       # Bug fixes
docs/description         # Documentation
refactor/description     # Code refactoring
```

### Commit Message Format
```
feat: add distance measurement
fix: resolve map centering bug
docs: update README
style: format code
refactor: improve performance
perf: optimize API queries
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes
3. Push to GitHub
4. Create PR with description
5. Request review from team
6. Address feedback
7. Merge when approved

## Step 6: Protect Main Branch (Optional)

For team safety:

1. Go to **Settings** → **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Require pull request reviews before merging
4. Require status checks to pass
5. Dismiss stale reviews

This ensures code review before merging.

## Step 7: Setup Project Board (Optional)

Track progress with GitHub Projects:

1. Go to **Projects** tab
2. Click **New project**
3. Select **Table** template
4. Add columns: Todo, In Progress, Done
5. Add issues/PRs to board

## .gitignore Setup

Already configured to ignore:
- `node_modules/` - Dependencies
- `.env` - Environment variables
- `.env.local` - Local config
- `dist/`, `build/` - Build outputs
- `*.log` - Log files
- `.DS_Store` - Mac files

## Common Commands for Collaboration

```bash
# Update local repo
git pull origin main

# Create feature branch
git checkout -b feature/name

# Push changes
git push origin feature/name

# Check status
git status

# View branches
git branch -a

# Delete local branch
git branch -d feature/name

# Delete remote branch
git push origin --delete feature/name

# Sync fork with main repo
git remote add upstream https://github.com/ORIGINAL-USERNAME/dhaka-bus.git
git fetch upstream
git rebase upstream/main
```

## Troubleshooting

### Push rejected?
```bash
# Get latest changes
git pull origin main

# Try again
git push origin feature/name
```

### Merge conflicts?
```bash
# Get latest main
git fetch origin
git rebase origin/main

# Resolve conflicts in editor, then:
git add .
git rebase --continue
git push -f origin feature/name
```

### Accidentally committed to main?
```bash
# Create feature branch from current commit
git checkout -b feature/name

# Go back to main
git checkout main

# Reset main to previous commit
git reset --hard HEAD~1
```

## Useful GitHub Features

- **Code Reviews** - Review PRs, suggest changes
- **Discussions** - Q&A and feature discussions
- **Actions** - Automate tests/deploys
- **Wiki** - Documentation
- **Releases** - Tag versions

## Next Steps

1. Create GitHub account for friends
2. Push code to your repository
3. Invite them as collaborators
4. Share this guide
5. Start collaborating! 🚀

---

**Need help?** Check GitHub's [collaboration guide](https://docs.github.com/en/pull-requests)
