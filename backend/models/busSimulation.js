// Bus Simulation Model - Manages realistic route-based bus movement with waypoint following

const locationModel = require('./locationModel');
const busStopModel = require('./busStopModel');
const busModel = require('./busModel');
const routeWaypointModel = require('./routeWaypointModel');

/**
 * BusSimulator - Manages a bus moving along a route using waypoints
 * Features:
 * - Follows realistic road-based waypoints instead of straight lines
 * - Moves bus between stops sequentially via waypoints
 * - Pauses at each stop
 * - Loops back to start when reaching end
 */
class BusSimulator {
  constructor(busId, routeId, updateIntervalMs = 2000) {
    this.busId = busId;
    this.routeId = routeId;
    this.updateIntervalMs = updateIntervalMs;
    
    this.stops = []; // All stops for this route
    this.routeWaypoints = []; // All waypoints organized by segment
    this.waypointsBySegment = new Map(); // Map of segment → waypoints
    
    this.currentStopIndex = 0; // Which stop we're at (0-based)
    this.nextStopIndex = 1; // Which stop we're heading to
    this.isMoving = false; // Are we between stops?
    
    this.currentSegmentWaypoints = []; // Waypoints for current segment
    this.currentWaypointIndex = 0; // Current position in waypoints array
    this.waypointProgress = 0; // 0-1, progress to next waypoint
    
    this.currentPosition = null; // Current lat/lng
    this.pauseTimer = null; // Timer for pause at stop
    this.simulationTimer = null; // Main update timer
    this.isPaused = false; // System pause state
  }

  /**
   * Initialize the simulator with stops and waypoints from database
   */
  async initialize() {
    try {
      this.stops = await busStopModel.getStopsByRouteId(this.routeId);
      
      if (!this.stops || this.stops.length === 0) {
        throw new Error(`No stops found for route ${this.routeId}`);
      }

      // Load all waypoints for this route
      this.routeWaypoints = await routeWaypointModel.getWaypointsByRouteId(this.routeId);
      
      if (!this.routeWaypoints || this.routeWaypoints.length === 0) {
        console.warn(`⚠️  No waypoints found for route ${this.routeId}, using straight-line interpolation`);
      }

      // Organize waypoints by segment
      for (const waypoint of this.routeWaypoints) {
        const segmentKey = `${waypoint.stop_from_order}-${waypoint.stop_to_order}`;
        if (!this.waypointsBySegment.has(segmentKey)) {
          this.waypointsBySegment.set(segmentKey, []);
        }
        this.waypointsBySegment.get(segmentKey).push(waypoint);
      }

      // Start at first stop
      this.currentStopIndex = 0;
      this.nextStopIndex = 1;
      this.currentPosition = {
        latitude: Number(this.stops[0].latitude),
        longitude: Number(this.stops[0].longitude),
      };
      this.isMoving = false;
      this.currentWaypointIndex = 0;
      this.waypointProgress = 0;

      console.log(`✅ BusSimulator initialized for Bus ${this.busId} on Route ${this.routeId}`);
      console.log(`   Total stops: ${this.stops.length}`);
      console.log(`   Total waypoints: ${this.routeWaypoints.length}`);
      console.log(`   Starting at: ${this.stops[0].stop_name}`);

      return true;
    } catch (error) {
      console.error(`❌ Error initializing BusSimulator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save current position to database
   */
  async saveLocation() {
    try {
      if (!this.currentPosition) return;

      await locationModel.updateLocation({
        bus_id: this.busId,
        latitude: this.currentPosition.latitude,
        longitude: this.currentPosition.longitude,
      });
    } catch (error) {
      console.error(`Error saving location for bus ${this.busId}:`, error.message);
    }
  }

  /**
   * Get the current stop object
   */
  getCurrentStop() {
    return this.stops[this.currentStopIndex];
  }

  /**
   * Get the next stop object (or wrap around if at end)
   */
  getNextStop() {
    const nextIndex = (this.nextStopIndex) % this.stops.length;
    return this.stops[nextIndex];
  }

  /**
   * Get waypoints for current segment, or create fallback straight-line waypoints
   */
  getCurrentSegmentWaypoints() {
    const currentStop = this.getCurrentStop();
    const nextStop = this.getNextStop();
    
    // Use actual stop_order values from the stops, not array indices
    const segmentKey = `${currentStop.stop_order}-${nextStop.stop_order}`;
    let waypoints = this.waypointsBySegment.get(segmentKey);

    // Fallback: create straight-line waypoints if not defined
    if (!waypoints || waypoints.length === 0) {
      // Create 5 intermediate points for smooth movement
      waypoints = [];
      for (let i = 0; i <= 4; i++) {
        const progress = i / 4;
        waypoints.push({
          latitude: Number(currentStop.latitude) + (Number(nextStop.latitude) - Number(currentStop.latitude)) * progress,
          longitude: Number(currentStop.longitude) + (Number(nextStop.longitude) - Number(currentStop.longitude)) * progress,
        });
      }
    }

    return waypoints;
  }

  /**
   * Interpolate between two waypoints
   */
  interpolateWaypoints(from, to, progress) {
    const fromLat = Number(from.latitude);
    const fromLng = Number(from.longitude);
    const toLat = Number(to.latitude);
    const toLng = Number(to.longitude);

    return {
      latitude: fromLat + (toLat - fromLat) * progress,
      longitude: fromLng + (toLng - fromLng) * progress,
    };
  }

  /**
   * Update bus position (called every update interval)
   */
  async update() {
    if (this.isPaused) return;

    if (!this.isMoving) {
      // Bus is at a stop - start moving after pause
      this.startMoving();
      return;
    }

    // Bus is moving between stops via waypoints
    if (this.currentSegmentWaypoints.length === 0) {
      this.currentSegmentWaypoints = this.getCurrentSegmentWaypoints();
      this.currentWaypointIndex = 0;
      this.waypointProgress = 0;
    }

    // Increment waypoint progress
    const movingSpeed = 0.08; // Speed between waypoints
    this.waypointProgress += movingSpeed;

    if (this.waypointProgress >= 1) {
      // Move to next waypoint
      this.currentWaypointIndex += 1;
      this.waypointProgress = 0;

      if (this.currentWaypointIndex >= this.currentSegmentWaypoints.length) {
        // Reached the end of this segment - arrived at next stop
        this.currentStopIndex = (this.currentStopIndex + 1) % this.stops.length;
        this.nextStopIndex = (this.nextStopIndex + 1) % this.stops.length;
        this.isMoving = false;
        this.currentWaypointIndex = 0;
        this.waypointProgress = 0;
        this.currentSegmentWaypoints = [];

        // Position at new stop
        const newStop = this.getCurrentStop();
        this.currentPosition = {
          latitude: Number(newStop.latitude),
          longitude: Number(newStop.longitude),
        };

        console.log(
          `🚌 Bus ${this.busId} arrived at: ${newStop.stop_name} (Stop ${this.currentStopIndex + 1}/${this.stops.length})`
        );

        // Pause at stop before moving again
        this.pauseAtStop();
        await this.saveLocation();
        return;
      }
    }

    // Interpolate position between current waypoint and next
    if (this.currentWaypointIndex < this.currentSegmentWaypoints.length - 1) {
      const currentWaypoint = this.currentSegmentWaypoints[this.currentWaypointIndex];
      const nextWaypoint = this.currentSegmentWaypoints[this.currentWaypointIndex + 1];

      this.currentPosition = this.interpolateWaypoints(
        currentWaypoint,
        nextWaypoint,
        this.waypointProgress
      );
    }

    // Save to database
    await this.saveLocation();
  }

  /**
   * Pause at a stop (5-8 seconds simulating passenger loading)
   */
  pauseAtStop() {
    const pauseDuration = 5000 + Math.random() * 3000; // 5-8 seconds
    console.log(`⏸️  Bus ${this.busId} pausing at stop for ${Math.round(pauseDuration / 1000)}s`);

    this.pauseTimer = setTimeout(() => {
      this.isMoving = true;
      console.log(`▶️  Bus ${this.busId} resuming movement`);
    }, pauseDuration);
  }

  /**
   * Start moving from current stop to next
   */
  startMoving() {
    if (!this.isMoving && !this.pauseTimer) {
      this.isMoving = true;
      console.log(`▶️  Bus ${this.busId} starting to move`);
    }
  }

  /**
   * Start the simulation
   */
  async start() {
    try {
      // Initialize first
      await this.initialize();

      // Save initial position
      await this.saveLocation();

      // Pause at first stop briefly
      this.pauseAtStop();

      // Start update loop
      this.simulationTimer = setInterval(() => this.update(), this.updateIntervalMs);

      console.log(`🚀 BusSimulator started for Bus ${this.busId}\n`);
      return true;
    } catch (error) {
      console.error(`❌ Error starting BusSimulator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the simulation
   */
  stop() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    console.log(`🛑 BusSimulator stopped for Bus ${this.busId}`);
  }

  /**
   * Pause the simulation
   */
  pause() {
    this.isPaused = true;
    console.log(`⏸️  BusSimulator paused for Bus ${this.busId}`);
  }

  /**
   * Resume the simulation
   */
  resume() {
    this.isPaused = false;
    console.log(`▶️  BusSimulator resumed for Bus ${this.busId}`);
  }

  /**
   * Get current bus state for debugging
   */
  getState() {
    return {
      busId: this.busId,
      routeId: this.routeId,
      currentStop: this.stops[this.currentStopIndex],
      currentStopIndex: this.currentStopIndex + 1, // 1-indexed for display
      totalStops: this.stops.length,
      isMoving: this.isMoving,
      waypointProgress: Math.round(this.waypointProgress * 100),
      currentWaypointIndex: this.currentWaypointIndex,
      totalWaypoints: this.currentSegmentWaypoints.length,
      currentPosition: this.currentPosition,
      isPaused: this.isPaused,
    };
  }
}

module.exports = BusSimulator;

