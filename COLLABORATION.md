# 🤝 Collaboration Guide

Everything you need to know to collaborate with your friends on this project!

## Quick Summary

Your friends can contribute by:

1. **If they have direct access** (you add them as collaborators):
   - Clone: `git clone https://github.com/yourusername/dhaka-bus.git`
   - Create branch: `git checkout -b feature/their-feature`
   - Make changes, commit, push
   - Create Pull Request

2. **If they fork the repository** (open contribution):
   - Fork on GitHub
   - Clone their fork
   - Make changes
   - Create Pull Request to your repo

## Files Created for Collaboration

| File | Purpose |
|------|---------|
| `CONTRIBUTING.md` | Detailed contribution guidelines |
| `SETUP_GITHUB.md` | How to set up GitHub & invite friends |
| `.github/pull_request_template.md` | PR template for consistency |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report template |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Feature request template |
| `README.md` | Updated with contribution section |

## 3 Steps to Enable Collaboration

### Step 1: Create GitHub Repository
```bash
# On GitHub.com:
1. Create new repository "dhaka-bus"
2. Don't initialize (you have local code)
```

### Step 2: Push Your Code
```bash
cd dhaka-bus
git init
git remote add origin https://github.com/yourusername/dhaka-bus.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 3: Invite Friends
**On GitHub:**
1. Go to Settings → Collaborators
2. Click "Add people"
3. Enter friend's GitHub username
4. Send invitation

**Or send them this:**
```bash
git clone https://github.com/yourusername/dhaka-bus.git
cd dhaka-bus
git checkout -b feature/amazing-feature
# Make changes...
git commit -m "feat: add something awesome"
git push origin feature/amazing-feature
# Create Pull Request on GitHub
```

## What Friends Can Contribute

### Frontend (React, Tailwind, Leaflet)
- 🎨 Improve UI design
- 📱 Make mobile responsive
- 🗺️ Enhance map features
- 🔍 Improve search functionality
- ⚡ Add new pages/components

### Backend (Node.js, Express, MySQL)
- 🔒 Add user authentication
- 📊 Add data analytics
- 🚀 Performance optimization
- 📈 Improve API endpoints
- 🐛 Fix bugs

### Database & Data
- 📍 Add more bus routes
- 🛣️ Improve accuracy
- ⏰ Add timing data

### Documentation & DevOps
- 📚 Write documentation
- 🐳 Improve Docker setup
- 🚀 Add deployment guides

## Workflow for Your Team

```
Friend A          Friend B          Friend C
    |                 |                 |
    +--------> GitHub Repo <----------+
                    |
              Pull Requests
                    |
              Your Review
                    |
              Merge to Main
```

## Common Workflow

1. **Create Issue** - Describe what needs to be done
2. **Assign** - Assign to friend working on it
3. **Create Branch** - `git checkout -b feature/issue-name`
4. **Make Changes** - Code & test locally
5. **Commit** - `git commit -m "feat: description"`
6. **Push** - `git push origin feature/name`
7. **Pull Request** - Create PR on GitHub
8. **Review** - You review the code
9. **Merge** - Approve & merge to main

## Best Practices

✅ **DO:**
- Use meaningful branch names
- Write clear commit messages
- Test changes before pushing
- Review code before merging
- Keep main branch stable

❌ **DON'T:**
- Push directly to main
- Commit without message
- Merge without review
- Break existing functionality
- Commit node_modules or .env

## GitHub Branching Strategy (Git Flow)

```
main (production)
  ↑
  ├─ release/1.0.0 (preparing release)
  │   ↑
  │   └─ bugfix/...
  │
  ├─ develop (integration branch)
  │   ↑
  │   ├─ feature/new-feature
  │   ├─ feature/map-improvement
  │   ├─ bugfix/search-bug
  │   └─ docs/readme
```

## Communication Tips

📢 **Use GitHub Issues for:**
- Bug reports
- Feature requests
- Questions
- Discussions

💬 **Use Pull Requests for:**
- Code reviews
- Design discussions
- Implementation feedback

📧 **Use Email/Chat for:**
- Urgent issues
- Real-time discussion
- Meetings/standup

## Tools to Enhance Collaboration

### GitHub Integrations
- `Actions` - Automated tests, builds, deploys
- `Projects` - Kanban board for tracking
- `Wiki` - Team documentation

### Local Tools
- `ESLint` - Code quality checks
- `Prettier` - Code formatting
- `Husky` - Git hooks

## Security Tips

⚠️ **Never commit:**
- `.env` files (use `.env.example`)
- Database passwords
- API keys
- Private information

✅ **Always:**
- Use `.gitignore`
- Review PRs carefully
- Keep main branch protected
- Require code reviews

## Resources

- [GitHub Collaboration Guide](https://docs.github.com/en/collaboration)
- [Git Workflow Guide](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [How to Make a PR](https://www.atlassian.com/git/tutorials/making-a-pull-request)
- [GitHub Best Practices](https://docs.github.com/en/get-started/quickstart/hello-world)

## Need Help?

When friends ask:

**"How do I set up the project?"**
→ Send them `SETUP_GITHUB.md`

**"What should I work on?"**
→ Create GitHub Issues labeled with `good first issue`

**"How do I contribute?"**
→ Send them `CONTRIBUTING.md`

**"How do I fix a merge conflict?"**
→ Run the commands in `SETUP_GITHUB.md` troubleshooting

---

**You're all set to collaborate!** 🚀

Follow `SETUP_GITHUB.md` next to push your code and invite your friends.
