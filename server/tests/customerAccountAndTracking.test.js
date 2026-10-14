import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const { headers, ...restOptions } = options;
  const res = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

test.before(async () => {
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Customer Account & Order Tracking Test Suite', async (t) => {
  const testEmail1 = `client_${Date.now()}_1@amoga-luxury.com`;
  const testEmail2 = `client_${Date.now()}_2@amoga-luxury.com`;
  let customer1Token = null;
  let customer2Token = null;
  let customer1Id = null;
  let createdAddressId = null;
  let createdOrderRef = null;
  let guestAccessToken = null;

  await t.test('1. Customer Registration & Password Hashing', async () => {
    // Rejects invalid email
    const badEmail = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: 'password123', name: 'Test User' }),
    });
    assert.equal(badEmail.status, 400);

    // Rejects weak password
    const weakPass = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail1, password: '123', name: 'Test User' }),
    });
    assert.equal(weakPass.status, 400);

    // Successfully registers customer 1
    const regRes = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail1,
        password: 'LuxuryPassword@2026',
        name: 'Maharani Gayatri',
        phone: '+91 9876543210',
      }),
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.data.success, true);
    assert.ok(regRes.data.token);
    assert.equal(regRes.data.customer.email, testEmail1);
    assert.equal(regRes.data.customer.name, 'Maharani Gayatri');

    customer1Token = regRes.data.token;
    customer1Id = regRes.data.customer.id;

    // Duplicate email is rejected with 409 Conflict
    const dupRes = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail1,
        password: 'AnotherPassword',
        name: 'Duplicate Check',
      }),
    });
    assert.equal(dupRes.status, 409);

    // Successfully registers customer 2 (for multi-tenant isolation tests)
    const regRes2 = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail2,
        password: 'LuxuryPassword@2026',
        name: 'Princess Sita',
      }),
    });
    assert.equal(regRes2.status, 201);
    customer2Token = regRes2.data.token;
  });

  await t.test('2. Customer Login & Session Validation', async () => {
    // Rejects incorrect password
    const wrongPass = await apiRequest('/api/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail1, password: 'WrongPassword' }),
    });
    assert.equal(wrongPass.status, 401);

    // Rejects non-existent email
    const noUser = await apiRequest('/api/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'LuxuryPassword@2026' }),
    });
    assert.equal(noUser.status, 401);

    // Successful login returns valid session token
    const loginRes = await apiRequest('/api/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail1, password: 'LuxuryPassword@2026' }),
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.token);
    assert.equal(loginRes.data.customer.email, testEmail1);
    customer1Token = loginRes.data.token;
  });

  await t.test('3. Profile Retrieval & Protected Access Control', async () => {
    // Unauthenticated request is rejected with 401
    const unauth = await apiRequest('/api/customer/me');
    assert.equal(unauth.status, 401);

    // Authenticated customer gets profile
    const profileRes = await apiRequest('/api/customer/me', {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.data.customer.name, 'Maharani Gayatri');

    // Update profile
    const updateRes = await apiRequest('/api/customer/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ name: 'Maharani Gayatri Devi', phone: '+91 9123456789' }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.customer.name, 'Maharani Gayatri Devi');
  });

  await t.test('4. Multiple Saved Delivery Addresses Management', async () => {
    // Add primary address
    const addRes = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        label: 'Palace Residence',
        fullName: 'Maharani Gayatri Devi',
        phone: '+91 9123456789',
        addressLine1: 'City Palace, Jaleb Chowk',
        addressLine2: 'Private Royal Quarters',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302002',
        isDefault: true,
      }),
    });
    assert.equal(addRes.status, 201);
    assert.equal(addRes.data.address.city, 'Jaipur');
    assert.equal(addRes.data.address.isDefault, true);
    createdAddressId = addRes.data.address.id;

    // Add secondary address
    const addRes2 = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        label: 'Summer Estate',
        fullName: 'Maharani Gayatri Devi',
        phone: '+91 9123456789',
        addressLine1: 'Lalbagh Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560027',
        isDefault: false,
      }),
    });
    assert.equal(addRes2.status, 201);

    // List addresses
    const listRes = await apiRequest('/api/customer/addresses', {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.addresses.length, 2);

    // Customer 2 cannot access Customer 1's address
    const crossDelete = await apiRequest(`/api/customer/addresses/${createdAddressId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    assert.equal(crossDelete.status, 404);
  });

  await t.test('5. Order Creation with Customer Linkage & Initial Tracking Event', async () => {
    const productsRes = await apiRequest('/api/products?collection=food');
    assert.ok(productsRes.data.data.length > 0);
    const prod = productsRes.data.data[0];

    // Place order with customer 1 token in header
    const orderRes = await apiRequest('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        items: [{ productId: prod.id, quantity: 2 }],
        customer: {
          fullName: 'Maharani Gayatri Devi',
          email: testEmail1,
          phone: '9123456789',
          addressLine1: 'City Palace, Jaleb Chowk',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302002',
        },
      }),
    });
    assert.equal(orderRes.status, 201);
    assert.ok(orderRes.data.orderReference);
    createdOrderRef = orderRes.data.orderReference;
    guestAccessToken = orderRes.data.guestAccessToken;

    // Verify order was linked to customer 1 in DB
    const dbOrder = await prisma.order.findUnique({
      where: { orderReference: createdOrderRef },
      include: { trackingEvents: true },
    });
    assert.equal(dbOrder.customerId, customer1Id);
    assert.ok(dbOrder.trackingEvents.length >= 1);
    assert.equal(dbOrder.trackingEvents[0].status, 'PENDING_CONFIRMATION');
  });

  await t.test('6. Customer Order Isolation: Cannot View Other Customer Orders', async () => {
    // Customer 1 can list their orders and see created order
    const c1Orders = await apiRequest('/api/customer/orders', {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(c1Orders.status, 200);
    assert.equal(c1Orders.data.orders.length, 1);
    assert.equal(c1Orders.data.orders[0].orderReference, createdOrderRef);

    // Customer 1 can view specific order details
    const c1Detail = await apiRequest(`/api/customer/orders/${createdOrderRef}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(c1Detail.status, 200);
    assert.equal(c1Detail.data.order.orderReference, createdOrderRef);

    // Customer 2 list of orders is empty
    const c2Orders = await apiRequest('/api/customer/orders', {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    assert.equal(c2Orders.status, 200);
    assert.equal(c2Orders.data.orders.length, 0);

    // Customer 2 attempting to view Customer 1's order is rejected with 403 Forbidden!
    const c2CrossAccess = await apiRequest(`/api/customer/orders/${createdOrderRef}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    assert.equal(c2CrossAccess.status, 403);
    assert.equal(c2CrossAccess.data.error, 'FORBIDDEN');
  });

  await t.test('7. Order Tracking Security & Masking', async () => {
    // Unverified public tracking request returns masked privacy protection
    const unverifiedTrack = await apiRequest(`/api/orders/${createdOrderRef}/track`);
    assert.equal(unverifiedTrack.status, 200);
    assert.equal(unverifiedTrack.data.isMasked, true);
    assert.equal(unverifiedTrack.data.verificationRequired, true);
    assert.ok(unverifiedTrack.data.tracking.destinationCity.includes('Jaipur'));
    assert.equal(unverifiedTrack.data.tracking.deliveryDestination, undefined); // Private street masked

    // Tracking with matching verification email returns full verified details
    const verifiedTrack = await apiRequest(
      `/api/orders/${createdOrderRef}/track?email=${encodeURIComponent(testEmail1)}`
    );
    assert.equal(verifiedTrack.status, 200);
    assert.equal(verifiedTrack.data.isMasked, false);
    assert.equal(verifiedTrack.data.tracking.customerName, 'Maharani Gayatri Devi');
    assert.ok(verifiedTrack.data.tracking.milestones.length === 4);

    // Tracking with guest access token returns full verified details
    const guestTrack = await apiRequest(`/api/orders/${createdOrderRef}/track`, {
      headers: { 'x-guest-access-token': guestAccessToken },
    });
    assert.equal(guestTrack.status, 200);
    assert.equal(guestTrack.data.isMasked, false);

    // Tracking while logged in as customer 1 returns full verified details
    const authTrack = await apiRequest(`/api/orders/${createdOrderRef}/track`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(authTrack.status, 200);
    assert.equal(authTrack.data.isMasked, false);
  });

  await t.test('8. Admin Status Progression & Tracking Events Logging', async () => {
    // Obtain admin token
    const adminLogin = await apiRequest('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@amoga.com', password: 'Admin@Amoga2026!' }),
    });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.data.token;

    const dbOrder = await prisma.order.findUnique({ where: { orderReference: createdOrderRef } });

    // Transition order to CONFIRMED
    const moveConfirmed = await apiRequest(`/api/admin/orders/${dbOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'CONFIRMED', reason: 'Verified bank wire' }),
    });
    assert.equal(moveConfirmed.status, 200);

    // Transition order to PROCESSING
    const moveProc = await apiRequest(`/api/admin/orders/${dbOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'PROCESSING', reason: 'Atelier packing initiated' }),
    });
    assert.equal(moveProc.status, 200);

    // Update tracking info
    const updateTracking = await apiRequest(`/api/admin/orders/${dbOrder.id}/tracking`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        carrier: 'Blue Dart Express',
        trackingNumber: 'BLUEDART-88291024',
        trackingUrl: 'https://www.bluedart.com/tracking?trackNumber=BLUEDART-88291024',
      }),
    });
    assert.equal(updateTracking.status, 200);

    // Transition order to DISPATCHED
    const moveDisp = await apiRequest(`/api/admin/orders/${dbOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'DISPATCHED', reason: 'Handed over to Blue Dart courier' }),
    });
    assert.equal(moveDisp.status, 200);

    // Verify customer tracking reflects carrier, tracking link, and new milestone
    const trackAfterDispatch = await apiRequest(`/api/orders/${createdOrderRef}/track`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(trackAfterDispatch.data.tracking.status, 'DISPATCHED');
    assert.equal(trackAfterDispatch.data.tracking.carrier, 'Blue Dart Express');
    assert.equal(trackAfterDispatch.data.tracking.trackingNumber, 'BLUEDART-88291024');
    assert.ok(trackAfterDispatch.data.tracking.trackingUrl.includes('bluedart.com'));
    assert.ok(trackAfterDispatch.data.tracking.events.length >= 3);
  });
});
