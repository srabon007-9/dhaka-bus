// Main Express Server File
// This is the heart of the backend - it sets up the Express app and all routes

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const locationModel = require('./models/locationModel');
const busModel = require('./models/busModel');
const OSRMBusSimulator = require('./models/osrmBusSimulation');

// Import route files
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const stopRoutes = require('./routes/stopRoutes');
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Initialize Express app
const app = express();

const allowedOrigins = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:80',
  'http://127.0.0.1:80',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware - these run before routes
// Body parser - allows us to receive JSON data in request bodies
app.use(express.json());

// CORS - allows frontend to call backend API
// In Docker, frontend runs on localhost:5173 and backend on localhost:3000
app.use(
  cors({
    origin: (origin, callback) => {
      // allow curl/postman/same-origin requests with no Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

// ============================================
// ROUTE-BASED BUS SIMULATION
// ============================================

// Global variable to hold bus simulator instances
let busSimulators = {};

const enrichLocationsWithSimulatorState = (locations) => {
  if (!Array.isArray(locations)) return [];

  return locations.map((location) => {
    const simulator = busSimulators[location.bus_id];
    if (!simulator) return location;

    const state = simulator.getState();
    return {
      ...location,
      eta_minutes: state.etaMinutes,
      next_stop: state.nextStop,
      direction: state.direction,
      is_moving: state.isMoving,
      route_progress: state.distanceRatio,
    };
  });
};

/**
 * Initialize bus simulations for all active buses
 * Runs on server startup
 */
const initializeBusSimulations = async () => {
  try {
    console.log('\n📡 Initializing Bus Simulations...');

    // Get all active buses
    const buses = await busModel.getAllBuses();
    const activeBuses = buses.filter((bus) => bus.status === 'active');

    if (activeBuses.length === 0) {
      console.log('⚠️  No active buses found. Bus simulation will not start.');
      return;
    }

    const failedBuses = [];

    // Create simulator for each active bus
    for (const bus of activeBuses) {
      try {
        const simulator = new OSRMBusSimulator(bus.id, 2000); // Update every 2 seconds
        await simulator.start();
        busSimulators[bus.id] = simulator;
      } catch (error) {
        console.error(`❌ Failed to initialize simulator for Bus ${bus.id}:`, error.message);
        failedBuses.push(bus);
      }
    }

    // Retry failed initializations once (helps with transient OSRM/network failures)
    if (failedBuses.length > 0) {
      console.log(`🔁 Retrying ${failedBuses.length} failed simulator(s)...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (const bus of failedBuses) {
        if (busSimulators[bus.id]) continue;
        try {
          const simulator = new OSRMBusSimulator(bus.id, 2000);
          await simulator.start();
          busSimulators[bus.id] = simulator;
        } catch (error) {
          console.error(`❌ Retry failed for Bus ${bus.id}:`, error.message);
        }
      }
    }

    console.log(`✅ Initialized ${Object.keys(busSimulators).length} bus simulator(s)\n`);
  } catch (error) {
    console.error('❌ Error initializing bus simulations:', error.message);
  }
};

/**
 * Emit latest locations to all connected Socket.IO clients
 */
const emitLatestLocations = async () => {
  try {
    const latest = await locationModel.getLatestLocations();
    io.emit('locations:snapshot', enrichLocationsWithSimulatorState(latest));
  } catch (error) {
    console.error('Error emitting live locations:', error.message);
  }
};

// Socket.IO connection handler
io.on('connection', async (socket) => {
  try {
    console.log(`👤 Client connected: ${socket.id}`);

    // Send initial locations snapshot
    const latest = await locationModel.getLatestLocations();
    socket.emit('locations:snapshot', enrichLocationsWithSimulatorState(latest));

    // Emit locations every 3 seconds (syncs with bus movement)
    const emitInterval = setInterval(() => {
      emitLatestLocations();
    }, 3000);

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log(`👤 Client disconnected: ${socket.id}`);
      clearInterval(emitInterval);
    });
  } catch (error) {
    console.error('Error in Socket.IO connection:', error.message);
  }
});

// Health check endpoint - useful to verify backend is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    simulators: Object.keys(busSimulators).length,
  });
});

// Mount routes
// These lines connect our route files to specific URL paths
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tickets', ticketRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Dhaka Bus Tracking API',
    version: '1.0.0',
    endpoints: {
      buses: '/api/buses',
      routes: '/api/routes',
      stops: '/api/stops/:routeId',
      locations: '/api/locations',
      auth: '/api/auth',
      trips: '/api/trips',
      tickets: '/api/tickets',
      health: '/api/health',
    },
  });
});

// 404 handler - if request doesn't match any route above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for localhost`);
  console.log(`${'='.repeat(50)}\n`);

  // Initialize bus simulations after server starts
  await initializeBusSimulations();
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');

  // Stop all bus simulators
  Object.values(busSimulators).forEach((simulator) => {
    simulator.stop();
  });

  process.exit(0);
});
