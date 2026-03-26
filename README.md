# 🚌 Dhaka Bus Service

Real-time bus tracking and ticket booking platform for Dhaka. Built with React, Node.js, MySQL, and Docker.

---

## 🚀 Getting Started

**First time here?** Start with the [FRIEND_GETTING_STARTED.md](./FRIEND_GETTING_STARTED.md) guide — it walks you through everything step by step.

---

## What's Inside?

This is a full-stack transportation management platform with:

- **Live Bus Tracking** — See buses move in real-time on an interactive map
- **Smart Booking** — Step-by-step seat selection with instant confirmations
- **Admin Dashboard** — Manage buses, routes, and schedules
- **User Authentication** — Secure login with role-based access
- **Mobile-Friendly** — Works great on phones, tablets, and desktops

---

## Tech Stack

**Frontend:** React 18 + Vite, Tailwind CSS, Leaflet maps
**Backend:** Node.js + Express, JWT auth, Socket.IO for live updates
**Database:** MySQL 8.0 with optimized queries and indexes
**DevOps:** Docker Compose for local development, Nginx for serving

---

## Core Features

- ✅ User registration & JWT authentication
- ✅ Real-time bus locations on Leaflet maps
- ✅ 4-step booking flow with seat selection
- ✅ Instant ticket confirmation
- ✅ Ticket history and cancellations
- ✅ Admin CRUD for buses, routes, trips
- ✅ Dark theme UI with glass-morphism effects
- ✅ Responsive across all devices

---

## 📁 Project Structure

```
dhaka-bus/
│
├── frontend/                          # React app
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.jsx          # Hero & features
│   │   │   ├── RoutesPage.jsx        # List all routes
│   │   │   ├── TrackingPage.jsx      # Live bus tracking map
│   │   │   ├── BookingPage.jsx       # Step-by-step booking
│   │   │   ├── TicketsPage.jsx       # User's tickets
│   │   │   ├── AdminPage.jsx         # Admin dashboard
│   │   │   └── AuthPage.jsx          # Login/Register
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Navbar.jsx            # Top navigation
│   │   │   ├── BusCard.jsx           # Bus info card
│   │   │   ├── SeatSelector.jsx      # Seat grid
│   │   │   ├── MapView.jsx           # Leaflet map
│   │   │   └── common/               # Generic components
│   │   ├── contexts/                 # Global state
│   │   │   └── AuthContext.jsx       # Auth provider
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.js            # Auth logic
│   │   │   ├── useLiveTracking.js    # Bus tracking
│   │   │   └── useToast.js           # Notifications
│   │   ├── services/
│   │   │   └── api.js                # Axios instance & endpoints
│   │   └── index.css                 # Global styles + Tailwind
│   ├── package.json                  # Dependencies
│   └── vite.config.js                # Vite config
│
├── backend/                           # Node.js/Express
│   ├── middleware/
│   │   └── auth.js                   # JWT verification & role check
│   ├── models/                       # Database queries
│   │   ├── busModel.js
│   │   ├── routeModel.js
│   │   ├── locationModel.js
│   │   ├── userModel.js              # User CRUD
│   │   ├── tripModel.js              # Trip scheduling
│   │   └── ticketModel.js            # Booking management
│   ├── routes/                       # API endpoints
│   │   ├── busRoutes.js
│   │   ├── routeRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── authRoutes.js             # Login/Register
│   │   ├── tripRoutes.js             # Trip CRUD
│   │   └── ticketRoutes.js           # Booking endpoints
│   ├── server.js                     # Express setup
│   ├── package.json                  # Dependencies
│   └── .env                          # Config (JWT_SECRET, DB_HOST, etc)
│
├── database/
│   ├── schema.sql                    # Database tables & indexes
│   └── seed.sql                      # Demo data (2 users, 6 trips, 2 tickets)
│
├── docker-compose.yml                # Service orchestration
└── README.md                         # This file
```

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register              # Create user account
POST   /api/auth/login                 # Get JWT token + user profile
GET    /api/auth/me                    # Get current user (protected)
```

### Buses
```
GET    /api/buses                      # List all buses
POST   /api/buses                      # Create bus (admin only)
PUT    /api/buses/:id                  # Update bus (admin only)
DELETE /api/buses/:id                  # Delete bus (admin only)
```

### Routes
```
GET    /api/routes                     # List all routes with coordinates
POST   /api/routes                     # Create route (admin only)
PUT    /api/routes/:id                 # Update route (admin only)
DELETE /api/routes/:id                 # Delete route (admin only)
```

### Trips
```
GET    /api/trips                      # List trips (optional: ?routeId=1)
POST   /api/trips                      # Schedule trip (admin only)
PUT    /api/trips/:id                  # Update trip (admin only)
DELETE /api/trips/:id                  # Cancel trip (admin only)
```

### Tickets
```
GET    /api/tickets                    # Get user's tickets (protected)
POST   /api/tickets                    # Create booking (protected)
GET    /api/tickets/trip/:tripId/booked-seats  # Check seat availability
PATCH  /api/tickets/:id/cancel         # Cancel ticket (protected)
GET    /api/tickets/:ticketId/events            # Get ticket passenger events (owner/admin)
POST   /api/tickets/:ticketId/events/board      # Record boarding event (admin)
POST   /api/tickets/:ticketId/events/alight     # Record alighting event (admin)
GET    /api/tickets/trips/:tripId/passenger-flow # Stop-level flow summary (admin)
```

### Locations
```
GET    /api/locations                  # Get all bus locations
```

---

## 🔐 Demo Credentials

The database is pre-seeded with 2 users:

| Email | Password | Role |
|-------|----------|------|
| admin@dhakabus.com | admin123 | admin |
| user@dhakabus.com | user123 | user |

---

## Quick Start

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
docker-compose up --build
```

Then open **http://localhost** in your browser. That's it!

**Demo accounts:**
- Admin: `admin@dhakabus.com` / `admin123`
- User: `user@dhakabus.com` / `user123`

---

## What's Next?

- WebSocket for real-time bus updates (instead of polling)
- Payment integration (Stripe, bKash, Nagad)
- Admin analytics dashboard
- Mobile app (React Native)
- SMS/Email notifications

---

## 🤝 Contributing

We welcome contributions. Please see [SETUP.md](SETUP.md) for the contribution workflow.

---

## 📝 License

This project is open source and available under the MIT License.

---

## Questions?

- Check [SETUP.md](SETUP.md) for setup and contribution help
- Open an issue on GitHub
