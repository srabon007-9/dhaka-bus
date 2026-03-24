import { useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const TOKEN_KEY = 'dhaka-bus-token';
const USER_KEY = 'dhaka-bus-user';

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid login response: missing token or user');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        message: error?.response?.data?.message || error?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error?.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      try {
        const profile = await authApi.me(token);
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      } catch {
        setToken('');
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    };

    verify();
  }, [token]);

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
