import { useEffect, useMemo, useState } from 'react';
import { busApi, locationApi, routeApi } from '../services/api';

export default function useLiveTracking() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [busData, routeData, locationData] = await Promise.all([
        busApi.list(),
        routeApi.list(),
        locationApi.list(),
      ]);
      setBuses(busData);
      setRoutes(routeData);
      setLocations(locationData);
    } catch {
      setError('Backend not connected. Please start backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocations = async () => {
    try {
      const locationData = await locationApi.list();
      setLocations(locationData);
    } catch {
      setError('Live updates paused. Backend is not reachable.');
    }
  };

  useEffect(() => {
    fetchAll();
    const timer = setInterval(refreshLocations, 6000);
    return () => clearInterval(timer);
  }, []);

  const busLocations = useMemo(() => {
    const map = new Map();
    locations.forEach((item) => {
      map.set(item.bus_id, item);
    });
    return map;
  }, [locations]);

  return {
    buses,
    routes,
    locations,
    busLocations,
    loading,
    error,
    retry: fetchAll,
  };
}
