import { useAdminStore } from '../../store/useAdminStore';

function getAuthHeaders() {
  const token = useAdminStore.getState().token || localStorage.getItem('amoga_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export const posApi = {
  // 1. Catalog Search
  async searchCatalog({ query = '', collectionId = 'all', inStockOnly = false } = {}) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (collectionId) params.append('collectionId', collectionId);
    if (inStockOnly) params.append('inStockOnly', 'true');

    const res = await fetch(`/api/admin/pos/catalog?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 2. Pre-flight calculation
  async calculateBill(payload) {
    const res = await fetch('/api/admin/pos/calculate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // 3. Finalize Bill
  async finalizeBill(payload) {
    const res = await fetch('/api/admin/pos/sales', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // 4. Sales History
  async listSales(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        query.append(k, v);
      }
    });

    const res = await fetch(`/api/admin/pos/sales?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 5. Single Sale Detail
  async getSale(id) {
    const res = await fetch(`/api/admin/pos/sales/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 6. Cancel Sale
  async cancelSale(id, reason) {
    const res = await fetch(`/api/admin/pos/sales/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  // 7. Refund Sale
  async refundSale(id, { refundAmount, reason, restockItems = true }) {
    const res = await fetch(`/api/admin/pos/sales/${encodeURIComponent(id)}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ refundAmount, reason, restockItems }),
    });
    return handleResponse(res);
  },

  // 8. Send WhatsApp
  async sendWhatsApp(id, phone = null, forceManual = false) {
    const res = await fetch(`/api/admin/pos/sales/${encodeURIComponent(id)}/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, forceManual }),
    });
    return handleResponse(res);
  },

  // 9. Aggregated Reports
  async getReports(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        query.append(k, v);
      }
    });

    const res = await fetch(`/api/admin/pos/reports?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 10. Stall Events
  async listEvents(status = 'all') {
    const params = status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/admin/pos/events${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createEvent(payload) {
    const res = await fetch('/api/admin/pos/events', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateEvent(id, payload) {
    const res = await fetch(`/api/admin/pos/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // 11. POS Settings
  async getSettings() {
    const res = await fetch('/api/admin/pos/settings', {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateSettings(payload) {
    const res = await fetch('/api/admin/pos/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // 12. Public Receipt (Unauthenticated)
  async getPublicReceipt(token) {
    const res = await fetch(`/api/pos/receipt/${encodeURIComponent(token)}`);
    return handleResponse(res);
  },
};
