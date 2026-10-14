import { describe, it, before, after } from 'node:test';
import assert from 'assert';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import * as inventoryService from '../src/services/inventoryService.js';
import * as notificationService from '../src/services/notificationService.js';

let server;
let baseUrl;
let adminToken;

const TEST_RUN_ID = Date.now().toString(36);
const TEST_SLUG_PREFIX = `inv-test-${TEST_RUN_ID}`;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;

  // Log in as Super Admin
  const authRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: 'Admin@Amoga2026!',
    }),
  });
  assert.strictEqual(authRes.status, 200);
  const authBody = await authRes.json();
  adminToken = authBody.token;
  assert.ok(adminToken, 'Admin token should be present');

  // 1. Single standalone product
  singleProduct = await prisma.product.create({
    data: {
      sourceId: `${TEST_SLUG_PREFIX}-single`,
      name: `Inv Test Tea ${TEST_RUN_ID}`,
      slug: `${TEST_SLUG_PREFIX}-single`,
      collectionId: 'tea',
      category: 'tea',
      description: 'Single-origin test botanical tea blend',
      image: '/images/tea/chamomile.jpg',
      price: 500.00,
      stockQuantity: 5,
      reservedQuantity: 0,
      lowStockThreshold: 3,
      inStock: true,
    },
  });

  // 2. Multi-variant product (Saree with 2 independent color variants)
  variantProduct = await prisma.product.create({
    data: {
      sourceId: `${TEST_SLUG_PREFIX}-saree`,
      name: `Inv Test Saree ${TEST_RUN_ID}`,
      slug: `${TEST_SLUG_PREFIX}-saree`,
      collectionId: 'sarees',
      category: 'sarees',
      description: 'Heritage handloom silk saree test product',
      image: '/images/sarees/kanchipuram.jpg',
      price: 2500.00,
      stockQuantity: 10,
      reservedQuantity: 0,
      lowStockThreshold: 2,
      inStock: true,
      variants: {
        create: [
          {
            sku: `${TEST_SLUG_PREFIX}-crimson`,
            name: 'Royal Crimson',
            price: 2500.00,
            stockQuantity: 1, // Only 1 in stock for concurrency test
            reservedQuantity: 0,
            lowStockThreshold: 2,
            inStock: true,
          },
          {
            sku: `${TEST_SLUG_PREFIX}-emerald`,
            name: 'Deep Emerald',
            price: 2500.00,
            stockQuantity: 0, // Out of stock for subscription test
            reservedQuantity: 0,
            lowStockThreshold: 2,
            inStock: false,
          },
        ],
      },
    },
    include: { variants: true },
  });

  variantA = variantProduct.variants.find((v) => v.sku.includes('crimson'));
  variantB = variantProduct.variants.find((v) => v.sku.includes('emerald'));
});

let singleProduct;
let variantProduct;
let variantA;
let variantB;

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  // Clean up any test records created during this suite
  try {
    const testProducts = await prisma.product.findMany({
      where: { slug: { startsWith: 'inv-test-' } },
      select: { id: true },
    });
    const ids = testProducts.map((p) => p.id);
    if (ids.length > 0) {
      await prisma.restockNotificationJob.deleteMany({ where: { productId: { in: ids } } });
      await prisma.restockSubscription.deleteMany({ where: { productId: { in: ids } } });
      await prisma.inventoryAlert.deleteMany({ where: { productId: { in: ids } } });
      await prisma.inventoryReservation.deleteMany({ where: { productId: { in: ids } } });
      await prisma.inventoryLog.deleteMany({ where: { productId: { in: ids } } });
      await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
  } catch (err) {
    console.warn('Cleanup error:', err.message);
  }
  await prisma.$disconnect();
});

describe('Phase 9 — Production-Ready Inventory, Concurrency & Restock Suite', { concurrency: 1 }, () => {
  it('1. Verifies setup of standalone SKU and multi-variant SKUs', async () => {
    assert.ok(singleProduct.id);
    assert.ok(variantA.id);
    assert.ok(variantB.id);
  });

  it('2. Evaluates stock derivations accurately (In Stock, Low Stock, Out of Stock)', async () => {
    // Single product: 5 on-hand, 0 reserved => available 5 (In Stock)
    const availSingle = await inventoryService.getAvailability(singleProduct.id);
    assert.strictEqual(availSingle.availableQuantity, 5);
    assert.strictEqual(availSingle.isOutOfStock, false);
    assert.strictEqual(availSingle.isLowStock, false);

    // Variant A: 1 on-hand, 0 reserved, threshold 2 => available 1 (Low Stock)
    const availVarA = await inventoryService.getAvailability(variantProduct.id, variantA.id);
    assert.strictEqual(availVarA.availableQuantity, 1);
    assert.strictEqual(availVarA.isOutOfStock, false);
    assert.strictEqual(availVarA.isLowStock, true);

    // Variant B: 0 on-hand => Out of Stock
    const availVarB = await inventoryService.getAvailability(variantProduct.id, variantB.id);
    assert.strictEqual(availVarB.availableQuantity, 0);
    assert.strictEqual(availVarB.isOutOfStock, true);
  });

  it('3. Rejects checkout if requested quantity exceeds available stock', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Test Customer',
          email: 'customer@amoga.com',
          phone: '9876543210',
          addressLine1: '123 Amoga St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        },
        items: [
          {
            id: singleProduct.id,
            productId: singleProduct.id,
            name: singleProduct.name,
            quantity: 10, // Requesting 10 when only 5 exist
            price: 500,
          },
        ],
        idempotencyKey: `idemp-overflow-${TEST_RUN_ID}`,
      }),
    });

    assert.ok([409, 422].includes(res.status), 'Must return 409 or 422 for insufficient stock');
    const json = await res.json();
    const errText = JSON.stringify(json);
    assert.ok(errText.includes('5') || errText.includes('insufficient') || errText.includes('available'));
  });

  it('4. Concurrency safety: two competing orders race for the last single unit', async () => {
    // Variant A has exactly 1 unit in stock.
    // We launch two concurrent requests to purchase 1 unit of Variant A.
    const createReq = (clientNum) =>
      fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: `Racer ${clientNum}`,
            email: `racer${clientNum}@amoga.com`,
            phone: '9876543210',
            addressLine1: 'Race Track 1',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
          },
          items: [
            {
              id: `${variantProduct.id}-${variantA.id}`,
              productId: variantProduct.id,
              variantId: variantA.id,
              name: `${variantProduct.name} - ${variantA.name}`,
              quantity: 1,
              price: 2500,
            },
          ],
          idempotencyKey: `idemp-race-${clientNum}-${TEST_RUN_ID}`,
        }),
      });

    const [res1, res2] = await Promise.all([createReq(1), createReq(2)]);
    const statuses = [res1.status, res2.status];

    // Exactly one must succeed (201 or 200) and one must be rejected (409 or 422)
    assert.ok(statuses.includes(201) || statuses.includes(200), 'One request must succeed');
    assert.ok(statuses.includes(409) || statuses.includes(422), 'Competing request must be rejected');

    // Verify Variant A now has 0 available units (1 on hand, 1 reserved)
    const availAfterRace = await inventoryService.getAvailability(variantProduct.id, variantA.id);
    assert.strictEqual(availAfterRace.availableQuantity, 0);
    assert.strictEqual(availAfterRace.reservedQuantity, 1);
  });

  it('5. Safe release: releasing an expired or cancelled reservation restores availability', async () => {
    // Find the reservation created during the race
    const activeRes = await prisma.inventoryReservation.findFirst({
      where: { variantId: variantA.id, status: 'ACTIVE' },
    });
    assert.ok(activeRes, 'Active reservation should exist');

    // Simulate reservation release (e.g. customer cancels or payment fails)
    await inventoryService.releaseReservation(activeRes.id, 'Test safety release');

    // Availability must be restored to 1
    const restoredAvail = await inventoryService.getAvailability(variantProduct.id, variantA.id);
    assert.strictEqual(restoredAvail.availableQuantity, 1);
    assert.strictEqual(restoredAvail.reservedQuantity, 0);
  });

  it('6. Reservation commit on payment success: decrements on-hand stock exactly once', async () => {
    // 1. Create order for 2 units of singleProduct
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Paying Customer',
          email: 'paying@amoga.com',
          phone: '9876543210',
          addressLine1: 'Payment St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        },
        items: [
          {
            id: singleProduct.id,
            productId: singleProduct.id,
            name: singleProduct.name,
            quantity: 2,
            price: 500,
          },
        ],
        idempotencyKey: `idemp-payment-commit-${TEST_RUN_ID}`,
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    const orderJson = await orderRes.json();
    const orderRef = orderJson.orderReference;

    const orderRecord = await prisma.order.findUnique({
      where: { orderReference: orderRef },
    });
    assert.ok(orderRecord, 'Order record must exist in DB');

    // Verify stock before payment: on-hand = 5, reserved = 2, available = 3
    const beforePayment = await inventoryService.getAvailability(singleProduct.id);
    assert.strictEqual(beforePayment.onHandQuantity, 5);
    assert.strictEqual(beforePayment.reservedQuantity, 2);
    assert.strictEqual(beforePayment.availableQuantity, 3);

    // 2. Commit payment via inventoryService (same call made during payment verification)
    await inventoryService.commitReservation(orderRecord.id, orderRef);

    // Verify stock after payment: on-hand = 3, reserved = 0, available = 3
    const afterPayment = await inventoryService.getAvailability(singleProduct.id);
    assert.strictEqual(afterPayment.onHandQuantity, 3);
    assert.strictEqual(afterPayment.reservedQuantity, 0);
    assert.strictEqual(afterPayment.availableQuantity, 3);

    // 3. Webhook retry idempotency: committing again should be a no-op (does not double-deduct)
    await inventoryService.commitReservation(orderRecord.id, orderRef);
    const afterRetry = await inventoryService.getAvailability(singleProduct.id);
    assert.strictEqual(afterRetry.onHandQuantity, 3, 'Must not double-deduct on repeated commit');
  });

  it('7. Admin stock adjustment records movement history and actor details', async () => {
    const adjustRes = await fetch(`${baseUrl}/admin/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        productId: singleProduct.id,
        newStock: 8,
        reason: 'Restocked from artisan workshop for audit test',
      }),
    });

    assert.strictEqual(adjustRes.status, 200);
    const adjustJson = await adjustRes.json();
    assert.strictEqual(adjustJson.success, true);

    // Check inventory movement log
    const movements = await prisma.inventoryLog.findMany({
      where: { productId: singleProduct.id },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(movements.length > 0);
    const latest = movements[0];
    assert.strictEqual(latest.adjustedStock, 8);
    assert.strictEqual(latest.reason, 'Restocked from artisan workshop for audit test');
    assert.strictEqual(latest.adminEmail, 'admin@amoga.com');
  });

  it('8. Threshold alert deduplication: triggers alert once per threshold episode', async () => {
    // Lower stock to 2 (below singleProduct.lowStockThreshold of 3)
    await inventoryService.adjustStock(
      singleProduct.id,
      null,
      2,
      'Threshold test drop',
      'admin@amoga.com'
    );

    // First check should trigger an alert
    const alert1 = await notificationService.checkAndTriggerThresholdAlert(
      singleProduct.id,
      null,
      2
    );
    assert.ok(alert1, 'First crossing should generate an alert');

    // Second check at the same or similar low-stock level during the same episode must NOT duplicate
    const alert2 = await notificationService.checkAndTriggerThresholdAlert(
      singleProduct.id,
      null,
      2
    );
    assert.ok(alert2, 'Threshold check returns evaluation result');
    assert.strictEqual(alert2.deduplicated, true, 'Must deduplicate repeated alerts within the same episode');
    assert.strictEqual(alert2.alertTriggered, false, 'Must not trigger duplicate alert');
  });

  it('9. Customer restock subscription: validates, stores consent, and prevents duplicates', async () => {
    // Variant B is out of stock. Customer subscribes with email.
    const subRes1 = await fetch(`${baseUrl}/products/restock-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: variantProduct.id,
        variantId: variantB.id,
        channel: 'EMAIL',
        destination: 'Interested.Buyer@Amoga.com',
      }),
    });

    assert.strictEqual(subRes1.status, 201);
    const subJson1 = await subRes1.json();
    assert.strictEqual(subJson1.success, true);
    assert.strictEqual(subJson1.subscription.status, 'ACTIVE');

    // Duplicate submission for same destination and product: must return existing active subscription
    const subRes2 = await fetch(`${baseUrl}/products/restock-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: variantProduct.id,
        variantId: variantB.id,
        channel: 'EMAIL',
        destination: 'interested.buyer@amoga.com', // normalized case
      }),
    });

    assert.strictEqual(subRes2.status, 200);
    const subJson2 = await subRes2.json();
    assert.strictEqual(subJson2.subscription.id, subJson1.subscription.id, 'Must return same subscription');
    assert.strictEqual(subJson2.alreadySubscribed, true);
  });

  it('10. Restock notification workflow: restock triggers notification job without claiming delivery if provider unconfigured', async () => {
    // Admin restocks Variant B from 0 to 5 units
    const restockRes = await fetch(`${baseUrl}/admin/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        productId: variantProduct.id,
        variantId: variantB.id,
        newStock: 5,
        reason: 'Restocked Variant B fresh batch',
      }),
    });

    assert.strictEqual(restockRes.status, 200);

    // Poll for async notification job creation and processing completion
    let job = null;
    for (let i = 0; i < 30; i++) {
      const jobs = await prisma.restockNotificationJob.findMany({
        where: {
          productId: variantProduct.id,
          variantId: variantB.id,
        },
      });
      if (jobs.length > 0 && jobs[0].status !== 'PENDING') {
        job = jobs[0];
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    assert.ok(job, 'Notification job should be queued and processed for active subscriber');

    // Verify: If no email provider is configured, the system marks NO_PROVIDER_CONFIGURED
    // instead of falsely claiming delivery succeeded!
    if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
      assert.strictEqual(
        job.status,
        'NO_PROVIDER_CONFIGURED',
        'Must accurately report unconfigured provider rather than fake success'
      );
    } else {
      assert.ok(['SENT', 'FAILED', 'PENDING', 'NO_PROVIDER_CONFIGURED'].includes(job.status));
    }
  });

  it('11. Customer can cancel restock subscription (honoring opt-outs)', async () => {
    // 1. Create a dedicated active restock subscription
    const subRes = await fetch(`${baseUrl}/products/restock-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: variantProduct.id,
        variantId: variantA.id,
        channel: 'EMAIL',
        destination: 'optout.tester@amoga.com',
      }),
    });
    assert.strictEqual(subRes.status, 201);
    const subJson = await subRes.json();
    assert.strictEqual(subJson.success, true);
    assert.strictEqual(subJson.subscription.status, 'ACTIVE');

    // 2. Unsubscribe customer
    const unsubRes = await fetch(`${baseUrl}/products/restock-unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: variantProduct.id,
        variantId: variantA.id,
        destination: 'optout.tester@amoga.com',
      }),
    });

    assert.strictEqual(unsubRes.status, 200);
    const unsubJson = await unsubRes.json();
    assert.strictEqual(unsubJson.success, true);

    // 3. Verify status transitioned to CANCELLED
    const cancelledSub = await prisma.restockSubscription.findFirst({
      where: {
        productId: variantProduct.id,
        variantId: variantA.id,
        destination: 'optout.tester@amoga.com',
      },
    });
    assert.strictEqual(cancelledSub.status, 'CANCELLED');
    assert.ok(cancelledSub.cancelledAt);
  });

  it('12. Admin threshold configuration endpoint updates database threshold', async () => {
    const threshRes = await fetch(`${baseUrl}/admin/inventory/threshold`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        productId: singleProduct.id,
        lowStockThreshold: 12,
      }),
    });

    assert.strictEqual(threshRes.status, 200);
    const updatedProd = await prisma.product.findUnique({
      where: { id: singleProduct.id },
      select: { lowStockThreshold: true },
    });
    assert.strictEqual(updatedProd.lowStockThreshold, 12);
  });
});
