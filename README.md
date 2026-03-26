# 🚌 Dhaka Bus Service

Real-time bus tracking and ticket booking platform for Dhaka.

Built with React, Node.js/Express, MySQL, and Docker.

---

## 🚀 **New Here? 👋**

**If you forked the repo or this is your first time**, start here:  
📖 **[FRIEND_GETTING_STARTED.md](./FRIEND_GETTING_STARTED.md)** ← Step-by-step beginner guide

This walks you through:
- Installing Docker
- Running the app with one command
- Testing all features
- Making your first code change
- Contributing back

---

## 📋 Project Overview

**Dhaka Bus Service** is a comprehensive transportation management platform inspired by Uber, Pathao, and modern airline booking systems. It provides:

- **Live Bus Tracking**: Real-time GPS locations of buses on an interactive map
- **Smart Booking System**: Step-by-step seat selection with availability tracking
- **Admin Dashboard**: Full CRUD operations for buses, routes, and trip schedules
- **User Authentication**: JWT-based login/register with role-based access control
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with Vite (fast build tool)
- **Styling**: Tailwind CSS with custom animations (Framer Motion)
- **Map**: Leaflet + OpenStreetMap for real-time bus tracking
- **State Management**: React Context API (AuthContext for global auth state)
- **HTTP Client**: Axios for API calls
- **Build Size**: ~180KB gzipped (production)

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5.2.1
- **Authentication**: JWT (jsonwebtoken ^9.0.2)
- **Password Hashing**: bcryptjs (10 salt rounds for security)
- **API Format**: RESTful JSON endpoints
- **CORS**: Enabled for frontend integration

### Database
- **System**: MySQL 8.0
- **Tables**: 6 tables (buses, locations, routes, users, trips, tickets)
- **Relationships**: Foreign keys between trips/buses/routes/users
- **Indexes**: Performance optimized queries

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Frontend Server**: Nginx (reverse proxy)
- **Environment**: Isolated MySQL, Node, and Nginx containers
- **Health Checks**: All services monitored

---

## 🎯 Core Features (Phase 2 Complete)

### 1. Authentication & Security
```
✅ User Registration (name, email, password)
✅ Login with JWT token generation (7-day expiry)
✅ Password hashing (bcryptjs)
✅ Role-based access control (admin vs regular user)
✅ Protected routes and endpoints
✅ Session persistence in localStorage
```

### 2. Live Bus Tracking
```
✅ Real-time map with Leaflet/OpenStreetMap
✅ Bus location markers with speed/status indicators
✅ Route visualization (polylines on map)
✅ Live updates every 6 seconds
✅ Full-screen interactive map
✅ Search and filter buses by name/route
```

### 3. Smart Booking System
```
✅ Step-by-step booking flow (4 steps):
   - Select route
   - Choose trip (departure time, fare)
   - Pick seats (visual grid layout)
   - Confirm booking
✅ Real-time seat availability checking
✅ Prevent double-booking with seat conflict detection
✅ Instant ticket confirmation with ticket ID
✅ Passenger name field (auto-filled with logged-in user)
```

### 4. Ticket Management
```
✅ View all user bookings with trip details
✅ Cancel ticket with ownership/admin verification
✅ Display booking status (active/cancelled)
✅ Show route name, departure time, seat numbers
✅ Display ticket ID and total fare
```

### 5. Admin Dashboard
```
✅ Full CRUD for Buses (Create, Read, Update, Delete)
✅ Full CRUD for Routes (with coordinates for map)
✅ Full CRUD for Trips (scheduled departures)
✅ Edit modal with pre-populated forms
✅ Data tables with action buttons
✅ Real-time data sync with backend
✅ Admin-only access with role verification
```

### 6. User Interface
```
✅ Dark theme with cyan/blue accents
✅ Responsive navbar with role-aware links
✅ Hero page with feature cards
✅ Glass-morphism design (frosted glass effect)
✅ Smooth page transitions (Framer Motion)
✅ Toast notifications for user feedback
✅ Loading skeletons and error states
```

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

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Installation & Running

```bash
# 1. Clone repository
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus

# 2. Start all services (MySQL, Backend, Frontend)
docker-compose up --build

# 3. Open in browser
# Frontend:  http://localhost
# Backend:   http://localhost:3000
# Database:  localhost:3306
```

That's it! The database will auto-initialize with schema and seed data.

### Stopping Services
```bash
docker-compose down
```

---

## 🛣️ Roadmap (Future Phases)

### Phase 3: Real-time Features
- [ ] WebSocket for live bus tracking (instead of 6s polling)
- [ ] Real-time notifications for booking confirmations
- [ ] SMS/Email alerts

### Phase 4: Payment Integration
- [ ] Stripe/AamarpayPayment gateway
- [ ] Transaction history
- [ ] Invoice generation

### Phase 5: Analytics & Reporting
- [ ] Admin revenue dashboard
- [ ] Route utilization metrics
- [ ] Peak hours analysis
- [ ] User behavior analytics

### Phase 6: Mobile App
- [ ] React Native mobile version
- [ ] Push notifications
- [ ] Offline mode

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
