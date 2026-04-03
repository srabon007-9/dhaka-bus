// Express server setup
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

// Parse JSON, keep raw body for webhooks
app.use(express.json({
  verify: (req, _res, buf) => {
    if (req.originalUrl === '/api/tickets/payment/webhook') {
      req.rawBody = buf;
    }
  },
}));

// Allow frontend requests
app.use(
  cors({
    origin: (origin, callback) => {
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

// Bus simulators
let busSimulators = {};
let liveBroadcastInterval = null;
let simulatorRecoveryInterval = null;
let simulatorInitState = {
  status: 'idle',
  expected: 0,
  initialized: 0,
  failedBusIds: [],
  lastInitializedAt: null,
  lastError: null,
};

const updateSimulatorState = (patch) => {
  simulatorInitState = {
    ...simulatorInitState,
    ...patch,
    initialized: Object.keys(busSimulators).length,
  };
};

const stopAllBusSimulations = () => {
  Object.values(busSimulators).forEach((sim) => {
    try {
      sim.stop();
    } catch (error) {
      console.error('Error stopping bus simulator:', error.message);
    }
  });
  busSimulators = {};
};

const startBusSimulator = async (bus) => {
  const simulator = new OSRMBusSimulator(bus.id, 2000);
  await simulator.start();
  busSimulators[bus.id] = simulator;
  updateSimulatorState({ failedBusIds: simulatorInitState.failedBusIds.filter((id) => id !== bus.id) });
};

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

const initializeBusSimulations = async ({ fullRestart = false } = {}) => {
  try {
    console.log('\n📡 Initializing Bus Simulations...');
    if (fullRestart) {
      stopAllBusSimulations();
    }

    updateSimulatorState({
      status: 'initializing',
      failedBusIds: [],
      lastError: null,
      lastInitializedAt: null,
    });

    const buses = await busModel.getAllBuses();
    const activeBuses = buses.filter((bus) => bus.status === 'active');
    updateSimulatorState({ expected: activeBuses.length });

    if (activeBuses.length === 0) {
      console.log('⚠️  No active buses found. Bus simulation will not start.');
      updateSimulatorState({
        status: 'ready',
        expected: 0,
        failedBusIds: [],
        lastInitializedAt: new Date().toISOString(),
      });
      return;
    }

    const failedBuses = [];
    for (const bus of activeBuses) {
      if (busSimulators[bus.id]) continue;

      try {
        await startBusSimulator(bus);
      } catch (error) {
        console.error(`❌ Failed to initialize simulator for Bus ${bus.id}:`, error.message);
        failedBuses.push(bus);
      }
    }

    if (failedBuses.length > 0) {
      console.log(`🔁 Retrying ${failedBuses.length} failed simulator(s)...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (const bus of failedBuses) {
        if (busSimulators[bus.id]) continue;
        try {
          await startBusSimulator(bus);
        } catch (error) {
          console.error(`❌ Retry failed for Bus ${bus.id}:`, error.message);
        }
      }
    }

    const failedBusIds = activeBuses
      .filter((bus) => !busSimulators[bus.id])
      .map((bus) => bus.id);

    updateSimulatorState({
      status: failedBusIds.length ? 'degraded' : 'ready',
      failedBusIds,
      lastInitializedAt: new Date().toISOString(),
    });

    console.log(`✅ Initialized ${Object.keys(busSimulators).length} bus simulator(s)\n`);
  } catch (error) {
    console.error('❌ Error initializing bus simulations:', error.message);
    updateSimulatorState({
      status: 'error',
      failedBusIds: simulatorInitState.expected ? Array.from({ length: simulatorInitState.expected }) : [],
      lastError: error.message,
      lastInitializedAt: new Date().toISOString(),
    });
  }
};

const ensureBusSimulationsHealthy = async () => {
  if (simulatorInitState.status === 'initializing') {
    return;
  }

  const expected = simulatorInitState.expected || 0;
  const actual = Object.keys(busSimulators).length;
  if (expected > 0 && actual >= expected) {
    return;
  }

  console.warn(`🔁 Simulator recovery triggered (${actual}/${expected} running)`);
  await initializeBusSimulations();
};

const emitLatestLocations = async () => {
  try {
    const latest = await locationModel.getLatestLocations();
    io.emit('locations:snapshot', enrichLocationsWithSimulatorState(latest));
  } catch (error) {
    console.error('Error emitting live locations:', error.message);
  }
};

io.on('connection', async (socket) => {
  try {
    console.log(`👤 Client connected: ${socket.id}`);
    const latest = await locationModel.getLatestLocations();
    socket.emit('locations:snapshot', enrichLocationsWithSimulatorState(latest));
    socket.on('disconnect', () => {
      console.log(`👤 Client disconnected: ${socket.id}`);
    });
  } catch (error) {
    console.error('Error in Socket.IO connection:', error.message);
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    simulators: Object.keys(busSimulators).length,
    simulator_status: simulatorInitState.status,
    expected_simulators: simulatorInitState.expected,
    failed_simulators: simulatorInitState.failedBusIds,
    last_simulator_init_at: simulatorInitState.lastInitializedAt,
    simulator_error: simulatorInitState.lastError,
  });
});

app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tickets', ticketRoutes);

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`\n✅ Backend on port ${PORT}\n`);

  await initializeBusSimulations({ fullRestart: true });
  if (!liveBroadcastInterval) {
    liveBroadcastInterval = setInterval(() => {
      emitLatestLocations();
    }, 3000);
  }

  if (!simulatorRecoveryInterval) {
    simulatorRecoveryInterval = setInterval(() => {
      ensureBusSimulationsHealthy().catch((error) => {
        console.error('Error during simulator recovery:', error.message);
      });
    }, 30000);
  }
});

const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  if (liveBroadcastInterval) clearInterval(liveBroadcastInterval);
  if (simulatorRecoveryInterval) clearInterval(simulatorRecoveryInterval);
  stopAllBusSimulations();

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
