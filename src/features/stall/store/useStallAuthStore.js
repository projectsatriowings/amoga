import { create } from 'zustand';
import { stallApi } from '../services/stallApiClient';

const getInitialToken = () => localStorage.getItem('amoga_stall_token') || null;
const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('amoga_stall_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useStallAuthStore = create((set, get) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: Boolean(getInitialToken()),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await stallApi.login({ email, password });
      if (data?.token && data?.user) {
        localStorage.setItem('amoga_stall_token', data.token);
        localStorage.setItem('amoga_stall_user', JSON.stringify(data.user));
        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'Login failed');
    } catch (err) {
      const msg = err.message || 'Invalid email or password';
      set({ isLoading: false, error: msg, isAuthenticated: false, token: null, user: null });
      localStorage.removeItem('amoga_stall_token');
      localStorage.removeItem('amoga_stall_user');
      return { success: false, error: msg };
    }
  },

  checkSession: async () => {
    const token = get().token || localStorage.getItem('amoga_stall_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const data = await stallApi.getMe();
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true });
        localStorage.setItem('amoga_stall_user', JSON.stringify(data.user));
        return true;
      }
      get().logout();
      return false;
    } catch (err) {
      console.warn('[StallAuthStore] Session check failed:', err.message);
      get().logout();
      return false;
    }
  },

  logout: async () => {
    try {
      await stallApi.logout().catch(() => {});
    } finally {
      localStorage.removeItem('amoga_stall_token');
      localStorage.removeItem('amoga_stall_user');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
