// Main Express Server File
// This is the heart of the backend - it sets up the Express app and all routes

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');

// Import route files
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Initialize Express app
const app = express();

// Middleware - these run before routes
// Body parser - allows us to receive JSON data in request bodies
app.use(express.json());

// CORS - allows frontend to call backend API
// In Docker, frontend runs on localhost:5173 and backend on localhost:3000
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Backend itself (for testing)
      process.env.FRONTEND_URL || 'http://localhost:5173', // From environment
    ],
    credentials: true,
  })
);

// Health check endpoint - useful to verify backend is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
// These lines connect our route files to specific URL paths
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
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
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for frontend on http://localhost:5173`);
});
