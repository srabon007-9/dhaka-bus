# Dhaka Bus Tracking System

A real-time bus tracking app for Dhaka. You can see where buses are on a map and measure distances.

## What This App Does

- 🗺️ **See Buses on Map** - Watch buses move in real-time
- 📍 **Interactive Map** - Click on the map to see bus locations  
- 📏 **Measure Distances** - Calculate road distances between places
- 🔍 **Search Buses** - Find buses by route or name
- 🚌 **See Routes** - View complete bus routes on the map

## Quick Start (Easiest Way)

### ⚠️ IMPORTANT: Install Docker First!

**Docker is REQUIRED!** It's software that runs the entire app. Without it, nothing works.

**Steps to install Docker:**
1. Go to: https://www.docker.com/products/docker-desktop
2. Click "Download for Mac" (Mac) or "Download for Windows" (Windows)
3. Install it like any other app
4. Open Docker app from your computer
5. Wait until Docker is fully running (you'll see a Docker icon)

### Prerequisites
- ✅ Docker installed and running (VERY IMPORTANT!)
- ✅ Git installed

### Installation (Copy and Paste These Commands)

```bash
# 1. Copy this and open Terminal or Command Prompt
# 2. Paste this command:
git clone https://github.com/srabon007-9/dhaka-bus.git

# 3. Go into the folder:
cd dhaka-bus

# 4. Start the app (this will take 1-2 minutes):
docker-compose up --build

# 5. Open your web browser and go to:
# http://localhost
```

That's it! The app is now running.

You will see:
- **Frontend** at: http://localhost (the website)
- **Backend API** at: http://localhost:3000 (the server)
- **Database** at: localhost:3306 (where data is stored)

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
