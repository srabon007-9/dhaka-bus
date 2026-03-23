# Dhaka Bus Tracking System

A real-time bus tracking application for Dhaka with live location updates, route visualization, and distance measurement.

## Features

- 🗺️ **Real-time Bus Tracking** - Live location updates every 5 seconds
- 📍 **Interactive Mapsed OpenStreetMap visualization
- 📏 **Distance MetMap visualizatasurement** - Calculate road distances using OSRM routing
- 🔍 **Bus Search** - Find buses by route name or number
- 🚌 **Route Visualization** - See complete bus routes on the map

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Leaflet.js  
**Backend:** Node.js, Express 5  
**Database:** MySQL 8  
**Infrastructure:** Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus

# Start with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3000
# Database: localhost:3306
```

## Project Structure

```
dhaka-bus/
├── frontend/              # React + Vite application
│   └── src/components/    # React components (Map, BusSearch, BusList)
├── backend/               # Node.js Express server
│   ├── routes/            # API endpoints
│   ├── models/            # Database queries
│   └── config/            # Database connection
├── database/              # MySQL schema & seed data
└── docker-compose.yml     # Multi-container orchestration
```

## API Endpoints

- `GET /api/buses` - Get all buses
- `GET /api/buses/:id` - Get specific bus
- `GET /api/routes` - Get all routes
- `GET /api/locations/:busId` - Get bus location history

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

MIT
