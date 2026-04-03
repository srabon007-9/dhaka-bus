import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { fetchOSRMRoute, extractRouteGeometry, calculateBearing } from '../services/osrmService';

// Bus icon with rotation capability
const createBusIcon = (bearing = 0) => {
  return new L.DivIcon({
    className: '',
    html: `<div style="font-size:24px;transform:rotate(${bearing}deg);filter:drop-shadow(0 0 12px rgba(34,211,238,.8));transition:transform 0.3s ease;">🚌</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Bus stop icon
const stopIcon = new L.DivIcon({
  className: '',
  html: '<div style="font-size:16px;filter:drop-shadow(0 0 6px rgba(249,115,22,.8));">🚏</div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapSizeFixer() {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => {
      requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };

    const timer = setTimeout(resizeMap, 120);
    map.on('zoomend', resizeMap);
    window.addEventListener('resize', resizeMap);

    return () => {
      clearTimeout(timer);
      map.off('zoomend', resizeMap);
      window.removeEventListener('resize', resizeMap);
    };
  }, [map]);

  return null;
}

function FitStopsBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length < 2) return;

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { 
      padding: [50, 50],
      animate: true,
      duration: 0.8,
      easeLinearity: 0.25
    });
  }, [map, positions]);

  return null;
}

function CenterOnBus({ busPosition, selectedBus }) {
  const map = useMap();

  useEffect(() => {
    if (!busPosition || !selectedBus) return;

    const [lat, lng] = busPosition;
    map.panTo([lat, lng], { animate: true, duration: 0.8, easeLinearity: 0.25 });
  }, [map, busPosition, selectedBus]);

  return null;
}

function ZoomWatcher({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    const notifyZoom = () => onZoomChange(map.getZoom());

    notifyZoom();
    map.on('zoomend', notifyZoom);

    return () => {
      map.off('zoomend', notifyZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

function RouteDirectionDecorator({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length < 2 || !L.polylineDecorator) return undefined;

    const decorator = L.polylineDecorator(positions, {
      patterns: [
        {
          offset: 14,
          repeat: 100,
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            pathOptions: {
              color: '#22d3ee',
              fillOpacity: 1,
              weight: 2,
            },
          }),
        },
      ],
    });

    decorator.addTo(map);

    return () => {
      map.removeLayer(decorator);
    };
  }, [map, positions]);

  return null;
}

export default function MapView({ buses = [], busLocations = new Map(), selectedBus, stops = [] }) {
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(12);

  // Convert provided stops to waypoint format
  const waypoints = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    return [...stops].sort((a, b) => (a.stop_order || a.id) - (b.stop_order || b.id)).map((stop) => {
      const lat = Number(stop.latitude || stop[0]);
      const lng = Number(stop.longitude || stop[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng];
      }
      return null;
    }).filter(Boolean);
  }, [stops]);

  const routeCacheKey = useMemo(() => {
    if (!waypoints || waypoints.length < 2) return null;
    const first = waypoints[0].join(',');
    const last = waypoints[waypoints.length - 1].join(',');
    return `osrm-route-cache:${waypoints.length}:${first}:${last}`;
  }, [waypoints]);

  // Fetch OSRM route when waypoints change
  useEffect(() => {
    if (waypoints.length < 2) {
      setRouteGeometry([]);
      return;
    }

    const fetchRoute = async () => {
      setLoadingRoute(true);
      setRouteError(null);
      try {
        const osrmResponse = await fetchOSRMRoute(waypoints);
        const geometry = extractRouteGeometry(osrmResponse);
        setRouteGeometry(geometry);
        if (routeCacheKey) {
          localStorage.setItem(routeCacheKey, JSON.stringify(geometry));
        }
      } catch (error) {
        console.error('Failed to fetch OSRM route:', error);

        let usedCache = false;
        if (routeCacheKey) {
          try {
            const cachedRaw = localStorage.getItem(routeCacheKey);
            if (cachedRaw) {
              const cachedGeometry = JSON.parse(cachedRaw);
              if (Array.isArray(cachedGeometry) && cachedGeometry.length > 1) {
                setRouteGeometry(cachedGeometry);
                usedCache = true;
              }
            }
          } catch {
            // ignore cache parse issues
          }
        }

        if (usedCache) {
          setRouteError('OSRM temporarily unavailable. Showing last known road route.');
        } else {
          setRouteError('OSRM route unavailable. Road path hidden until service recovers.');
          setRouteGeometry([]);
        }
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [waypoints, routeCacheKey]);

  // Calculate bus heading for marker rotation
  useEffect(() => {
    if (routeGeometry.length < 2) return;

    const selectedBusData = selectedBus ? buses.find((b) => b.id === selectedBus.id) : buses[0];
    const busLoc = busLocations.get(selectedBusData?.id);

    if (!busLoc || !routeGeometry) return;

    // Find nearest segment in route
    const [busLat, busLng] = [Number(busLoc.latitude), Number(busLoc.longitude)];
    let minDist = Infinity;
    let nearestSegmentIdx = 0;

    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const [lat1, lng1] = routeGeometry[i];
      const [lat2, lng2] = routeGeometry[i + 1];

      const dist = Math.abs((lng2 - lng1) * busLat - (lat2 - lat1) * busLng + lat2 * lng1 - lng2 * lat1) /
        Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);

      if (dist < minDist) {
        minDist = dist;
        nearestSegmentIdx = i;
      }
    }

    const bearing = calculateBearing(routeGeometry[nearestSegmentIdx], routeGeometry[nearestSegmentIdx + 1]);
    setBusHeading(bearing);
  }, [busLocations, selectedBus, routeGeometry, buses]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDashOffset((prev) => (prev + 2) % 1000);
    }, 120);

    return () => clearInterval(timer);
  }, []);

  const selectedBusData = selectedBus ? buses.find((b) => b.id === selectedBus.id) : null;
  const selectedBusLocation = selectedBusData ? busLocations.get(selectedBusData.id) : null;

  const activeBusForProgress = selectedBusData || buses[0] || null;
  const activeBusLocation = activeBusForProgress ? busLocations.get(activeBusForProgress.id) : null;

  const routeProgress = useMemo(() => {
    if (!activeBusLocation || routeGeometry.length < 2) {
      return { traveled: [], remaining: routeGeometry };
    }

    const busLat = Number(activeBusLocation.latitude);
    const busLng = Number(activeBusLocation.longitude);
    if (!Number.isFinite(busLat) || !Number.isFinite(busLng)) {
      return { traveled: [], remaining: routeGeometry };
    }

    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < routeGeometry.length; i++) {
      const [lat, lng] = routeGeometry[i];
      const dLat = lat - busLat;
      const dLng = lng - busLng;
      const dist = (dLat * dLat) + (dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const direction = activeBusLocation.direction || 'forward';
    if (direction === 'reverse') {
      return {
        traveled: routeGeometry.slice(nearestIndex),
        remaining: routeGeometry.slice(0, nearestIndex + 1),
      };
    }

    return {
      traveled: routeGeometry.slice(0, nearestIndex + 1),
      remaining: routeGeometry.slice(nearestIndex),
    };
  }, [activeBusLocation, routeGeometry]);

  const markerDisplayPositions = useMemo(() => {
    const groups = new Map();

    buses.forEach((bus) => {
      const loc = busLocations.get(bus.id);
      if (!loc) return;

      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ busId: bus.id, lat, lng });
    });

    const output = new Map();
    groups.forEach((items) => {
      if (items.length === 1) {
        output.set(items[0].busId, [items[0].lat, items[0].lng]);
        return;
      }

      // Adaptive radius based on zoom level for smoother transitions
      let radius = 0.0001;
      if (zoomLevel < 10) radius = 0.00005;
      else if (zoomLevel < 11) radius = 0.00007;
      else if (zoomLevel < 12) radius = 0.0001;
      else if (zoomLevel < 13) radius = 0.00015;
      else radius = 0.0002;
      
      items.forEach((item, idx) => {
        const angle = (2 * Math.PI * idx) / items.length;
        const displayLat = item.lat + (radius * Math.sin(angle));
        const displayLng = item.lng + (radius * Math.cos(angle));
        output.set(item.busId, [displayLat, displayLng]);
      });
    });

    return output;
  }, [buses, busLocations, zoomLevel]);

  return (
    <MapContainer
      center={[23.8103, 90.4125]}
      zoom={12}
      zoomAnimation={true}
      fadeAnimation={true}
      markerZoomAnimation={true}
      zoomAnimationThreshold={4}
      whenReady={(event) => {
        setTimeout(() => event.target.invalidateSize({ pan: false }), 0);
      }}
      className="h-[72vh] w-full rounded-2xl border border-white/10"
    >
      <MapSizeFixer />
      <ZoomWatcher onZoomChange={setZoomLevel} />
      <FitStopsBounds positions={waypoints} />
      {selectedBusLocation && <CenterOnBus busPosition={[Number(selectedBusLocation.latitude), Number(selectedBusLocation.longitude)]} selectedBus={selectedBus} />}

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Draw OSRM-based route */}
      {routeGeometry.length > 1 && (
        <>
          {/* Route shadow/outline */}
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#000000',
              weight: 8,
              opacity: 0.15,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />

          {/* Remaining route */}
          <Polyline
            positions={routeProgress.remaining.length > 1 ? routeProgress.remaining : routeGeometry}
            pathOptions={{
              color: '#06b6d4',
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: '1,0',
            }}
          />

          {/* Traveled route */}
          {routeProgress.traveled.length > 1 && (
            <Polyline
              positions={routeProgress.traveled}
              pathOptions={{
                color: '#22c55e',
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Animated flow line for navigation-style motion */}
          <Polyline
            positions={routeProgress.remaining.length > 1 ? routeProgress.remaining : routeGeometry}
            pathOptions={{
              color: '#67e8f9',
              weight: 3,
              opacity: 0.9,
              dashArray: '14 18',
              dashOffset: `${dashOffset}`,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />

          {/* True arrowheads along route */}
          <RouteDirectionDecorator positions={routeGeometry} />
        </>
      )}

      {loadingRoute && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#06b6d4',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          ⚙️ Loading route...
        </div>
      )}

      {routeError && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#ef4444',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          ⚠️ Route error
        </div>
      )}

      {/* Mark all stops */}
      {stops.map((stop, idx) => {
        const lat = Number(stop.latitude || stop[0]);
        const lng = Number(stop.longitude || stop[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const lowZoom = zoomLevel < 12;
        const markerRadius = zoomLevel < 11 ? 3 : zoomLevel < 13 ? 5 : 7;

        return (
          <Fragment key={`stop-${idx}`}>
            {lowZoom ? (
              <CircleMarker
                center={[lat, lng]}
                radius={markerRadius}
                pathOptions={{
                  color: '#f97316',
                  fillColor: '#fb923c',
                  fillOpacity: 0.9,
                  weight: 1,
                }}
              />
            ) : (
              <Marker position={[lat, lng]} icon={stopIcon}>
                <Popup>
                  <div className="min-w-40">
                    <p className="font-semibold">🚏 Bus Stop</p>
                    <p className="text-xs text-slate-500">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </Fragment>
        );
      })}

      {/* Bus markers */}
      {buses.map((bus) => {
        const loc = busLocations.get(bus.id);
        if (!loc) return null;

        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const isSelected = selectedBus?.id === bus.id;
        const heading = isSelected ? busHeading : 0;
        const busIcon = createBusIcon(heading);
        const displayPosition = markerDisplayPositions.get(bus.id) || [lat, lng];

        return (
          <div key={bus.id}>
            {/* Selection highlight circle */}
            {isSelected && (
              <CircleMarker
                center={displayPosition}
                radius={40}
                pathOptions={{
                  color: '#06b6d4',
                  fill: true,
                  fillColor: '#06b6d4',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Bus marker */}
            <Marker position={displayPosition} icon={busIcon}>
              <Popup>
                <div className="min-w-48">
                  <p className="font-bold text-cyan-500">{bus.name}</p>
                  <p className="text-sm">{bus.route_name || 'In Transit'}</p>
                  {Number.isFinite(Number(loc?.speed_kmh)) && (
                    <p className="text-xs text-yellow-300">Speed: {Number(loc.speed_kmh).toFixed(1)} km/h</p>
                  )}
                  {Number.isFinite(Number(loc?.eta_minutes)) && (
                    <p className="text-xs text-cyan-300">ETA: {Number(loc.eta_minutes)} min</p>
                  )}
                  {Number.isFinite(Number(loc?.next_stop)) && (
                    <p className="text-xs text-emerald-300">Next stop: {Number(loc.next_stop)}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">DB location: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                  {isSelected && <p className="text-xs font-semibold text-cyan-400 mt-2">📍 Selected</p>}
                </div>
              </Popup>
            </Marker>

            {/* Trailing path effect for selected bus */}
            {isSelected && routeGeometry.length > 0 && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 2,
                  opacity: 0.2,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          </div>
        );
      })}
    </MapContainer>
  );
}
