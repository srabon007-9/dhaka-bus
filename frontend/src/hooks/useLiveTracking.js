import { useEffect, useMemo, useState } from 'react';
import { busApi, locationApi, routeApi } from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

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
      setError('Cannot connect to the server. Please start the backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocations = async () => {
    try {
      const locationData = await locationApi.list();
      setLocations(locationData);
    } catch {
      setError('Live updates are paused because the backend is unreachable.');
    }
  };

  useEffect(() => {
    fetchAll();
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      setError('');
      console.log('Socket connected successfully');
    });

    socket.on('locations:snapshot', (payload) => {
      if (Array.isArray(payload)) {
        setLocations(payload);
      }
    });

    socket.on('locations:update', (payload) => {
      if (!payload || !payload.bus_id) return;
      setLocations((prev) => {
        const next = prev.filter((item) => item.bus_id !== payload.bus_id);
        next.push(payload);
        return next;
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Live tracking paused - connecting to server...');
      refreshLocations().catch(() => {
        setError('Live tracking offline - backend is unreachable');
      });
    });

    const fallbackTimer = setInterval(refreshLocations, 15000);

    return () => {
      clearInterval(fallbackTimer);
      socket.disconnect();
    };
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
