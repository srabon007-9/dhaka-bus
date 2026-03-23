// Map Component - Displays interactive map with bus routes and locations
// Uses Leaflet + React-Leaflet for mapping
// Uses OpenStreetMap (free, no API key needed)
// Includes distance measurement tool

import { MapContainer, TileLayer, Popup, Marker, Polyline, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icon for bus markers
// This is the icon that appears on the map for each bus
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom icon for selected bus (highlighted)
const selectedBusIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Icon for measurement points
const measureIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4436/4436481.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Component to animate map to selected bus
function MapCenterUpdater({ selectedBus, getBusLocation }) {
  const map = useMap();

  // Update map center when bus is selected
  if (selectedBus) {
    const location = getBusLocation(selectedBus.id);
    if (location) {
      map.setView([location.latitude, location.longitude], 15);
    }
  }

  return null;
}

// Distance Measurement Tool Component
function MeasurementTool({ onMeasurementUpdate }) {
  const map = useMap();
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureMarkers, setMeasureMarkers] = useState([]);
  const [measureLine, setMeasureLine] = useState(null);
  const [distancePopup, setDistancePopup] = useState(null);

  // Get road distance using OSRM (Open Source Routing Machine - FREE)
  const getRoadDistance = async (lat1, lon1, lat2, lon2) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: (route.distance / 1000).toFixed(2), // Convert meters to km
          duration: (route.duration / 60).toFixed(0), // Convert seconds to minutes
          geometry: route.geometry.coordinates,
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
    return null;
  };

  // Handle map click for measurement
  useEffect(() => {
    if (!measureMode) return;

    const handleMapClick = async (e) => {
      const { lat, lng } = e.latlng;
      const newPoints = [...measurePoints, { lat, lng }];
      setMeasurePoints(newPoints);

      // Add marker for this point
      const marker = L.marker([lat, lng], { icon: measureIcon })
        .bindPopup(`Point ${newPoints.length}<br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`)
        .addTo(map)
        .openPopup();
      
      const newMarkers = [...measureMarkers, marker];
      setMeasureMarkers(newMarkers);

      // If we have 2 points, get road distance and display
      if (newPoints.length === 2) {
        const [p1, p2] = newPoints;
        
        // Get actual road distance from OSRM
        const routeData = await getRoadDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        
        if (routeData) {
          const { distance, duration, geometry } = routeData;
          
          // Draw actual road route (not straight line)
          const roadCoordinates = geometry.map(coord => [coord[1], coord[0]]); // Convert [lon,lat] to [lat,lon]
          const line = L.polyline(roadCoordinates, {
            color: '#ff0000',
            weight: 4,
            opacity: 0.9,
            dashArray: '5, 5',
          }).addTo(map);
          setMeasureLine(line);

          // Add popup with road distance at midpoint
          const midLat = (p1.lat + p2.lat) / 2;
          const midLng = (p1.lng + p2.lng) / 2;
          const popup = L.popup({ autoClose: false, closeButton: true })
            .setLatLng([midLat, midLng])
            .setContent(
              `<div style="text-align:center; font-weight:bold; color:#ff0000; font-size:14px; padding:10px; background:#fff; border-radius:5px; min-width:150px;">
                📏 Road Distance<br>
                <span style="font-size:20px; color:#ff3333;">${distance} km</span><br>
                <span style="font-size:12px; color:#666;">~${duration} min</span>
              </div>`
            )
            .openOn(map);
          setDistancePopup(popup);

          // Update parent with measurement data
          onMeasurementUpdate({
            distance,
            duration,
            p1: `${p1.lat.toFixed(5)}, ${p1.lng.toFixed(5)}`,
            p2: `${p2.lat.toFixed(5)}, ${p2.lng.toFixed(5)}`,
          });

          // DO NOT auto-reset - keep measurement visible
          // User can manually clear it
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [measureMode, measurePoints, measureMarkers, map, onMeasurementUpdate]);

  // Cleanup markers and lines when measurement mode is deactivated
  useEffect(() => {
    if (!measureMode) {
      // Remove all markers
      measureMarkers.forEach(marker => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      
      // Remove line
      if (measureLine && map.hasLayer(measureLine)) {
        map.removeLayer(measureLine);
      }
      
      // Remove popup
      if (distancePopup) {
        map.closePopup(distancePopup);
      }
      
      setMeasurePoints([]);
      setMeasureMarkers([]);
      setMeasureLine(null);
      setDistancePopup(null);
    }
  }, [measureMode, measureMarkers, measureLine, distancePopup, map]);

  // Expose toggle function to window for button access
  useEffect(() => {
    window.toggleMeasurement = () => {
      setMeasureMode(!measureMode);
    };
  }, [measureMode]);

  return null;
}

function Map({ buses, routes, selectedBus, getBusLocation }) {
  const [measurementData, setMeasurementData] = useState(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Default map center (Dhaka, Bangladesh)
  const defaultCenter = [23.8103, 90.4189];

  // Clear measurement
  const clearMeasurement = () => {
    setMeasurementData(null);
    setIsMeasuring(false);
    window.toggleMeasurement && window.toggleMeasurement();
  };

  // Render routes as polylines on map
  const renderRoutes = () => {
    return routes.map((route) => {
      // routes can be stored in two ways - as array or as JSON string
      let coordinates = route.coordinates;
      if (typeof coordinates === 'string') {
        coordinates = JSON.parse(coordinates);
      }

      // Leaflet expects [lat, lng] format
      return (
        <Polyline
          key={route.id}
          positions={coordinates}
          color="#3b82f6"
          weight={3}
          opacity={0.7}
          dashArray="5, 10"
        />
      );
    });
  };

  // Render bus markers on map
  const renderBuses = () => {
    return buses.map((bus) => {
      // Get latest location for this bus
      const location = getBusLocation(bus.id);

      if (!location) return null; // Bus has no location yet

      const isSelected = selectedBus?.id === bus.id;

      return (
        <Marker
          key={bus.id}
          position={[location.latitude, location.longitude]}
          icon={isSelected ? selectedBusIcon : busIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-blue-600">{bus.name}</h3>
              <p className="text-sm text-gray-600">Route: {bus.route_name}</p>
              <p className="text-sm text-gray-600">
                From: {bus.start_point}
              </p>
              <p className="text-sm text-gray-600">To: {bus.end_point}</p>
              <p className="text-xs text-gray-500 mt-2">
                📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500">
                🕐 {new Date(location.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-visible border-t-4 border-purple-500">
      {/* Measurement Tool Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 border-b-2 border-purple-200">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <button
              onClick={() => {
                setIsMeasuring(!isMeasuring);
                window.toggleMeasurement && window.toggleMeasurement();
              }}
              className={`font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 text-white ${
                isMeasuring
                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg'
              }`}
            >
              {isMeasuring ? '⏹️ Stop Measuring' : '📏 Measure Distance'}
            </button>
            <p className="text-sm text-gray-700 mt-3 font-medium">
              {isMeasuring
                ? '👆 Click 2 points on map to measure road distance'
                : '📌 Click button to start measuring'}
            </p>
          </div>
          {measurementData && (
            <button
              onClick={() => {
                clearMeasurement();
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Measurement Results Panel */}
      {measurementData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 border-b-2 border-green-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-l-green-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Road Distance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {measurementData.distance} <span className="text-lg">km</span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-l-blue-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Est. Drive Time</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ~{measurementData.duration} <span className="text-lg">min</span>
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg text-xs text-gray-700 border-l-4 border-l-yellow-400">
            <p className="font-semibold">📍 Coordinates:</p>
            <p className="mt-1">From: <span className="font-mono text-blue-600">{measurementData.p1}</span></p>
            <p>To: <span className="font-mono text-blue-600">{measurementData.p2}</span></p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '600px', width: '100%' }}
        >
        {/* OpenStreetMap tiles (free, no API key needed) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Render all bus routes */}
        {renderRoutes()}

        {/* Render all bus markers */}
        {renderBuses()}

        {/* Update map center when bus is selected */}
        <MapCenterUpdater selectedBus={selectedBus} getBusLocation={getBusLocation} />

        {/* Measurement Tool */}
        <MeasurementTool onMeasurementUpdate={setMeasurementData} />
      </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-t-2 border-gray-200">
        <p className="font-bold text-gray-900 mb-4">📋 Legend</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border-l-4 border-l-blue-400">
            <div className="w-4 h-4 bg-blue-400 rounded" style={{ opacity: 0.7 }}></div>
            <span className="text-sm font-semibold text-gray-700">Bus Routes</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border-l-4 border-l-green-500">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-700">Active Bus</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border-l-4 border-l-red-500">
            <div className="w-4 h-4 bg-red-500 rounded" style={{ borderRadius: '50%' }}></div>
            <span className="text-sm font-semibold text-gray-700">Measurement</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map;
