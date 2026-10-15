/**
 * AMOGA E-COMMERCE — CHECKOUT & ORDERS API SERVICE
 */

import { request } from './apiClient';

/**
 * Validates the cart items authoritatively against the backend PostgreSQL database
 */
export async function validateCartApi(cartItems) {
  const items = Array.isArray(cartItems) ? cartItems : (cartItems?.items || []);
  const formattedItems = items.map((item) => ({
    productId: item.productId || item.product?.id || item.id,
    variantId: item.selectedVariant?.id || item.selectedVariant?.sourceId || item.variantId || null,
    quantity: item.quantity,
  }));

  const result = await request('/checkout/validate', {
    method: 'POST',
    timeout: 30000,
    body: JSON.stringify({ items: formattedItems }),
  });

  return result;
}

export async function applyCouponApi({ code, subtotal, items = [] }) {
  const formattedItems = items.map((item) => ({
    productId: item.productId || item.product?.id || item.id,
    collectionId: item.collectionId || item.product?.collection || item.collection,
    price: item.price !== undefined ? item.price : item.product?.price,
    quantity: item.quantity,
  }));

  const result = await request('/checkout/apply-coupon', {
    method: 'POST',
    timeout: 30000,
    body: JSON.stringify({
      code,
      subtotal,
      items: formattedItems,
    }),
  });

  return result;
}

/**
 * Creates a persistent database order
 */
export async function createOrderApi({ items: rawItems, customer, idempotencyKey = null, isDemo = false, couponCode = null, paymentMethod = 'online' }) {
  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
  const formattedItems = items.map((item) => ({
    productId: item.productId || item.product?.id || item.id,
    variantId: item.selectedVariant?.id || item.selectedVariant?.sourceId || item.variantId || null,
    quantity: item.quantity,
  }));

  const sanitizedCustomer = {
    fullName: customer?.fullName?.trim() || '',
    email: customer?.email?.trim()?.toLowerCase() || '',
    phone: customer?.phone?.trim() || '',
    addressLine1: customer?.addressLine1?.trim() || '',
    addressLine2: customer?.addressLine2?.trim() || null,
    city: customer?.city?.trim() || '',
    state: customer?.state?.trim() || '',
    pincode: customer?.pincode?.trim() || '',
    instructions: customer?.instructions?.trim() || customer?.deliveryInstructions?.trim() || null,
  };

  const result = await request('/orders', {
    method: 'POST',
    timeout: 60000,
    body: JSON.stringify({
      items: formattedItems,
      customer: sanitizedCustomer,
      idempotencyKey,
      isDemo,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
      paymentMethod,
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
    timeout: 30000,
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
    timeout: 60000,
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
    timeout: 60000,
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
    timeout: 60000,
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

