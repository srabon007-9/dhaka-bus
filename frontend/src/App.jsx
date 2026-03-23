// Main App Component
// This is the root component that displays the entire Dhaka Bus Tracking application

import { useState, useEffect } from 'react';
import Map from './components/Map';
import BusSearch from './components/BusSearch';
import BusList from './components/BusList';
import axios from 'axios';
import './App.css';

// API base URL - from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  // State variables
  const [buses, setBuses] = useState([]); // All buses
  const [routes, setRoutes] = useState([]); // All routes
  const [locations, setLocations] = useState([]); // Bus locations
  const [selectedBus, setSelectedBus] = useState(null); // Selected bus
  const [filteredBuses, setFilteredBuses] = useState([]); // Search results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
    // Refresh locations every 5 seconds (simulate live updates)
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all data from API
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Make parallel requests to all endpoints
      const [busesRes, routesRes, locationsRes] = await Promise.all([
        axios.get(`${API_URL}/buses`),
        axios.get(`${API_URL}/routes`),
        axios.get(`${API_URL}/locations`),
      ]);

      setBuses(busesRes.data.data);
      setRoutes(routesRes.data.data);
      setLocations(locationsRes.data.data);
      setFilteredBuses(busesRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Make sure backend is running on http://localhost:3000');
    } finally {
      setLoading(false);
    }
  };

  // Fetch only locations (for live updates)
  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/locations`);
      setLocations(res.data.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Handle bus search
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredBuses(buses);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = buses.filter((bus) => {
      return (
        bus.name.toLowerCase().includes(term) ||
        bus.route_name.toLowerCase().includes(term) ||
        bus.start_point.toLowerCase().includes(term) ||
        bus.end_point.toLowerCase().includes(term)
      );
    });
    setFilteredBuses(filtered);
  };

  // Handle bus selection
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
  };

  // Get location for a specific bus
  const getBusLocation = (busId) => {
    return locations.find((loc) => loc.bus_id === busId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-2xl border-b-4 border-blue-400">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold tracking-tight">🚌 Dhaka Bus Tracking</h1>
          <p className="text-blue-100 mt-2 text-lg">Real-time bus location tracking system</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border-l-4 border-red-400 text-red-100 px-6 py-4 rounded-lg mb-6 shadow-lg">
            <p className="font-semibold">⚠️ Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-blue-600"></div>
              <p className="mt-6 text-blue-100 text-lg font-semibold">Loading bus data...</p>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Search and List */}
            <div className="lg:col-span-1">
              {/* Search Component */}
              <BusSearch onSearch={handleSearch} />

              {/* Bus List Component */}
              <div className="mt-6">
                <BusList
                  buses={filteredBuses}
                  selectedBus={selectedBus}
                  onSelectBus={handleSelectBus}
                  getBusLocation={getBusLocation}
                />
              </div>
            </div>

            {/* Right Content - Map */}
            <div className="lg:col-span-2">
              <Map
                buses={buses}
                routes={routes}
                locations={locations}
                selectedBus={selectedBus}
                getBusLocation={getBusLocation}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 mt-16 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-sm">© 2026 Dhaka Bus Tracking System</p>
          <p className="text-xs text-slate-500 mt-2">Built with React, Vite, Leaflet & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
