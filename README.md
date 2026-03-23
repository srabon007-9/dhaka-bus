# 🚌 Dhaka Bus Tracking System

A production-ready **real-time bus location tracking application** built with **React, Node.js, MySQL, and Leaflet mapping**.

## ✨ Features

- **🗺️ Interactive Map** - Real-time bus location tracking with OpenStreetMap
- **📏 Distance Measurement** - Measure road distances between locations using OSRM routing
- **🔍 Smart Search** - Search buses by name, route, or location
- **⚡ Real-time Updates** - Live bus position updates every 5 seconds
- **🎨 Modern UI** - Beautiful, responsive design with Tailwind CSS
- **🐳 Dockerized** - One-command deployment
- **📊 RESTful API** - Well-documented endpoints

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/dhaka-bus.git
cd dhaka-bus

# Start with Docker
docker-compose up --build

# Visit http://localhost
```

**That's it!** The application will be running with:
- Frontend: http://localhost
- Backend API: http://localhost:3000/api
- MySQL Database: localhost:3306

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React 19 + Vite | Fast build, modern framework |
| Styling | Tailwind CSS 4.2 | Utility-first, responsive |
| Maps | Leaflet + OpenStreetMap | Free, no API key needed |
| Routing | OSRM | Free road distance calculation |
| Backend | Node.js 22 + Express 5.2 | Simple, scalable REST API |
| Database | MySQL 8.0 | Relational data, perfect for routes/buses |
| Containerization | Docker + Docker Compose | Consistent dev/prod setup |

---

## 📁 Project Structure

```
dhaka-bus/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx         # Leaflet + distance measurement
│   │   │   ├── BusSearch.jsx   # Search component
│   │   │   └── BusList.jsx     # Bus list display
│   │   ├── App.jsx             # Main app component
│   │   └── App.css             # Tailwind styles
│   ├── Dockerfile              # Frontend container
│   ├── nginx.conf              # Nginx reverse proxy
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── server.js              # Express app & middleware
│   ├── config/database.js     # MySQL connection pool
│   ├── models/                # Data access layer
│   │   ├── busModel.js
│   │   ├── routeModel.js
│   │   └── locationModel.js
│   ├── routes/                # API endpoints
│   │   ├── busRoutes.js
│   │   ├── routeRoutes.js
│   │   └── locationRoutes.js
│   ├── Dockerfile
│   └── package.json
│
├── database/                   # MySQL setup
│   ├── schema.sql            # Table definitions (3 tables)
│   └── seed.sql              # Sample Dhaka bus data
│
├── docker-compose.yml        # Multi-container orchestration
├── CONTRIBUTING.md           # Contribution guidelines
├── README.md                 # This file
└── .env.example              # Environment variables template
```
│   ├── server.js               # Express app
│   ├── Dockerfile              # Backend container
│   └── package.json
│
├── database/                    # SQL files
│   ├── schema.sql              # Table definitions
│   └── seed.sql                # Sample data
│
└── docker-compose.yml          # Orchestration

```

---

## 🚀 Quick Start (With Docker - Recommended)

### Prerequisites

- **Docker**: https://www.docker.com/products/docker-desktop
  - Works on Windows, Mac, Linux
- **Git** (optional, for version control)

### Run Everything with One Command

```bash
# Navigate to project directory
cd /Users/srabonahmed/Programming/Projects/dhaka-bus

# Start all services (frontend, backend, mysql)
docker-compose up --build

# Wait for services to start (~30 seconds)
# You'll see: "✅ Backend server running on port 3000"
```

### Access the Application

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### Stop Services

```bash
# Press Ctrl+C in terminal, or in another terminal run:
docker-compose down

# To remove all data:
docker-compose down -v
```

---

## 🛠️ Local Development (Without Docker)

### Prerequisites

- **Node.js**: v18+ (https://nodejs.org)
- **MySQL**: v8.0 (https://dev.mysql.com/downloads/mysql/)

### Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create .env file (copy from .env.example)
cp .env.example .env

# Install dependencies
npm install

# Start backend server (runs on port 3000)
npm run dev
```

### Setup Frontend

```bash
# In another terminal, navigate to frontend
cd frontend

# Create .env.local file
cp .env.example .env.local

# Install dependencies
npm install

# Start frontend dev server (runs on port 5173)
npm run dev
```

### Setup Database

```bash
# Connect to MySQL
mysql -u root -p

# Run in MySQL prompt:
# Source schema first
source /path/to/database/schema.sql

# Then source seed data
source /path/to/database/seed.sql

# Exit
exit
```

---

## 📡 API Endpoints

All endpoints return JSON. Base URL: `http://localhost:3000/api`

### Buses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/buses` | Get all buses |
| GET | `/buses/:id` | Get bus by ID |
| GET | `/buses/route/:name` | Get buses by route name |
| POST | `/buses` | Add new bus |

**Example Request:**
```bash
curl http://localhost:3000/api/buses
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bus 25A",
      "route_name": "Gulshan to Motijheel",
      "start_point": "Gulshan Circle",
      "end_point": "Motijheel"
    }
  ]
}
```

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes` | Get all routes |
| GET | `/routes/:id` | Get route by ID |
| GET | `/routes/by-name/:name` | Get route by name |
| POST | `/routes` | Add new route |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/locations` | Get all locations |
| GET | `/locations/latest/:busId` | Get latest location for bus |
| GET | `/locations/history/:busId` | Get location history |
| POST | `/locations` | Update bus location |

---

## 🧪 Testing APIs

### Using cURL (Command Line)

```bash
# Get all buses
curl http://localhost:3000/api/buses

# Get buses by route
curl "http://localhost:3000/api/buses/route/Gulshan%20to%20Motijheel"

# Get latest location for bus 1
curl http://localhost:3000/api/locations/latest/1

# Update a bus location
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{"bus_id": 1, "latitude": 23.8103, "longitude": 90.4189}'
```

### Using Postman (GUI)

1. Download Postman: https://www.postman.com/downloads/
2. Create new request
3. Set method to GET/POST
4. Enter URL: `http://localhost:3000/api/buses`
5. Click "Send"

### Using Thunder Client (VS Code Extension)

1. Install "Thunder Client" extension in VS Code
2. Click Thunder Client icon
3. Create new request
4. Set URL and method
5. Click "Send"

---

## 🐳 Docker Explanation

### What is Docker?

Think of Docker like a **shipping container** for software. Your app runs inside a container with everything it needs (Node, Express, MySQL).

### Why Docker?

- Same container works on Windows, Mac, and Linux
- No "works on my machine" problems
- Easy to share and deploy
- Containers are lightweight and fast

### What's `docker-compose.yml`?

It orchestrates 3 containers:

1. **MySQL** (database)
   - Port: 3306
   - Persists data with volumes

2. **Backend** (Node + Express)
   - Port: 3000
   - Waits for MySQL to be healthy before starting

3. **Frontend** (Nginx + React)
   - Port: 80
   - Serves built React app

```
┌─────────────────────────────────────────┐
│        docker-compose.yml               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │ Frontend │  │ Backend  │  │MySQL │  │
│  │  :80     │  │  :3000   │  │:3306 │  │
│  └──────────┘  └──────────┘  └──────┘  │
│       ↑              ↑           ↑      │
│       └──────────────┴───────────┘      │
│        Connected via dhaka-network     │
│                                         │
└─────────────────────────────────────────┘
```

### Common Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove everything including data
docker-compose down -v

# Rebuild containers
docker-compose up --build
```

---

## 🌍 Deployment

### Deploy Frontend to Vercel

1. **Create GitHub repo** (optional, but recommended)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/dhaka-bus.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import GitHub repo (or upload folder)
   - Select `/frontend` as root directory
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`
   - Click "Deploy"

3. **Your frontend is live!** 🎉

### Deploy Backend to Render

1. **Create GitHub repo** (if you haven't already)

2. **Deploy to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Settings:
     - Name: `dhaka-bus-backend`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Root Directory: `backend`
   - Add environment variables:
     ```
     DB_HOST=your-mysql-host
     DB_USER=your-user
     DB_PASSWORD=your-password
     DB_NAME=dhaka_bus
     FRONTEND_URL=https://your-frontend-url.vercel.app
     ```
   - Click "Create Web Service"

3. **Your backend is live!** 🚀

### Database Hosting Options

- **Managed MySQL** (Recommended):
  - Planetscale (https://planetscale.com) - Free
  - AWS RDS (https://aws.amazon.com/rds/)
  - DigitalOcean (https://www.digitalocean.com/)

- **Steps**:
  1. Create account on chosen provider
  2. Create MySQL database
  3. Note the connection details
  4. Update backend environment variables with real connection details
  5. Run migration scripts to create tables

---

## 🔍 Troubleshooting

### "Connection refused" error

**Problem**: Can't connect to backend

**Solution**:
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# If not running, start it
cd backend
npm run dev

# Or with Docker
docker-compose logs backend
```

### "Cannot GET /"

**Problem**: Frontend not loading

**Solution**:
```bash
# Check if frontend is running
curl http://localhost

# If not, start it
cd frontend
npm run dev

# Or check Docker
docker-compose logs frontend
```

### Database connection error

**Problem**: Backend can't connect to MySQL

**Solution**:
```bash
# Check MySQL is running
docker-compose ps

# Should show: mysql | running

# If not, restart services
docker-compose down
docker-compose up

# Check database created
docker-compose exec mysql mysql -u root -p'password' -e "SHOW DATABASES;"
```

### Port already in use

**Problem**: "Address already in use" error

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000---

## 🤝 Contributing

We'd love your contributions! Whether it's:
- 🐛 **Bug fixes** - Found an issue? Let's fix it
- ✨ **New features** - Ideas for improvement? Build them
- 📚 **Documentation** - Help others get started
- 🎨 **UI improvements** - Make it look even better
- 💡 **Ideas** - Suggestions for new features

### Quick Start to Contribute

```bash
# 1. Fork on GitHub (click Fork button)
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/dhaka-bus.git
cd dhaka-bus

# 3. Create feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes and test
docker-compose up --build

# 5. Commit changes
git commit -m "feat: add amazing feature"

# 6. Push and create Pull Request
git push origin feature/amazing-feature
```

**See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.**

### Areas Needing Help

**Frontend**
- [ ] Improve map visualization
- [ ] Add bus schedule display
- [ ] Real-time notifications
- [ ] Offline mode support

**Backend**
- [ ] Bus location prediction
- [ ] Historical route tracking
- [ ] User authentication
- [ ] Performance optimization

**Data**
- [ ] Add more bus routes
- [ ] Improve location accuracy
- [ ] Add timing schedules

---

## 📞 Support & Communication

- 💬 **Issues** - Report bugs or request features
- 📧 **Email** - your-email@example.com
- 🐦 **Twitter** - [@yourhandle](https://twitter.com)
- 💭 **Discussions** - Ideas and questions

---

## 📝 License

MIT License - feel free to use for personal/commercial projects

---

## 👥 Contributors

- **Your Name** - Creator & Maintainer
- **Your Friends** - Contributing team members

---

## 🙏 Acknowledgments

- Leaflet team for amazing mapping library
- OpenStreetMap contributors
- OSRM for free routing service
- React & Tailwind communities

---

**Made with ❤️ for Dhaka** 🇧🇩

If you found this helpful, please give it a ⭐!


✅ Full-stack web development
✅ Docker containerization
✅ React component architecture
✅ REST API design
✅ MySQL database design
✅ Authentication and CORS
✅ Real-time data updates
✅ Geolocation and mapping
✅ Production deployment
✅ Best practices and code organization

---

## 📞 Support

If you encounter issues:

1. Check troubleshooting section above
2. Review container logs: `docker-compose logs -f`
3. Verify all ports are available (80, 3000, 3306)
4. Ensure Docker is installed and running

---

## 📄 License

MIT License - Feel free to use this for learning and projects.

---

## 🎉 You're Ready!

Start the application:
```bash
docker-compose up --build
```

Then open: **http://localhost**

Happy tracking! 🚌📍

---

**Built with ❤️ for Dhaka Bus Tracking System**
