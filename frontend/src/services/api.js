import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const normalize = (response) => response?.data?.data ?? response?.data ?? [];

export const busApi = {
  list: async () => normalize(await api.get('/buses')),
  create: async (payload, token) => normalize(await api.post('/buses', payload, authConfig(token))),
  update: async (id, payload, token) => normalize(await api.put(`/buses/${id}`, payload, authConfig(token))),
  remove: async (id, token) => normalize(await api.delete(`/buses/${id}`, authConfig(token))),
};

export const routeApi = {
  list: async () => normalize(await api.get('/routes')),
  create: async (payload, token) => normalize(await api.post('/routes', payload, authConfig(token))),
  update: async (id, payload, token) => normalize(await api.put(`/routes/${id}`, payload, authConfig(token))),
  remove: async (id, token) => normalize(await api.delete(`/routes/${id}`, authConfig(token))),
};

export const locationApi = {
  list: async () => normalize(await api.get('/locations')),
};

export const stopApi = {
  listByRoute: async (routeId) => normalize(await api.get(`/stops/${routeId}`)),
};

export const tripApi = {
  list: async (routeId) => normalize(await api.get('/trips', routeId ? { params: { routeId } } : undefined)),
  create: async (payload, token) => normalize(await api.post('/trips', payload, authConfig(token))),
  update: async (id, payload, token) => normalize(await api.put(`/trips/${id}`, payload, authConfig(token))),
  remove: async (id, token) => normalize(await api.delete(`/trips/${id}`, authConfig(token))),
};

export const ticketApi = {
  list: async (token) => normalize(await api.get('/tickets', authConfig(token))),
  getBookedSeats: async (tripId, boardingStopId, dropoffStopId) => {
    try {
      return normalize(
        await api.get(`/tickets/trip/${tripId}/booked-seats`, {
          params: {
            boarding_stop_id: boardingStopId,
            dropoff_stop_id: dropoffStopId,
          },
        })
      );
    } catch (error) {
      console.error('Error fetching booked seats:', error.message);
      throw new Error(`Failed to fetch seat availability: ${error?.response?.data?.message || error.message}`);
    }
  },
  create: async (payload, token) => normalize(await api.post('/tickets', payload, authConfig(token))),
  createCheckoutSession: async (payload, token) => {
    const response = await api.post('/tickets/payment/checkout', payload, authConfig(token));
    return response?.data?.data ?? response?.data;
  },
  completePayment: async (sessionId, token) => {
    const response = await api.post('/tickets/payment/complete', { session_id: sessionId }, authConfig(token));
    return response?.data?.data ?? response?.data;
  },
  cancel: async (id, token) => normalize(await api.patch(`/tickets/${id}/cancel`, {}, authConfig(token))),
};

export const authApi = {
  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response?.data;
  },
  login: async (payload) => {
    try {
      const response = await api.post('/auth/login', payload);
      const data = response?.data?.data;
      if (!data) {
        throw new Error('Unexpected response from login endpoint');
      }
      return data;
    } catch (error) {
      console.error('Login request failed:', error?.response?.data || error?.message);
      throw error;
    }
  },
  me: async (token) => normalize(await api.get('/auth/me', authConfig(token))),
  verifyEmail: async (token) => {
    const response = await api.get('/auth/verify', { params: { token } });
    return response?.data;
  },
  resendVerification: async (payload) => {
    const response = await api.post('/auth/resend-verification', payload);
    return response?.data;
  },
};

export const healthApi = {
  check: async () => {
    const rootUrl = API_BASE_URL.replace(/\/api$/, '');
    const res = await axios.get(`${rootUrl}/api/health`, { timeout: 6000 });
    return res?.data ?? { status: 'ok' };
  },
};

export default api;
