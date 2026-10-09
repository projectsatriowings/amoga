/**
 * AMOGA E-COMMERCE — CHECKOUT & ORDERS API SERVICE
 */

import { request } from './apiClient';

/**
 * Validates the cart items authoritatively against the backend PostgreSQL database
 */
export async function validateCartApi(cartItems) {
  const formattedItems = cartItems.map((item) => ({
    productId: item.productId || item.id,
    variantId: item.selectedVariant?.id || item.variantId || null,
    quantity: item.quantity,
  }));

  const result = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({ items: formattedItems }),
  });

  return result;
}

/**
 * Creates a persistent database order
 */
export async function createOrderApi({ items, customer, idempotencyKey = null, isDemo = false }) {
  const formattedItems = items.map((item) => ({
    productId: item.productId || item.id,
    variantId: item.selectedVariant?.id || item.variantId || null,
    quantity: item.quantity,
  }));

  const result = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: formattedItems,
      customer,
      idempotencyKey,
      isDemo,
    }),
  });

  return result;
}

/**
 * Retrieves a customer's order by reference using the guest access token
 */
export async function fetchOrderApi(orderReference, guestAccessToken) {
  const result = await request(`/orders/${encodeURIComponent(orderReference)}`, {
    headers: {
      'x-guest-access-token': guestAccessToken,
    },
  });

  return result.data;
}

/**
 * Initiates a payment order attempt with the backend
 */
export async function createPaymentOrderApi({ orderReference, guestAccessToken, idempotencyKey = null }) {
  const result = await request('/payments/create-order', {
    method: 'POST',
    headers: {
      'x-guest-access-token': guestAccessToken,
    },
    body: JSON.stringify({
      orderReference,
      idempotencyKey,
    }),
  });

  return result.data;
}

/**
 * Verifies payment callback signature with the backend
 */
export async function verifyPaymentApi({
  orderReference,
  paymentReference,
  providerOrderId,
  providerPaymentId,
  providerSignature,
  guestAccessToken,
}) {
  const result = await request('/payments/verify', {
    method: 'POST',
    headers: {
      'x-guest-access-token': guestAccessToken,
    },
    body: JSON.stringify({
      orderReference,
      paymentReference,
      providerOrderId,
      providerPaymentId,
      providerSignature,
    }),
  });

  return result.data;
}

/**
 * Development test payment simulation helper
 */
export async function testSimulatePaymentApi({
  orderReference,
  paymentReference,
  outcome = 'success',
  guestAccessToken,
}) {
  const result = await request('/payments/test-simulate', {
    method: 'POST',
    headers: {
      'x-guest-access-token': guestAccessToken,
    },
    body: JSON.stringify({
      orderReference,
      paymentReference,
      outcome,
    }),
  });

  return result;
}

/**
 * Retrieves protected payment status
 */
export async function fetchPaymentStatusApi(paymentReference, guestAccessToken) {
  const result = await request(`/payments/${encodeURIComponent(paymentReference)}/status`, {
    headers: {
      'x-guest-access-token': guestAccessToken,
    },
  });

  return result.data;
}

