function getStallAuthHeaders() {
  const token = localStorage.getItem('amoga_stall_token') || localStorage.getItem('amoga_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}`, 'x-stall-token': token } : {}),
  };
}

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `HTTP request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const stallApi = {
  // Authentication
  async login({ email, password }) {
    const res = await fetch('/api/stall/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch('/api/stall/auth/me', {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  async logout() {
    const res = await fetch('/api/stall/auth/logout', {
      method: 'POST',
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const res = await fetch('/api/stall/auth/change-password', {
      method: 'POST',
      headers: getStallAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    return handleResponse(res);
  },

  // Locations & Settings
  async listLocations() {
    const res = await fetch('/api/stall/locations', {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSettings() {
    const res = await fetch('/api/stall/settings', {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Catalog Search scoped to stall inventory
  async searchCatalog({ query = '', collectionId = 'all', inStockOnly = false, stockLocationId = null } = {}) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (collectionId && collectionId !== 'all') params.append('collectionId', collectionId);
    if (inStockOnly) params.append('inStockOnly', 'true');
    if (stockLocationId && stockLocationId !== 'all') params.append('stockLocationId', stockLocationId);

    const res = await fetch(`/api/stall/catalog?${params.toString()}`, {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Pre-flight calculation
  async calculateBill(payload) {
    const res = await fetch('/api/stall/calculate', {
      method: 'POST',
      headers: getStallAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Finalize POS Sale with atomic inventory deduction
  async finalizeBill(payload) {
    const res = await fetch('/api/stall/finalize', {
      method: 'POST',
      headers: getStallAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Sales History
  async listSales(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        query.append(k, v);
      }
    });

    const res = await fetch(`/api/stall/sales?${query.toString()}`, {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSale(id) {
    const res = await fetch(`/api/stall/sales/${encodeURIComponent(id)}`, {
      headers: getStallAuthHeaders(),
    });
    return handleResponse(res);
  },

  // WhatsApp receipt dispatch
  async sendWhatsApp(payload) {
    const res = await fetch('/api/stall/whatsapp', {
      method: 'POST',
      headers: getStallAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Stock transfer into stall
  async transferStock(payload) {
    const res = await fetch('/api/stall/transfers', {
      method: 'POST',
      headers: getStallAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
