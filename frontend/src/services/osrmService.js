/**
 * OSRM Routing Service
 * Fetches real road-based routes from OpenStreetMap Routing Machine
 */

const OSRM_BASE = 'https://router.project-osrm.org';
const OSRM_ROUTE_API = `${OSRM_BASE}/route/v1/driving`;
const OSRM_MATCH_API = `${OSRM_BASE}/match/v1/driving`;
const OSRM_NEAREST_API = `${OSRM_BASE}/nearest/v1/driving`;

async function snapWaypointToRoad([lat, lng]) {
  const url = `${OSRM_NEAREST_API}/${lng},${lat}?number=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [lat, lng];

    const data = await response.json();
    const nearest = data?.waypoints?.[0]?.location;

    if (!Array.isArray(nearest) || nearest.length < 2) return [lat, lng];

    // nearest is [lng, lat]
    return [Number(nearest[1]), Number(nearest[0])];
  } catch {
    return [lat, lng];
  }
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

function buildCoordinateString(points) {
  return points.map(([lat, lng]) => `${lng},${lat}`).join(';');
}

function toLatLngGeometry(geojsonCoordinates) {
  return geojsonCoordinates.map(([lng, lat]) => [Number(lat), Number(lng)]);
}

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

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isGeometryPlausible(geometry) {
  if (!Array.isArray(geometry) || geometry.length < 2) return false;

  // Reject artifacts: huge jumps usually indicate bad matching/trace segmentation.
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
      const timer = setTimeout(() => controller.abort(), 10000);

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
      // avoid duplicate join point
      merged.push(...latLng.slice(1));
    }
  }

  const cleaned = removeConsecutiveDuplicates(merged);
  if (!isGeometryPlausible(cleaned)) {
    throw new Error('Matched geometry failed quality checks');
  }

  return { data, geometry: cleaned, source: 'match' };
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
    throw new Error('No geometry in OSRM route response');
  }

  const geometry = removeConsecutiveDuplicates(toLatLngGeometry(coords));
  if (!isGeometryPlausible(geometry)) {
    throw new Error('Routed geometry failed quality checks');
  }

  return { data, geometry, source: 'route' };
}

/**
 * Fetch road-based route from OSRM
 * @param {Array<[lat, lng]>} waypoints - Array of [latitude, longitude] pairs
 * @returns {Promise<Object>} OSRM response with geometry
 */
export async function fetchOSRMRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }

  // Keep stop markers exact, but route geometry should be snapped to drivable roads.
  const snappedWaypoints = await Promise.all(
    waypoints.map((point) => snapWaypointToRoad(point))
  );

  const cleanedWaypoints = removeConsecutiveDuplicates(snappedWaypoints);

  if (cleanedWaypoints.length < 2) {
    throw new Error('Not enough snapped waypoints for routing');
  }

  try {
    // 1) Match API first for cleaner map-matched road geometry.
    const matched = await fetchMatchedGeometry(cleanedWaypoints);
    return {
      ...matched.data,
      source: matched.source,
      geometryOverride: matched.geometry,
      snappedWaypoints: cleanedWaypoints,
    };
  } catch (matchError) {
    console.warn('OSRM match failed, falling back to route API:', matchError.message);

    // 2) Fallback to route API
    const routed = await fetchRoutedGeometry(cleanedWaypoints);

    return {
      ...routed.data,
      source: routed.source,
      geometryOverride: routed.geometry,
      snappedWaypoints: cleanedWaypoints,
    };
  }
}

/**
 * Extract geometry coordinates from OSRM response
 * @param {Object} osrmResponse - Response from OSRM API
 * @returns {Array<[lat, lng]>} Array of coordinates along the route
 */
export function extractRouteGeometry(osrmResponse) {
  if (Array.isArray(osrmResponse?.geometryOverride) && osrmResponse.geometryOverride.length > 1) {
    return osrmResponse.geometryOverride;
  }

  if (!osrmResponse.routes || osrmResponse.routes.length === 0) {
    throw new Error('No routes returned from OSRM');
  }

  const route = osrmResponse.routes[0];
  const geometry = route.geometry;

  if (!geometry || !geometry.coordinates) {
    throw new Error('No geometry in OSRM response');
  }

  // Convert GeoJSON format [lng, lat] to [lat, lng]
  return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

/**
 * Get coordinate along route at specific distance
 * @param {Array<[lat, lng]>} geometry - Route geometry
 * @param {number} distanceRatio - 0-1, where to sample (0 = start, 1 = end)
 * @returns {[lat, lng]} Coordinate at that distance
 */
export function getCoordinateAtDistance(geometry, distanceRatio) {
  if (!geometry || geometry.length === 0) {
    throw new Error('Empty geometry');
  }

  const clampedRatio = Math.max(0, Math.min(1, distanceRatio));

  if (geometry.length === 1) {
    return geometry[0];
  }

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

  // Find target distance
  const targetDistance = totalDistance * clampedRatio;

  // Find the segment
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
 * Calculate heading/bearing between two points (for marker rotation)
 * @param {[lat, lng]} from - Starting point
 * @param {[lat, lng]} to - Ending point
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(from, to) {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}
