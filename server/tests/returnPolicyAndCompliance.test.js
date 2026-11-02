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

test('AMOGA Returns, Evidence Storage, GSTIN & FSSAI Compliance Suite', async (t) => {
  let adminToken = null;

  const testEmailA = `customer_a_${Date.now()}@amoga-compliance.test`;
  const testEmailB = `customer_b_${Date.now()}@amoga-compliance.test`;
  let tokenA = null;
  let tokenB = null;
  let customerAId = null;
  let customerBId = null;

  let testOrderAId = null;
  let testOrderARef = null;
  let testOrderItemAId = null;

  let testOrderBId = null;
  let testOrderBRef = null;

  let createdReturnId = null;
  let createdReturnRef = null;
  let createdEvidenceId = null;

  await t.test('1. Setup customers, orders, and catalogue items', async () => {
    // Authenticate Admin
    const adminLogin = await apiRequest('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@amoga.com',
        password: 'Admin@Amoga2026!',
      }),
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.data.token;

    // Register Customer A
    const regA = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmailA,
        password: 'Password@2026',
        name: 'Aaditya Sharma',
        phone: '+91 9988776655',
      }),
    });
    assert.equal(regA.status, 201);
    tokenA = regA.data.token;
    customerAId = regA.data.customer.id;

    // Register Customer B
    const regB = await apiRequest('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmailB,
        password: 'Password@2026',
        name: 'Bhavna Patel',
        phone: '+91 9988776644',
      }),
    });
    assert.equal(regB.status, 201);
    tokenB = regB.data.token;
    customerBId = regB.data.customer.id;

    // Fetch an existing product for test orders
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, price: true, collectionId: true },
    });
    assert.ok(product, 'An active product must exist in database');

    // Place Order for Customer A via API
    const orderResA = await apiRequest('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 2 }],
        customer: {
          fullName: 'Aaditya Sharma',
          email: testEmailA,
          phone: '9988776655',
          addressLine1: '42 Lotus Boulevard',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        },
      }),
    });
    assert.equal(orderResA.status, 201);
    testOrderARef = orderResA.data.orderReference;

    const dbOrderA = await prisma.order.findUnique({
      where: { orderReference: testOrderARef },
      include: { items: true },
    });
    testOrderAId = dbOrderA.id;
    testOrderItemAId = dbOrderA.items[0].id;

    // Place Order for Customer B via API and set status DELIVERED
    const orderResB = await apiRequest('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 1 }],
        customer: {
          fullName: 'Bhavna Patel',
          email: testEmailB,
          phone: '9988776644',
          addressLine1: '12 Marine Lines',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020',
        },
      }),
    });
    assert.equal(orderResB.status, 201);
    testOrderBRef = orderResB.data.orderReference;

    const dbOrderB = await prisma.order.update({
      where: { orderReference: testOrderBRef },
      data: { status: 'DELIVERED' },
    });
    testOrderBId = dbOrderB.id;
  });

  await t.test('2. Public Compliance Endpoint exposes verified GSTIN and 14-digit FSSAI', async () => {
    const res = await apiRequest('/api/checkout/shipping-config');
    assert.equal(res.status, 200);
    const compliance = res.data.config?.compliance || res.data.compliance;
    assert.ok(compliance, 'Must return compliance block');
    assert.equal(compliance.sellerGstin, '33AYMPK1833D1ZQ');
    assert.equal(compliance.sellerLegalName, 'Amoga Luxury Private Limited');
    assert.equal(compliance.fssaiLicenseNumber, '22425540000677');
    assert.equal(compliance.returnWindowDays, 7);
    assert.equal(compliance.returnPolicyVersion, '2026.1');
  });

  await t.test('3. Delivery Status Enforcement: Non-delivered orders cannot be returned', async () => {
    // Order A is PROCESSING, not DELIVERED
    const res = await apiRequest('/api/customer/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderReference: testOrderARef,
        reason: 'DAMAGED_PRODUCT',
        resolutionType: 'REPLACEMENT',
        customerNote: 'Package arrived with crushed external carton',
        items: [{ orderItemId: testOrderItemAId, quantity: 1 }],
      }),
    });

    assert.equal(res.status, 400);
    assert.match(res.data.message, /DELIVERED/i);
  });

  await t.test('4. Customer Ownership Enforcement: Cross-customer return requests are blocked', async () => {
    // Customer A tries to submit a return request against Customer B's DELIVERED order
    const res = await apiRequest('/api/customer/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderReference: testOrderBRef,
        reason: 'INCORRECT_PRODUCT',
        resolutionType: 'REFUND',
        customerNote: 'Customer A trying to claim Customer B order',
        items: [{ orderItemId: testOrderItemAId, quantity: 1 }],
      }),
    });

    assert.equal(res.status, 403);
    assert.match(res.data.message, /not authorized|denied|ownership/i);
  });

  await t.test('5. Valid Return Submission with Private Evidence Upload & Optional Video', async () => {
    // Advance Order A to DELIVERED
    await prisma.order.update({
      where: { id: testOrderAId },
      data: { status: 'DELIVERED' },
    });

    // Create a base64 1x1 png image and a dummy mp4 base64
    const fakeImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const fakeVideoBase64 = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAW1wNDJpc29tYXZjMQAA';

    const submitRes = await apiRequest('/api/customer/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderReference: testOrderARef,
        reason: 'DAMAGED_PRODUCT',
        resolutionType: 'REPLACEMENT',
        customerNote: 'The packaging seal was broken and bottle cracked in transit during courier handling.',
        items: [{ orderItemId: testOrderItemAId, quantity: 1 }],
        evidence: [
          {
            originalName: 'damage_front.png',
            mimeType: 'image/png',
            fileSizeBytes: 120,
            fileData: fakeImageBase64,
          },
          {
            originalName: 'unboxing_optional.mp4',
            mimeType: 'video/mp4',
            fileSizeBytes: 200,
            fileData: fakeVideoBase64,
          },
        ],
      }),
    });

    assert.equal(submitRes.status, 201);
    assert.ok(submitRes.data.success);
    assert.ok(submitRes.data.returnRequest.returnReference.startsWith('AMOGA-RET-'));
    assert.ok(submitRes.data.returnRequest.status === 'SUBMITTED' || submitRes.data.returnRequest.status === 'REQUESTED');
    assert.equal(submitRes.data.returnRequest.evidence.length, 2);

    createdReturnId = submitRes.data.returnRequest.id;
    createdReturnRef = submitRes.data.returnRequest.returnReference;
    createdEvidenceId = submitRes.data.returnRequest.evidence[0].id;

    // Verify storage key is secure and unguessable (not raw file bytes in database)
    const storedEvidence = await prisma.returnEvidence.findUnique({
      where: { id: createdEvidenceId },
    });
    assert.ok(storedEvidence.storageKey);
    assert.ok(!storedEvidence.storageKey.includes('..'));
    assert.ok(storedEvidence.fileSize > 0);
  });

  await t.test('6. Evidence Access Control: Unauthorized customer cannot stream private evidence', async () => {
    // Customer B attempts to stream Customer A's return evidence
    const res = await fetch(`${baseUrl}/api/customer/returns/${createdReturnRef}/evidence/${createdEvidenceId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.ok(res.status === 403 || res.status === 404);

    // Customer A (the rightful owner) can stream their evidence
    const goodRes = await fetch(`${baseUrl}/api/customer/returns/${createdReturnRef}/evidence/${createdEvidenceId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(goodRes.status, 200);
    assert.equal(goodRes.headers.get('content-type'), 'image/png');
  });

  await t.test('7. Admin Review, Pickup Scheduling, and Workflow Advancement', async () => {
    // Admin list returns
    const listRes = await apiRequest('/api/admin/returns', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    const returnList = listRes.data.returnRequests || listRes.data.requests || [];
    assert.ok(returnList.some((r) => r.id === createdReturnId));

    // Admin moves to UNDER_REVIEW
    const revRes = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'UNDER_REVIEW',
        adminNote: 'Evidence verified by logistics supervisor. Damage verified.',
      }),
    });
    assert.equal(revRes.status, 200);
    assert.equal(revRes.data.returnRequest.status, 'UNDER_REVIEW');

    // Admin APPROVES claim and schedules reverse pickup
    const pickupRes = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'PICKUP_SCHEDULED',
        reverseCarrier: 'India Post Speed Post',
        reverseAwbNumber: 'IP-RET-99882211',
        adminNote: 'Reverse pickup booked via Speed Post doorstep collection.',
      }),
    });
    assert.equal(pickupRes.status, 200);
    assert.equal(pickupRes.data.returnRequest.status, 'PICKUP_SCHEDULED');
    assert.equal(pickupRes.data.returnRequest.reverseAwbNumber, 'IP-RET-99882211');

    // Admin records RECEIPT AT FACILITY
    const receiveRes = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'RECEIVED_AT_FACILITY',
        adminNote: 'Consignment received at Chennai central fulfillment facility.',
      }),
    });
    assert.equal(receiveRes.status, 200);

    // Admin records INSPECTION PASSED
    const inspectRes = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'INSPECTED_PASSED',
        adminNote: 'Inspection complete. Goods confirmed defective/damaged in transit.',
      }),
    });
    assert.equal(inspectRes.status, 200);
  });

  await t.test('8. Duplicate Restock Prevention Guard', async () => {
    // First restock
    const restock1 = await apiRequest(`/api/admin/returns/${createdReturnId}/restock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ note: 'First restock execution' }),
    });
    assert.equal(restock1.status, 200);
    assert.equal(restock1.data.returnRequest.isRestocked, true);

    // Second restock must be rejected to prevent stock duplication
    const restock2 = await apiRequest(`/api/admin/returns/${createdReturnId}/restock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ note: 'Attempting duplicate restock' }),
    });
    assert.equal(restock2.status, 400);
    assert.match(restock2.data.message, /already been restocked/i);
  });

  await t.test('9. Duplicate Refund Prevention Guard', async () => {
    // First refund completion
    const refund1 = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'REFUND_COMPLETED',
        refundAmount: 500,
        refundReference: 'RAZORPAY-RFND-982104',
        adminNote: 'Refund credited to original bank card.',
      }),
    });
    assert.equal(refund1.status, 200);
    assert.equal(refund1.data.returnRequest.status, 'REFUND_COMPLETED');
    assert.equal(refund1.data.returnRequest.refundStatus, 'PROCESSED');
    assert.equal(refund1.data.returnRequest.refundReference, 'RAZORPAY-RFND-982104');

    // Attempting to re-refund an already processed claim must be rejected
    const refund2 = await apiRequest(`/api/admin/returns/${createdReturnId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'REFUND_COMPLETED',
        refundAmount: 500,
        refundReference: 'DUPLICATE-RFND-000000',
        adminNote: 'Attempting duplicate refund',
      }),
    });
    assert.equal(refund2.status, 400);
    assert.match(refund2.data.message, /(already processed|already completed|already been completed)/i);
  });

  await t.test('10. FSSAI 14-Digit Format Validation in Admin Store Settings', async () => {
    // Invalid FSSAI format (13 digits)
    const badFssai = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fssaiLicenseNumber: '1152200100045', // 13 digits
      }),
    });
    assert.equal(badFssai.status, 400);
    assert.match(badFssai.data.message, /14 digits/i);

    // Invalid FSSAI format (letters)
    const alphaFssai = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fssaiLicenseNumber: '1152200100045A',
      }),
    });
    assert.equal(alphaFssai.status, 400);

    // Valid FSSAI 14-digit update
    const goodFssai = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fssaiLicenseNumber: '22425540000677',
        fssaiLicenseHolder: 'Amoga Luxury Private Limited',
        fssaiLicenseType: 'State License - Online E-Commerce & Retail',
        returnWindowDays: 7,
        foodReturnWindowHours: 48,
        returnPolicyVersion: '2026.1',
      }),
    });
    assert.equal(goodFssai.status, 200);
    assert.equal(goodFssai.data.settings.fssaiLicenseNumber, '22425540000677');
  });

  await t.test('11. Cleanup test fixtures', async () => {
    // Delete created return records
    if (createdReturnId) {
      await prisma.returnStatusHistory.deleteMany({ where: { returnRequestId: createdReturnId } });
      await prisma.returnEvidence.deleteMany({ where: { returnRequestId: createdReturnId } });
      await prisma.returnRequestItem.deleteMany({ where: { returnRequestId: createdReturnId } });
      await prisma.returnRequest.deleteMany({ where: { id: createdReturnId } });
    }
    // Delete test orders
    if (testOrderAId) {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderAId } });
      await prisma.order.deleteMany({ where: { id: testOrderAId } });
    }
    if (testOrderBId) {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderBId } });
      await prisma.order.deleteMany({ where: { id: testOrderBId } });
    }
    // Delete test customers
    if (customerAId) await prisma.customer.deleteMany({ where: { id: customerAId } });
    if (customerBId) await prisma.customer.deleteMany({ where: { id: customerBId } });
  });
});
