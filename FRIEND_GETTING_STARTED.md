# 🚌 Dhaka Bus - Getting Started Guide for Contributors

Welcome! Your friend forked the repo? Great! This guide will walk you through **exactly what to do**.

---

## 📱 What is This Project?

**Dhaka Bus** is a **real-time bus booking and tracking platform** for Dhaka City.

Think of it like:
- **Uber** = Real-time live location tracking of buses 🗺️
- **Booking.com** = Seat selection and ticket booking 🎫
- **Admin dashboard** = Manage buses, routes, trips (for managers)

**Built with:**
- Frontend: React (modern web app)
- Backend: Node.js/Express (server)
- Database: MySQL (stores everything)
- All running in Docker (easy setup, no installation needed)

---

## 🚀 Step 1: Install Prerequisites (5 minutes)

You need **2 things only**:

### ✅ Docker Desktop
Download and install: https://www.docker.com/products/docker-desktop

**Why?** Docker runs the entire app in containers. No need to install Node, MySQL, or anything else separately.

### ✅ Git
Download and install: https://git-scm.com/

**Why?** To download the code and work with GitHub.

---

## 📥 Step 2: Clone the Repository (2 minutes)

### Your Friend Already Did This For You?

If yes, skip to **Step 3**. If not:

```bash
# Open Terminal/Command Prompt and run:
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus
```

Replace `YOUR-USERNAME` with your GitHub username.

**Folder structure you should see:**
```
dhaka-bus/
├── frontend/          (React app - what users see)
├── backend/           (Node.js server - handles bookings)
├── database/          (MySQL setup files)
├── docker-compose.yml (Magic file that runs everything)
└── README.md          (Project docs)
```

---

## 🎯 Step 3: Run the App (Very Simple!)

### Open Terminal in the Project Folder

```bash
cd dhaka-bus
```

### Run This One Command:

```bash
docker-compose up --build
```

**What happens:**
1. Docker downloads the necessary images (~500MB, takes 2-3 min on first run)
2. Starts 3 containers:
   - **Frontend** = React app (http://localhost)
   - **Backend** = Node server (http://localhost:3000)
   - **Database** = MySQL (http://localhost:3306)
3. Waits for you to open the site

### ⏳ Wait for "startup complete" message (watch the logs)

### 🎉 Open Your Browser

Open these links in your browser:

| Link | What You See |
|------|------|
| http://localhost | **Live app** - Book tickets, track buses |
| http://localhost:3000/api/health | **API health check** - Should say "OK" |

---

## 🔓 Step 4: Test the App (5 minutes)

### Demo Accounts (Pre-created in Database)

**Regular User:**
- Email: `user@dhakabus.com`
- Password: `user123`

**Admin User:**
- Email: `admin@dhakabus.com`
- Password: `admin123`

### Try These Features:

#### As Regular User:
1. ✅ Sign in with `user@dhakabus.com` / `user123`
2. ✅ Go to "Book Tickets"
3. ✅ Select a route (e.g., "Dhaka-Narayanganj")
4. ✅ Pick a bus and seats
5. ✅ View your booking in "My Tickets"

#### As Admin:
1. ✅ Sign in with `admin@dhakabus.com` / `admin123`
2. ✅ Click "Admin" in navbar
3. ✅ Add new buses, routes, trips
4. ✅ Edit/delete existing data

#### Live Tracking:
1. ✅ Go to "Live Tracking"
2. ✅ See buses moving on the map in real-time 🗺️
3. ✅ Click a bus to see details

---

## 🛑 Step 5: Stop the App

When you're done testing:

```bash
# Stop all containers (Ctrl+C or)
docker-compose down
```

---

## 📂 Project Structure Explained

```
frontend/                 # What users see in browser
├── src/components/       # Reusable UI pieces (Navbar, Modal, etc)
├── src/pages/            # Full pages (BookingPage, AdminPage, etc)
├── src/context/          # Global state (AuthContext for login info)
└── src/services/         # API calls to backend

backend/                  # Server that handles all logic
├── routes/               # API endpoints (/api/tickets, /api/buses, etc)
├── models/               # Database queries (ticketModel, busModel, etc)
├── middleware/           # Auth checks, error handling
└── server.js             # Main Express server

database/                 # Database setup
├── schema.sql            # Table definitions
└── seed.sql              # Demo data (users, buses, routes, trips)
```

---

## 💻 Step 6: Make Your First Code Change

### Change the Homepage Title

1. **Open the file:**
   ```
   frontend/src/pages/HomePage.jsx
   ```

2. **Find the line with "Welcome to"**

3. **Change it to whatever you want**, e.g.:
   ```jsx
   <h1>Welcome to MY Awesome Bus Booking App!</h1>
   ```

4. **Save the file**

5. **Check the browser** - It updates automatically! (Hot reload)

---

## 🐛 Common Problems & Solutions

### ❌ Problem: "docker-compose: command not found"
**Solution:** Docker Desktop isn't installed properly. Download from https://www.docker.com/products/docker-desktop

### ❌ Problem: "Port 80/3000/3306 already in use"
**Solution:** Something else is using the port. Run:
```bash
docker-compose down
# Then check for other apps using those ports
```

### ❌ Problem: "Changes in code don't show up"
**Solution:** Rebuild Docker:
```bash
docker-compose down
docker-compose up --build
```

### ❌ Problem: Database seems broken
**Solution:** Full reset:
```bash
docker-compose down -v  # -v removes volumes (database data)
docker-compose up --build
```

### ❌ Problem: "Can't sign in with demo account"
**Solution:** Wait a few more seconds for database to initialize, or restart:
```bash
docker-compose down
docker-compose up
```

---

## 🔄 Development Workflow

### When You Make Code Changes:

```bash
# 1. Make your code changes
#    (e.g., edit frontend/src/components/Navbar.jsx)

# 2. If it's just frontend/simple changes:
#    - Browser auto-updates (you'll see it immediately)

# 3. If it's backend changes or doesn't auto-update:
docker-compose down
docker-compose up --build

# 4. Open http://localhost in browser again
```

---

## 🚀 Next Steps to Contribute

### Option A: Fix a Bug
1. Open `Issues` tab on GitHub
2. Find a bug marked "good first issue"
3. Fix it in your local code
4. Push to your fork with `git push`
5. Open a "Pull Request" (PR) 

### Option B: Build a Feature
Already have an idea? 
1. Create a feature branch: `git checkout -b feature/my-awesome-feature`
2. Build it locally
3. Test it thoroughly at http://localhost
4. Push your branch: `git push origin feature/my-awesome-feature`
5. Create a Pull Request on GitHub

### Option C: Just Explore & Learn
- Read the code
- Test different features
- Understand how React/Node/MySQL work together
- Try modifying things to learn

---

## 📚 Key Files to Understand

### Frontend (User Interface)

| File | Does What |
|------|-----------|
| `frontend/src/pages/BookingPage.jsx` | Entire booking flow (4 steps) |
| `frontend/src/pages/HomePage.jsx` | Landing page |
| `frontend/src/components/Map.jsx` | Live tracking map |
| `frontend/src/contexts/AuthContext.jsx` | Login state management |
| `frontend/src/services/api.js` | All API calls to backend |

### Backend (Server Logic)

| File | Does What |
|------|-----------|
| `backend/routes/ticketRoutes.js` | Booking logic |
| `backend/routes/authRoutes.js` | Login/signup |
| `backend/models/ticketModel.js` | Database queries for bookings |
| `backend/server.js` | Main Express server setup |

### Database

| File | Does What |
|------|-----------|
| `database/schema.sql` | Database table structure |
| `database/seed.sql` | Demo data (users, buses, etc) |

---

## ❓ Frequently Asked Questions

### Q: Do I need to know React to contribute?
**A:** Not required, but helpful. You can still fix bugs in:
- CSS styling
- HTML structure
- Documentation
- Backend logic (Node.js)

### Q: Can I change the database?
**A:** Yes, but carefully:
1. Update `database/schema.sql` if you're changing tables
2. Update `database/seed.sql` if you're changing demo data
3. Rebuild: `docker-compose down -v && docker-compose up --build`

### Q: How do I see what's happening in the backend?
**A:** Watch the logs:
```bash
docker-compose logs -f backend
```

### Q: Can I add a new page?
**A:** Yes! Check `frontend/src/pages/` and copy the structure from `HomePage.jsx`

### Q: How do I commit my changes to GitHub?
```bash
git add .
git commit -m "Fix: describe what you changed"
git push origin your-branch-name
```

---

## 🎓 Learning Path (Recommended)

**Week 1: Explore**
- [ ] Run the app
- [ ] Test all features as a user
- [ ] Test as an admin
- [ ] Read the code structure

**Week 2: Make Small Changes**
- [ ] Change the homepage title
- [ ] Modify button colors
- [ ] Update error messages
- [ ] Add a console.log() somewhere

**Week 3: Understand the Flow**
- [ ] Trace how booking works (frontend → backend → database)
- [ ] Trace how login works
- [ ] Trace how live tracking works

**Week 4+: Contribute Real Code**
- [ ] Fix a bug
- [ ] Add a small feature
- [ ] Help someone else with setup

---

## 📞 Need Help?

1. **Check the README.md** in the project root
2. **Google the error message** (80% of the time it's a common issue)
3. **Open an issue on GitHub** with:
   - What you did
   - What happened
   - Error message (if any)
   - Your OS (Windows/Mac/Linux)

---

## 🎉 You're Ready!

You now understand:
- ✅ What the project is
- ✅ How to run it
- ✅ How to make changes
- ✅ How to contribute

**Next action:** Open Terminal and run:
```bash
docker-compose up --build
```

Then visit http://localhost and explore! 🚀

---

**Good luck, and welcome aboard! 🎊**
