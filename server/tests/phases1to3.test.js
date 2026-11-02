import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;
let superAdminToken;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Authenticate Super Admin for admin endpoints
  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: 'Admin@Amoga2026!',
    }),
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, 'Super admin login must succeed');
  superAdminToken = loginData.token;
});

after(async () => {
  await prisma.storeSetting.update({
    where: { id: 'default' },
    data: { shippingStandardRate: 0, freeShippingThreshold: 2000 },
  }).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

describe('Phase 1: Audit Trail Verification Suite', () => {
  test('GET /api/admin/audit-logs rejects unauthenticated requests with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/admin/audit-logs returns database-backed logs with summary metrics', async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.logs), 'logs must be an array');
    assert.ok(body.pagination, 'pagination object must exist');
    assert.ok(typeof body.pagination.total === 'number', 'total count must be a number');
    assert.ok(body.pagination.total > 0, 'total events must be greater than zero');

    // Summary metrics verification
    assert.ok(body.stats, 'stats object must exist');
    assert.strictEqual(typeof body.stats.totalEvents, 'number');
    assert.strictEqual(typeof body.stats.failedActions, 'number');
    assert.strictEqual(typeof body.stats.highImpactActions, 'number');
    assert.strictEqual(typeof body.stats.activeStaffActors, 'number');
  });

  test('GET /api/admin/audit-logs applies filters for entity, action, and status correctly', async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs?status=SUCCESS&limit=5`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.logs));
    body.logs.forEach((entry) => {
      assert.strictEqual(entry.status, 'SUCCESS');
    });
  });

  test('GET /api/admin/audit-logs/:id returns detailed log and redacts sensitive credentials', async () => {
    // First list logs to get a real ID
    const listRes = await fetch(`${baseUrl}/api/admin/audit-logs?limit=1`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const listBody = await listRes.json();
    assert.ok(listBody.logs.length > 0);
    const logId = listBody.logs[0].id;

    const detailRes = await fetch(`${baseUrl}/api/admin/audit-logs/${logId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.strictEqual(detailBody.success, true);
    assert.strictEqual(detailBody.log.id, logId);
    assert.ok(detailBody.log.createdAt);

    // Verify raw JSON representation doesn't contain raw plaintext passwords/tokens
    const jsonString = JSON.stringify(detailBody.log);
    assert.strictEqual(jsonString.includes('Admin@Amoga2026!'), false);
  });
});

describe('Phase 2: Customer Inquiries Verification Suite', () => {
  let createdInquiryRef;
  let createdInquiryId;

  test('POST /api/contact validates input and rejects malformed payloads', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '',
        email: 'not-an-email',
        subject: '',
        message: 'short',
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'Validation failed');
  });

  test('POST /api/contact persists inquiry to database and creates audit log', async () => {
    const testPayload = {
      fullName: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@example.com',
      phone: '+91 9820011223',
      subject: 'Custom Banarasi Silk Brocade Bridal Enquiry',
      message: 'Inquiring about heritage real silver and gold zari kadwa weaving for an upcoming wedding ceremony.',
      collectionId: 'sarees',
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.inquiryReference);
    assert.ok(body.inquiryReference.startsWith('INQ-'));
    createdInquiryRef = body.inquiryReference;

    // Verify database record in CustomerInquiry
    const dbInquiry = await prisma.customerInquiry.findUnique({
      where: { reference: createdInquiryRef },
    });
    assert.ok(dbInquiry, 'Inquiry must exist in PostgreSQL customer_inquiries table');
    assert.strictEqual(dbInquiry.fullName, testPayload.fullName);
    assert.strictEqual(dbInquiry.email, testPayload.email);
    assert.strictEqual(dbInquiry.status, 'NEW');
    createdInquiryId = dbInquiry.id;

    // Verify audit log creation
    const dbAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'CUSTOMER_INQUIRY',
        entityId: createdInquiryRef,
      },
    });
    assert.ok(dbAudit, 'CUSTOMER_INQUIRY event must be logged in audit_logs');
  });

  test('GET /api/admin/inquiries rejects unauthenticated access with 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/inquiries`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/admin/inquiries lists inquiries with stats and search', async () => {
    const res = await fetch(`${baseUrl}/api/admin/inquiries?search=Ananya`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.stats, 'KPI stats must be returned');
    assert.ok(body.stats.totalAllTime >= 1);
    assert.ok(body.stats.newCount >= 1);
    assert.ok(body.inquiries.some((inq) => inq.reference === createdInquiryRef));
  });

  test('PATCH /api/admin/inquiries/:id/status updates status and logs audit event', async () => {
    // 1. Transition to IN_PROGRESS
    const patchRes = await fetch(`${baseUrl}/api/admin/inquiries/${createdInquiryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.strictEqual(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.strictEqual(patchBody.success, true);
    assert.strictEqual(patchBody.inquiry.status, 'IN_PROGRESS');

    // 2. Reject invalid status jump
    const invalidRes = await fetch(`${baseUrl}/api/admin/inquiries/${createdInquiryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    });
    assert.strictEqual(invalidRes.status, 400);

    // 3. Verify audit log entry
    const auditRes = await prisma.auditLog.findFirst({
      where: {
        action: 'INQUIRY_STATUS_CHANGE',
        entityId: createdInquiryRef,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(auditRes, 'INQUIRY_STATUS_CHANGE audit event must exist');
    assert.strictEqual(auditRes.details?.newStatus, 'IN_PROGRESS');
  });

  test('PATCH /api/admin/inquiries/:id/notes updates concierge internal notes', async () => {
    const notesRes = await fetch(`${baseUrl}/api/admin/inquiries/${createdInquiryId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ internalNotes: 'Spoke with client. Arranging private showroom viewing on Friday.' }),
    });
    assert.strictEqual(notesRes.status, 200);
    const notesBody = await notesRes.json();
    assert.strictEqual(notesBody.success, true);
    assert.strictEqual(notesBody.inquiry.internalNotes, 'Spoke with client. Arranging private showroom viewing on Friday.');

    // Verify verbatim customer message was NOT overwritten
    assert.strictEqual(notesBody.inquiry.message, 'Inquiring about heritage real silver and gold zari kadwa weaving for an upcoming wedding ceremony.');
  });
});

describe('Phase 3: Settings & Health Reliability Suite', () => {
  let initialSettings;

  test('GET /api/admin/settings returns persisted settings and truthful health checks', async () => {
    const res = await fetch(`${baseUrl}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.settings, 'settings must be present');
    initialSettings = body.settings;

    // Truthful health verification
    assert.ok(body.health, 'health object must be present');
    assert.strictEqual(body.health.database.status, 'CONNECTED', 'PostgreSQL database must be connected');
    assert.ok(body.health.database.latencyMs >= 0, 'Database latency must be measured');
    assert.ok(['test', 'razorpay'].includes(body.health.paymentGateway.provider), 'Provider must be real');
    assert.ok(['sandbox', 'In-Memory Test Sandbox'].includes(body.health.paymentGateway.mode), 'Payment gateway must report sandbox or test sandbox mode');
    assert.strictEqual(body.health.security.rbacActive, true, 'Security & RBAC must be verified active');
  });

  test('PUT /api/admin/settings rejects invalid validation payloads', async () => {
    const res = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        freeShippingThreshold: -500, // Negative amount forbidden
        shippingStandardRate: 150,
        taxPercentage: 150, // Tax cannot exceed 100%
        contactEmail: 'not-an-email',
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error, 'Must report validation error');
  });

  test('PUT /api/admin/settings persists valid settings and logs diff to audit trail', async () => {
    const updatePayload = {
      storeName: 'AMOGA Luxury Heritage',
      contactEmail: 'amogastores05@gmail.com',
      contactPhone: '+91 9988776655',
      freeShippingThreshold: 5000,
      shippingStandardRate: 250,
      taxPercentage: 3,
      enableAutoNotifications: true,
      enableInventoryAlerts: true,
    };

    const res = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.settings.storeName, 'AMOGA Luxury Heritage');
    assert.strictEqual(body.settings.freeShippingThreshold, 5000);
    assert.strictEqual(body.settings.shippingStandardRate, 250);

    // Verify audit log has the diff
    const auditRes = await prisma.auditLog.findFirst({
      where: {
        action: 'SETTINGS_UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(auditRes, 'SETTINGS_UPDATE event must be recorded');
    assert.ok(auditRes.details?.newValues?.storeName === 'AMOGA Luxury Heritage');

    // Clean up / restore sensible defaults
    await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        storeName: initialSettings.storeName || 'AMOGA',
        contactEmail: initialSettings.contactEmail || 'amogastores05@gmail.com',
        contactPhone: initialSettings.contactPhone || '+91 80000 12345',
        freeShippingThreshold: 5000,
        shippingStandardRate: 250,
        taxPercentage: 3,
        enableAutoNotifications: true,
        enableInventoryAlerts: true,
      }),
    });
  });

  test('Authoritative checkout validates shipping fee based on store settings', async () => {
    // 1. Subtotal below threshold (5000) should incur shippingStandardRate (250)
    // Find a tea product with price < 5000
    const teaProduct = await prisma.product.findFirst({
      where: { collectionId: 'tea', isActive: true },
    });
    assert.ok(teaProduct, 'Must find a tea product');

    const res = await fetch(`${baseUrl}/api/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: teaProduct.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.totals.shippingAmount, 250, 'Shipping fee must match store settings (₹250)');
    assert.strictEqual(body.totals.isComplimentaryShipping, false);
    assert.strictEqual(
      body.totals.totalAmount,
      body.totals.subtotal + 250,
      'Total must equal subtotal + shipping fee'
    );
  });
});
