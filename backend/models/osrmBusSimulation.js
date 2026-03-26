// OSRM-based Bus Simulator - Moves bus along real road paths
// Uses OpenStreetMap Routing Machine for realistic routes

const locationModel = require('./locationModel');

/**
 * Predefined bus stops for the route (32 stops)
 * FIXED - DO NOT CHANGE
 */
const FIXED_STOPS = [
  [23.98938655966166, 90.3818798546475],
  [23.95066483463887, 90.38128847282798],
  [23.92426241836554, 90.39112019838798],
  [23.90820665012597, 90.39822728488],
  [23.864369592788783, 90.39991948098188],
  [23.851748796789437, 90.40728472294688],
  [23.83589168842585, 90.41861363348757],
  [23.818249680766108, 90.42092309823894],
  [23.81192698337956, 90.42121609002466],
  [23.794739043257984, 90.4240081294756],
  [23.789282579209125, 90.42500774852233],
  [23.777722319677522, 90.42573161058294],
  [23.773085310035285, 90.42554202767337],
  [23.76519885974831, 90.42145737738797],
  [23.750197512102233, 90.4127710324625],
  [23.749850457252247, 90.41270209317548],
  [23.744123919663114, 90.41409811295101],
  [23.73771873369362, 90.40897937401242],
  [23.737387422434946, 90.40449832303187],
  [23.733774496995064, 90.40332635593779],
  [23.734831564125905, 90.40063772532112],
  [23.738097374090664, 90.39607050031522],
  [23.739059746959317, 90.38888358406334],
  [23.738933534555322, 90.38381654956305],
  [23.73844446026129, 90.37614705845282],
  [23.74292494336979, 90.37354460205859],
  [23.750907393968806, 90.36806393204725],
  [23.75698066988753, 90.361669817067],
  [23.756060030171625, 90.35658597754784],
  [23.76502959113601, 90.3472719928998],
  [23.772629269726483, 90.34450398148928],
  [23.782693025392796, 90.3393420140131],
];

const OSRM_BASE = 'https://router.project-osrm.org';
const OSRM_ROUTE_API = `${OSRM_BASE}/route/v1/driving`;
const OSRM_MATCH_API = `${OSRM_BASE}/match/v1/driving`;
const OSRM_NEAREST_API = `${OSRM_BASE}/nearest/v1/driving`;

let sharedGeometryCache = null;
let sharedGeometryPromise = null;

function buildCoordinateString(points) {
  return points.map(([lat, lng]) => `${lng},${lat}`).join(';');
}

function toLatLngGeometry(geojsonCoordinates) {
  return geojsonCoordinates.map(([lng, lat]) => [Number(lat), Number(lng)]);
}

function removeConsecutiveDuplicates(points) {
  if (!Array.isArray(points) || points.length === 0) return [];

  const cleaned = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [prevLat, prevLng] = cleaned[cleaned.length - 1];
    const [lat, lng] = points[i];
    if (Math.abs(prevLat - lat) > 1e-6 || Math.abs(prevLng - lng) > 1e-6) {
      cleaned.push(points[i]);
    }
  }

  return cleaned;
}

function isGeometryPlausible(geometry) {
  if (!Array.isArray(geometry) || geometry.length < 2) return false;

  for (let i = 1; i < geometry.length; i++) {
    const [lat1, lng1] = geometry[i - 1];
    const [lat2, lng2] = geometry[i];
    const segmentKm = haversineDistance(lat1, lng1, lat2, lng2);
    if (!Number.isFinite(segmentKm) || segmentKm > 1.5) {
      return false;
    }
  }

  return true;
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }

  throw lastError;
}

async function snapWaypointToRoad([lat, lng]) {
  const url = `${OSRM_NEAREST_API}/${lng},${lat}?number=1`;
  try {
    const data = await fetchJson(url);
    const nearest = data?.waypoints?.[0]?.location;
    if (!Array.isArray(nearest) || nearest.length < 2) return [lat, lng];
    return [Number(nearest[1]), Number(nearest[0])];
  } catch {
    return [lat, lng];
  }
}

async function fetchMatchedGeometry(tracePoints) {
  const coordinatesString = buildCoordinateString(tracePoints);
  const timestamps = tracePoints.map((_, idx) => `${idx * 60}`).join(';');
  const url = `${OSRM_MATCH_API}/${coordinatesString}?overview=full&geometries=geojson&tidy=true&steps=false&gaps=split&annotations=false&timestamps=${timestamps}`;

  const data = await fetchJson(url);
  if (data.code !== 'Ok') {
    throw new Error(`OSRM match error: ${data.code}`);
  }

  const matchings = Array.isArray(data.matchings) ? data.matchings : [];
  if (!matchings.length) {
    throw new Error('No matchings returned from OSRM');
  }

  const merged = [];
  for (const matching of matchings) {
    const coords = matching?.geometry?.coordinates;
    if (!Array.isArray(coords) || !coords.length) continue;
    const latLng = toLatLngGeometry(coords);
    if (!merged.length) {
      merged.push(...latLng);
    } else {
      merged.push(...latLng.slice(1));
    }
  }

  const cleaned = removeConsecutiveDuplicates(merged);
  if (!isGeometryPlausible(cleaned)) {
    throw new Error('Matched geometry failed quality checks');
  }

  return cleaned;
}

async function fetchRoutedGeometry(waypoints) {
  const coordinatesString = buildCoordinateString(waypoints);
  const url = `${OSRM_ROUTE_API}/${coordinatesString}?overview=full&geometries=geojson&steps=false&alternatives=false&continue_straight=true`;

  const data = await fetchJson(url);
  if (data.code !== 'Ok') {
    throw new Error(`OSRM route error: ${data.code}`);
  }

  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || !coords.length) {
    throw new Error('No routes returned from OSRM route API');
  }

  const geometry = removeConsecutiveDuplicates(toLatLngGeometry(coords));
  if (!isGeometryPlausible(geometry)) {
    throw new Error('Routed geometry failed quality checks');
  }

  return geometry;
}

/**
 * Fetch route geometry from OSRM (match first, route fallback)
 */
async function fetchOSRMGeometry() {
  // Keep stop coordinates exact and avoid heavy nearest lookups in backend startup path.
  const cleanedWaypoints = removeConsecutiveDuplicates(FIXED_STOPS);

  if (cleanedWaypoints.length < 2) {
    throw new Error('Not enough snapped waypoints for OSRM routing');
  }

  try {
    const matchedGeometry = await fetchMatchedGeometry(cleanedWaypoints);
    console.log('🧭 OSRM geometry source: match');
    return matchedGeometry;
  } catch (matchError) {
    console.warn(`⚠️  OSRM match failed: ${matchError.message}`);
    const routedGeometry = await fetchRoutedGeometry(cleanedWaypoints);
    console.log('🧭 OSRM geometry source: route (fallback)');
    return routedGeometry;
  }
}

async function getSharedOSRMGeometry() {
  if (Array.isArray(sharedGeometryCache) && sharedGeometryCache.length > 1) {
    return sharedGeometryCache;
  }

  if (!sharedGeometryPromise) {
    sharedGeometryPromise = (async () => {
      const geometry = await fetchOSRMGeometry();
      sharedGeometryCache = geometry;
      return geometry;
    })().finally(() => {
      sharedGeometryPromise = null;
    });
  }

  return sharedGeometryPromise;
}

/**
 * Calculate coordinate at specific distance along route
 */
function getCoordinateAtDistance(geometry, distanceRatio) {
  const clampedRatio = Math.max(0, Math.min(1, distanceRatio));

  if (geometry.length === 0) return FIXED_STOPS[0];
  if (geometry.length === 1) return geometry[0];

  // Calculate total distance
  let totalDistance = 0;
  const distances = [0];

  for (let i = 1; i < geometry.length; i++) {
    const [lat1, lng1] = geometry[i - 1];
    const [lat2, lng2] = geometry[i];
    const distance = haversineDistance(lat1, lng1, lat2, lng2);
    totalDistance += distance;
    distances.push(totalDistance);
  }

  const targetDistance = totalDistance * clampedRatio;

  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      const prevDistance = distances[i - 1];
      const nextDistance = distances[i];
      const segmentProgress = (targetDistance - prevDistance) / (nextDistance - prevDistance);

      const [lat1, lng1] = geometry[i - 1];
      const [lat2, lng2] = geometry[i];

      return [
        lat1 + (lat2 - lat1) * segmentProgress,
        lng1 + (lng2 - lng1) * segmentProgress,
      ];
    }
  }

  return geometry[geometry.length - 1];
}

/**
 * Calculate haversine distance in km
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateRouteDistanceKm(geometry) {
  if (!Array.isArray(geometry) || geometry.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < geometry.length; i++) {
    total += haversineDistance(
      geometry[i - 1][0],
      geometry[i - 1][1],
      geometry[i][0],
      geometry[i][1]
    );
  }
  return total;
}

/**
 * OSRMBusSimulator - Moves bus along OSRM road geometry
 */
class OSRMBusSimulator {
  constructor(busId, updateIntervalMs = 2000) {
    this.busId = busId;
    this.updateIntervalMs = updateIntervalMs;

    this.routeGeometry = []; // Full route geometry from OSRM
    this.distanceRatio = 0; // 0-1, position along route
    this.isMoving = false;
    this.direction = 1; // 1 = forward, -1 = reverse
    this.speed = 0.0005; // Distance ratio increment per update (computed after route init)
    this.cruisingSpeedKmh = 24 + ((Math.max(1, Number(busId)) - 1) % 10) * 1.5;
    this.totalRouteDistanceKm = 0;

    this.currentPosition = null;
    this.pauseTimer = null;
    this.pauseUntilTs = null;
    this.simulationTimer = null;
    this.isPaused = false;

    this.stops = FIXED_STOPS.slice();
    this.currentStopIndex = 0;
    this.pausesAtStops = []; // Distance ratios where stops are

    // Distribute buses across different starting stops for maximum coverage
    // Buses spread across the route: Bus 1 at stop 0, Bus 2 at stop 3, etc.
    // All buses travel forward to cover the entire route
    const stopSpacing = Math.floor(this.stops.length / 10);
    this.initialStopIndex = ((Number(busId) - 1) * stopSpacing) % this.stops.length;
    this.direction = 1; // All buses travel forward
    this.initialDepartureDelayMs = 5000 + ((Math.max(1, Number(busId)) - 1) * 1000);
  }

  /**
   * Initialize the simulator
   */
  async initialize() {
    try {
      // Fetch OSRM route geometry
      this.routeGeometry = await getSharedOSRMGeometry();

      if (this.routeGeometry.length < 2) {
        throw new Error('Invalid route geometry');
      }

      // Map stops to distance ratios along the route
      this.calculateStopPositions();
      this.totalRouteDistanceKm = calculateRouteDistanceKm(this.routeGeometry);

      // Convert desired km/h speed into ratio-per-tick speed
      if (this.totalRouteDistanceKm > 0) {
        const hoursPerTick = this.updateIntervalMs / (1000 * 3600);
        const ratioPerTick = (this.cruisingSpeedKmh * hoursPerTick) / this.totalRouteDistanceKm;
        this.speed = Math.max(0.00005, ratioPerTick);
      }

      // Set starting position based on initialStopIndex (distributed across route)
      this.currentStopIndex = this.initialStopIndex;
      const stopRatio = this.pausesAtStops[this.initialStopIndex] || 0;
      this.distanceRatio = stopRatio;
      this.currentPosition = getCoordinateAtDistance(this.routeGeometry, stopRatio);
      this.isMoving = false;

      console.log(`✅ OSRMBusSimulator initialized for Bus ${this.busId}`);
      console.log(`   Route geometry: ${this.routeGeometry.length} points`);
      console.log(`   Total stops: ${this.stops.length}`);
      console.log(`   Starting at: Stop ${this.currentStopIndex + 1}/${this.stops.length}`);
      console.log(`   Direction: → Forward (covering full route)`);
      console.log(`   Initial position: [${this.currentPosition[0].toFixed(4)}, ${this.currentPosition[1].toFixed(4)}]`);

      return true;
    } catch (error) {
      console.error(`❌ Error initializing OSRMBusSimulator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate distance ratios for each stop along the route
   */
  calculateStopPositions() {
    this.pausesAtStops = [];

    for (const stop of this.stops) {
      let minDist = Infinity;
      let bestRatio = 0;

      // Find nearest point on route to this stop
      for (let i = 0; i < this.routeGeometry.length; i++) {
        const dist = haversineDistance(
          stop[0], stop[1],
          this.routeGeometry[i][0], this.routeGeometry[i][1]
        );

        if (dist < minDist) {
          minDist = dist;
          bestRatio = i / (this.routeGeometry.length - 1);
        }
      }

      this.pausesAtStops.push(bestRatio);
    }
  }

  /**
   * Save current position to database
   */
  async saveLocation() {
    try {
      const speedKmh = this.isMoving ? this.getCurrentSpeedKmh() : 0;
      await locationModel.updateLocation({
        bus_id: this.busId,
        latitude: this.currentPosition[0],
        longitude: this.currentPosition[1],
        speed_kmh: speedKmh,
      });
    } catch (error) {
      console.error(`Error saving location: ${error.message}`);
    }
  }

  getCurrentSpeedKmh() {
    return Number(this.cruisingSpeedKmh.toFixed(1));
  }

  /**
   * Pause at a stop
   */
  pauseAtStop(customDurationMs = null) {
    const pauseDuration = Number.isFinite(customDurationMs)
      ? customDurationMs
      : (5000 + Math.random() * 3000);

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    this.isMoving = false;
    this.pauseUntilTs = Date.now() + pauseDuration;
    console.log(
      `⏸️  Bus ${this.busId} pausing at stop ${this.currentStopIndex + 1}/${this.stops.length} for ${Math.round(pauseDuration / 1000)}s`
    );

    this.pauseTimer = setTimeout(() => {
      this.isMoving = true;
      this.pauseTimer = null;
      this.pauseUntilTs = null;
      console.log(`▶️  Bus ${this.busId} resuming movement`);
    }, pauseDuration);
  }

  getNextStopIndex() {
    if (this.direction === 1) {
      return (this.currentStopIndex + 1) % this.stops.length;
    }

    return (this.currentStopIndex - 1 + this.stops.length) % this.stops.length;
  }

  getEtaToNextStopMinutes() {
    if (!this.pausesAtStops.length) return null;

    const nextStopIndex = this.getNextStopIndex();
    const nextStopRatio = this.pausesAtStops[nextStopIndex];

    let deltaRatio;
    if (this.direction === 1) {
      deltaRatio = nextStopRatio >= this.distanceRatio
        ? (nextStopRatio - this.distanceRatio)
        : ((1 - this.distanceRatio) + nextStopRatio);
    } else {
      deltaRatio = nextStopRatio <= this.distanceRatio
        ? (this.distanceRatio - nextStopRatio)
        : (this.distanceRatio + (1 - nextStopRatio));
    }

    const ratioPerSecond = this.speed / (this.updateIntervalMs / 1000);
    if (ratioPerSecond <= 0) return null;

    const movementSeconds = deltaRatio / ratioPerSecond;
    const pauseSeconds = this.pauseUntilTs ? Math.max(0, (this.pauseUntilTs - Date.now()) / 1000) : 0;
    const totalMinutes = (movementSeconds + pauseSeconds) / 60;

    return Math.max(0, Number(totalMinutes.toFixed(1)));
  }

  /**
   * Check if bus reached a stop
   */
  checkForStops() {
    const tolerance = 0.008; // Distance ratio tolerance

    for (let i = 0; i < this.pausesAtStops.length; i++) {
      const stopRatio = this.pausesAtStops[i];

      // Check if we just reached this stop
      if (Math.abs(this.distanceRatio - stopRatio) < tolerance) {
        if (i !== this.currentStopIndex) {
          this.currentStopIndex = i;
          console.log(
            `🚌 Bus ${this.busId} arrived at: Stop ${i + 1}/${this.stops.length}`
          );
          this.isMoving = false;
          this.pauseAtStop();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Update bus position
   */
  async update() {
    if (this.isPaused) return;

    if (this.pauseUntilTs && Date.now() < this.pauseUntilTs) {
      return;
    }

    if (!this.isMoving) {
      return;
    }

    // Move along route
    this.distanceRatio += this.speed * this.direction;

    // Handle direction reversal at ends
    if (this.distanceRatio >= 1) {
      this.distanceRatio = 1;
      this.direction = -1; // Reverse direction
      console.log(`🔄 Bus ${this.busId} reached end, reversing direction`);
    } else if (this.distanceRatio <= 0) {
      this.distanceRatio = 0;
      this.direction = 1; // Forward direction
      console.log(`🔄 Bus ${this.busId} reached start, resuming forward`);
    }

    // Get current position along route
    this.currentPosition = getCoordinateAtDistance(this.routeGeometry, this.distanceRatio);

    // Check for stops
    this.checkForStops();

    // Save location
    await this.saveLocation();
  }

  /**
   * Start the simulator
   */
  async start() {
    try {
      await this.initialize();
      await this.saveLocation();

      // Pause at first stop
      this.isMoving = false;
      this.pauseAtStop(this.initialDepartureDelayMs);

      // Start update loop
      this.simulationTimer = setInterval(() => this.update(), this.updateIntervalMs);

      console.log(`🚀 OSRMBusSimulator started for Bus ${this.busId}\n`);
      return true;
    } catch (error) {
      console.error(`❌ Error starting OSRMBusSimulator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the simulator
   */
  stop() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
      this.pauseUntilTs = null;
    }

    console.log(`🛑 OSRMBusSimulator stopped for Bus ${this.busId}`);
  }

  /**
   * Pause the simulator
   */
  pause() {
    this.isPaused = true;
    console.log(`⏸️  OSRMBusSimulator paused for Bus ${this.busId}`);
  }

  /**
   * Resume the simulator
   */
  resume() {
    this.isPaused = false;
    console.log(`▶️  OSRMBusSimulator resumed for Bus ${this.busId}`);
  }

  /**
   * Get current state
   */
  getState() {
    const speedKmh = this.getCurrentSpeedKmh();
    const nextStopIndex = this.getNextStopIndex();

    return {
      busId: this.busId,
      currentStop: this.currentStopIndex + 1,
      totalStops: this.stops.length,
      distanceRatio: Math.round(this.distanceRatio * 100),
      isMoving: this.isMoving,
      direction: this.direction === 1 ? 'forward' : 'reverse',
      speedKmh: Number(speedKmh.toFixed(1)),
      etaMinutes: this.getEtaToNextStopMinutes(),
      nextStop: nextStopIndex + 1,
      currentPosition: this.currentPosition,
      isPaused: this.isPaused,
    };
  }
}

module.exports = OSRMBusSimulator;
