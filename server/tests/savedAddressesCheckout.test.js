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
  return { status: res.status, ok: res.ok, data, headers: res.headers };
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

test('AMOGA Saved Delivery Addresses & Checkout Suite', async (t) => {
  const emailA = `customer_addr_a_${Date.now()}@amoga-test.com`;
  const emailB = `customer_addr_b_${Date.now()}@amoga-test.com`;
  let tokenA = null;
  let tokenB = null;
  let customerAId = null;
  let customerBId = null;

  let homeAddrId = null;
  let officeAddrId = null;
  let customAddrId = null;

  await t.test('1. Setup test customer accounts', async () => {
    const regA = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: emailA,
        password: 'Password123!',
        name: 'Aanya Sharma',
        phone: '9876543210',
      }),
    });
    assert.equal(regA.status, 201);
    tokenA = regA.data.token;
    customerAId = regA.data.customer.id;

    const regB = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: emailB,
        password: 'Password123!',
        name: 'Bharat Patel',
        phone: '9123456789',
      }),
    });
    assert.equal(regB.status, 201);
    tokenB = regB.data.token;
    customerBId = regB.data.customer.id;
  });

  await t.test('2. Save address with "Home" label', async () => {
    const res = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Aanya Sharma',
        phone: '9876543210',
        addressLine1: 'Villa 14, Heritage Palms',
        addressLine2: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        isDefault: true,
      }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.address.label, 'Home');
    assert.equal(res.data.address.city, 'Bengaluru');
    homeAddrId = res.data.address.id;
  });

  await t.test('3. Save address with "Office" label', async () => {
    const res = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        label: 'Office',
        fullName: 'Aanya Sharma',
        phone: '9876543210',
        addressLine1: 'Tech Park, Tower 4, Level 6',
        addressLine2: 'Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
      }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.address.label, 'Office');
    officeAddrId = res.data.address.id;
  });

  await t.test('4. Save address with custom label (Other: "Studio Annex")', async () => {
    const res = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        label: 'Studio Annex',
        fullName: 'Aanya Sharma',
        phone: '9876543210',
        addressLine1: '88 Art District, Lane 3',
        addressLine2: 'Near Gallery',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.address.label, 'Studio Annex');
    customAddrId = res.data.address.id;
  });

  await t.test('5. Duplicate address prevention: re-submitting same addressLine1 & pincode updates existing', async () => {
    const res = await apiRequest('/api/customer/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        label: 'Home Renovated',
        fullName: 'Aanya Sharma',
        phone: '9876543210',
        addressLine1: 'Villa 14, Heritage Palms',
        addressLine2: 'Indiranagar 2nd Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      }),
    });

    // Should return 200 with updated address and same id
    assert.equal(res.status, 200);
    assert.equal(res.data.address.id, homeAddrId);
    assert.equal(res.data.address.label, 'Home Renovated');

    // Total addresses for Customer A should still be 3 (not 4)
    const list = await apiRequest('/api/customer/addresses', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(list.data.addresses.length, 3);
  });

  await t.test('6. Security & Privacy: Customer B cannot read, edit, or delete Customer A addresses', async () => {
    // Attempt to update Customer A's address using Customer B's token
    const updateRes = await apiRequest(`/api/customer/addresses/${homeAddrId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        label: 'Hacked Label',
        addressLine1: 'Attacker Address',
        city: 'Nowhere',
        state: 'Karnataka',
        pincode: '560001',
      }),
    });
    assert.equal(updateRes.status, 404);

    // Attempt to delete Customer A's address using Customer B's token
    const delRes = await apiRequest(`/api/customer/addresses/${homeAddrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(delRes.status, 404);

    // Customer B's address list must NOT contain Customer A's addresses
    const listB = await apiRequest('/api/customer/addresses', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(listB.data.addresses.length, 0);
  });

  await t.test('7. Order Delivery Address Snapshot Integrity: editing saved address does not alter past orders', async () => {
    const orderRef = `AMOGA-ADDR-TEST-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderReference: orderRef,
        customer: { connect: { id: customerAId } },
        customerName: 'Aanya Sharma',
        customerEmail: emailA,
        customerPhone: '9876543210',
        addressLine1: 'Villa 14, Heritage Palms',
        addressLine2: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        paymentStatus: 'SUCCEEDED',
        status: 'CONFIRMED',
        subtotal: 1000,
        shippingAmount: 0,
        cgstAmount: 25,
        sgstAmount: 25,
        totalAmount: 1050,
      },
    });

    // Now edit the saved address
    await apiRequest(`/api/customer/addresses/${homeAddrId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        label: 'New Permanent Residence',
        fullName: 'Aanya Sharma',
        phone: '9876543210',
        addressLine1: '999 Completely Different Street',
        city: 'Mysuru',
        state: 'Karnataka',
        pincode: '570001',
      }),
    });

    // Check that historical order delivery address snapshot remains completely unchanged
    const historicOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    assert.equal(historicOrder.addressLine1, 'Villa 14, Heritage Palms');
    assert.equal(historicOrder.city, 'Bengaluru');
    assert.equal(historicOrder.pincode, '560038');

    // Clean up test order
    await prisma.order.delete({ where: { id: order.id } });
  });

  await t.test('8. Delete saved address', async () => {
    const res = await apiRequest(`/api/customer/addresses/${customAddrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(res.status, 200);

    const list = await apiRequest('/api/customer/addresses', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(list.data.addresses.length, 2);
    assert.ok(!list.data.addresses.some((a) => a.id === customAddrId));
  });
});
