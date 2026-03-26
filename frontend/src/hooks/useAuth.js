import { useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const TOKEN_KEY = 'dhaka-bus-token';
const USER_KEY = 'dhaka-bus-user';

const readStorage = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep in-memory state working.
  }
};

const removeStorage = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures and keep in-memory state working.
  }
};

const getPersistedAuth = () => {
  const localToken = readStorage(localStorage, TOKEN_KEY);
  const sessionToken = readStorage(sessionStorage, TOKEN_KEY);
  const storage = localToken ? localStorage : sessionToken ? sessionStorage : null;
  const token = localToken || sessionToken || '';
  const rawUser = storage ? readStorage(storage, USER_KEY) : null;

  return {
    token,
    user: rawUser ? JSON.parse(rawUser) : null,
    remember: storage === localStorage,
  };
};

const clearPersistedAuth = () => {
  removeStorage(localStorage, TOKEN_KEY);
  removeStorage(localStorage, USER_KEY);
  removeStorage(sessionStorage, TOKEN_KEY);
  removeStorage(sessionStorage, USER_KEY);
};

export default function useAuth() {
  const persisted = getPersistedAuth();
  const [token, setToken] = useState(() => persisted.token);
  const [user, setUser] = useState(() => persisted.user);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(() => Boolean(persisted.token));

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const persistSession = (nextToken, nextUser, remember) => {
    clearPersistedAuth();
    const storage = remember ? localStorage : sessionStorage;
    writeStorage(storage, TOKEN_KEY, nextToken);
    writeStorage(storage, USER_KEY, JSON.stringify(nextUser));
  };

  const login = async (email, password, options = {}) => {
    const remember = Boolean(options.remember);
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (!data || !data.token || !data.user) {
        throw new Error('Unexpected login response from server');
      }
      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user, remember);
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        message: error?.response?.data?.message || error?.message || 'Could not sign in',
        verificationRequired: Boolean(error?.response?.data?.verificationRequired),
        email,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const data = await authApi.register({ name, email, password });
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        message: error?.response?.data?.message || 'Could not create your account',
        verificationRequired: Boolean(error?.response?.data?.verificationRequired),
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setInitializing(false);
    clearPersistedAuth();
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const profile = await authApi.me(token);
        setUser(profile);
        const storage = readStorage(localStorage, TOKEN_KEY) ? localStorage : sessionStorage;
        writeStorage(storage, USER_KEY, JSON.stringify(profile));
      } catch {
        setToken('');
        setUser(null);
        clearPersistedAuth();
      } finally {
        setInitializing(false);
      }
    };

    verify();
  }, [token]);

  return {
    token,
    user,
    loading,
    initializing,
    isAuthenticated,
    login,
    register,
    verifyEmail: authApi.verifyEmail,
    resendVerification: authApi.resendVerification,
    forgotPassword: authApi.forgotPassword,
    resetPassword: authApi.resetPassword,
    logout,
  };
}
