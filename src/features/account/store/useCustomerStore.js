import { create } from 'zustand';
import {
  registerCustomerApi,
  loginCustomerApi,
  logoutCustomerApi,
  fetchCustomerProfileApi,
  updateCustomerProfileApi,
  fetchCustomerAddressesApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  deleteCustomerAddressApi,
  setDefaultCustomerAddressApi,
  fetchCustomerOrdersApi,
} from '../../../services/customerApi';

const TOKEN_KEY = 'amoga_customer_token';

export const useCustomerStore = create((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  customer: null,
  isAuthenticated: Boolean(typeof window !== 'undefined' && localStorage.getItem(TOKEN_KEY)),
  isLoading: false,
  error: null,
  addresses: [],
  orders: [],

  initAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      set({ isAuthenticated: false, customer: null });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await fetchCustomerProfileApi();
      if (res && res.customer) {
        set({
          customer: res.customer,
          addresses: res.customer.addresses || [],
          isAuthenticated: true,
          error: null,
        });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null, customer: null, isAuthenticated: false });
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, customer: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginCustomerApi({ email, password });
      if (res && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        set({
          token: res.token,
          customer: res.customer,
          isAuthenticated: true,
          error: null,
        });
        await get().fetchAddresses();
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ email, password, name, phone }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await registerCustomerApi({ email, password, name, phone });
      if (res && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        set({
          token: res.token,
          customer: res.customer,
          isAuthenticated: true,
          error: null,
        });
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await logoutCustomerApi();
    } catch {
      // non-blocking
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      set({
        token: null,
        customer: null,
        isAuthenticated: false,
        addresses: [],
        orders: [],
        error: null,
      });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await fetchCustomerProfileApi();
      if (res && res.customer) {
        set({
          customer: res.customer,
          addresses: res.customer.addresses || [],
        });
      }
    } catch (err) {
      console.warn('Failed to refresh customer profile:', err.message);
    }
  },

  updateProfile: async ({ name, phone }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await updateCustomerProfileApi({ name, phone });
      if (res && res.customer) {
        set((state) => ({
          customer: { ...state.customer, ...res.customer },
        }));
        return { success: true };
      }
      throw new Error(res.message || 'Failed to update profile');
    } catch (err) {
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAddresses: async () => {
    try {
      const res = await fetchCustomerAddressesApi();
      if (res && res.addresses) {
        set({ addresses: res.addresses });
      }
    } catch (err) {
      console.warn('Failed to load addresses:', err.message);
    }
  },

  addAddress: async (addressData) => {
    try {
      const res = await createCustomerAddressApi(addressData);
      if (res && res.address) {
        await get().fetchAddresses();
        return { success: true, address: res.address };
      }
      throw new Error(res.message || 'Failed to save address');
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateAddress: async (id, addressData) => {
    try {
      const res = await updateCustomerAddressApi(id, addressData);
      if (res && res.address) {
        await get().fetchAddresses();
        return { success: true };
      }
      throw new Error(res.message || 'Failed to update address');
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteAddress: async (id) => {
    try {
      await deleteCustomerAddressApi(id);
      await get().fetchAddresses();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  setDefaultAddress: async (id) => {
    try {
      await setDefaultCustomerAddressApi(id);
      await get().fetchAddresses();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchCustomerOrdersApi();
      if (res && res.orders) {
        set({ orders: res.orders });
      }
    } catch (err) {
      console.warn('Failed to load orders:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },
}));
