/**
 * AMOGA E-COMMERCE — CUSTOMER ACCOUNT & TRACKING API SERVICE
 */

import { request } from './apiClient';

function getAuthHeader() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('amoga_customer_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Register a new customer account
 */
export async function registerCustomerApi({ email, password, name, phone }) {
  return await request('/customer/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, phone }),
  });
}

/**
 * Log in customer
 */
export async function loginCustomerApi({ email, password }) {
  return await request('/customer/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Log out customer session
 */
export async function logoutCustomerApi() {
  return await request('/customer/logout', {
    method: 'POST',
    headers: getAuthHeader(),
  });
}

/**
 * Get customer profile & account overview
 */
export async function fetchCustomerProfileApi() {
  return await request('/customer/me', {
    headers: getAuthHeader(),
  });
}

/**
 * Update customer profile details
 */
export async function updateCustomerProfileApi({ name, phone }) {
  return await request('/customer/profile', {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ name, phone }),
  });
}

/**
 * List customer saved delivery addresses
 */
export async function fetchCustomerAddressesApi() {
  return await request('/customer/addresses', {
    headers: getAuthHeader(),
  });
}

/**
 * Add a new delivery address
 */
export async function createCustomerAddressApi(addressData) {
  return await request('/customer/addresses', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(addressData),
  });
}

/**
 * Update an existing delivery address
 */
export async function updateCustomerAddressApi(id, addressData) {
  return await request(`/customer/addresses/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(addressData),
  });
}

/**
 * Delete a delivery address
 */
export async function deleteCustomerAddressApi(id) {
  return await request(`/customer/addresses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
}

/**
 * Set an address as default
 */
export async function setDefaultCustomerAddressApi(id) {
  return await request(`/customer/addresses/${id}/default`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });
}

/**
 * List orders for authenticated customer
 */
export async function fetchCustomerOrdersApi() {
  return await request('/customer/orders', {
    headers: getAuthHeader(),
  });
}

/**
 * Fetch specific customer order details
 */
export async function fetchCustomerOrderApi(orderReference) {
  return await request(`/customer/orders/${encodeURIComponent(orderReference)}`, {
    headers: getAuthHeader(),
  });
}

/**
 * Track an order by reference with optional guest verification
 */
export async function trackOrderApi(orderReference, { email, phone, guestAccessToken } = {}) {
  const queryParams = new URLSearchParams();
  if (email) queryParams.set('email', email.trim());
  if (phone) queryParams.set('phone', phone.trim());

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const headers = { ...getAuthHeader() };

  if (guestAccessToken) {
    headers['x-guest-access-token'] = guestAccessToken;
  } else if (typeof window !== 'undefined') {
    const cachedGuestToken = sessionStorage.getItem(`amoga_guest_token_${orderReference}`);
    if (cachedGuestToken) headers['x-guest-access-token'] = cachedGuestToken;
  }

  return await request(`/orders/${encodeURIComponent(orderReference)}/track${queryStr}`, {
    headers,
  });
}

/**
 * Request password reset instructions
 */
export async function forgotPasswordCustomerApi(email) {
  return await request('/customer/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify customer password reset token
 */
export async function verifyCustomerResetTokenApi(token) {
  return await request(`/customer/verify-reset-token?token=${encodeURIComponent(token)}`);
}

/**
 * Execute password reset with secure single-use token
 */
export async function resetPasswordCustomerApi({ token, newPassword, confirmPassword }) {
  return await request('/customer/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

/**
 * Self-service password change for logged-in customer
 */
export async function changePasswordCustomerApi({ currentPassword, newPassword, confirmPassword }) {
  return await request('/customer/change-password', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

