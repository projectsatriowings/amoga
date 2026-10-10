import { create } from 'zustand';

const TOKEN_KEY = 'amoga_admin_token';
const USER_KEY = 'amoga_admin_user';

export const useAdminStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  admin: (() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response, such as proxy 502 Bad Gateway or HTML error
      }

      if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error('Backend API server is offline or unreachable (502 Bad Gateway). Ensure the backend server is running on port 5001.');
        }
        throw new Error(data?.message || data?.error || `Login failed with HTTP status ${res.status}`);
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.admin));

      set({
        token: data.token,
        admin: data.admin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-admin-token': token,
          },
        });
      } catch {
        // Ignore logout request network failure
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, admin: null, isAuthenticated: false, error: null });
  },

  checkSession: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-token': token,
        },
      });

      if (!res.ok) {
        // Invalid or expired
        get().logout();
      } else {
        const data = await res.json();
        set({ admin: data.admin, isAuthenticated: true });
        localStorage.setItem(USER_KEY, JSON.stringify(data.admin));
      }
    } catch {
      // Network error, keep existing state
    }
  },

  adminFetch: async (endpoint, options = {}) => {
    const { token, logout } = get();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
      window.location.href = '/admin/login';
      throw new Error('Session expired. Please log in again.');
    }

    return res;
  },
}));
