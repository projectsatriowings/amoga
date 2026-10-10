import { describe, test, before, after } from 'node:test';
import assert from 'assert';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;

  await prisma.product.deleteMany({
    where: {
      slug: { contains: '-test-' },
    },
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.product.deleteMany({
    where: {
      slug: { contains: '-test-' },
    },
  });
  await prisma.$disconnect();
});

describe('Tea Category & 4-Collection Checkout End-to-End Suite', () => {
  let catalogueToken;
  let createdTestTeaId;

  // 1. Auth setup for management API
  test('Login Catalogue Manager to obtain token for catalogue operations', async () => {
    const res = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'catalogue@amoga.com',
        password: 'Catalogue@Amoga2026!',
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    catalogueToken = body.token;
  });

  // 2. Tea Product Retrieval & Visibility
  test('GET /api/products?collection=tea retrieves all 5 active Tea products', async () => {
    const res = await fetch(`${baseUrl}/products?collection=tea`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 5, `Expected at least 5 tea products, got ${body.data.length}`);

    // Verify all 5 have collection: 'tea'
    body.data.forEach((tea) => {
      assert.strictEqual(tea.collection, 'tea');
      assert.ok(tea.price > 0, `Tea ${tea.name} must have a valid price > 0`);
      assert.strictEqual(tea.inStock, true);
    });
  });

  test('GET /api/products/tea/butterfly-blue-pea-tea resolves with verified test price ₹199', async () => {
    const res = await fetch(`${baseUrl}/products/tea/butterfly-blue-pea-tea`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.slug, 'butterfly-blue-pea-tea');
    assert.strictEqual(body.data.price, 199);
    assert.strictEqual(body.data.collection, 'tea');
  });

  test('GET /api/products/tea/hibiscus-tea resolves with verified test price ₹249', async () => {
    const res = await fetch(`${baseUrl}/products/tea/hibiscus-tea`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.slug, 'hibiscus-tea');
    assert.strictEqual(body.data.price, 249);
    assert.strictEqual(body.data.collection, 'tea');
  });

  // 3. Tea Product Creation & Editing via Catalogue Management API
  test('Catalogue Manager creates new Tea product through admin API', async () => {
    const testSlug = `tulsi-ginger-tea-test-${Date.now().toString(36)}`;
    const res = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        name: 'Tulsi Ginger Botanical Tea Test',
        slug: testSlug,
        collectionId: 'tea',
        description: 'Single-estate holy basil blended with sun-dried Himalayan ginger root.',
        category: 'Herbal Root Infusions',
        categoryName: 'Botanical Infusions',
        price: 239,
        packSize: '100 g',
        stockQuantity: 40,
        inStock: true,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.product.collectionId, 'tea');
    createdTestTeaId = body.product.id;
  });

  test('Catalogue Manager edits created Tea product price and details', async () => {
    assert.ok(createdTestTeaId);
    const res = await fetch(`${baseUrl}/admin/products/${createdTestTeaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        price: 249,
        description: 'Updated botanical formulation with double sun-cured ginger flakes.',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(Number(body.product.price), 249);

    // Clean up test product by archiving
    await fetch(`${baseUrl}/admin/products/${createdTestTeaId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
  });

  // 4. Authoritative Authoritative Checkout Pricing Across All 4 Categories
  test('POST /api/checkout/validate verifies authoritative integer paise for all 4 categories', async () => {
    const res = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: 'f-turmeric-01', quantity: 2 },            // Food: 249 * 2 = 498
          { productId: 'tea-01', quantity: 1 },                   // Tea: 199 * 1 = 199
          { productId: 'tea-05', quantity: 2 },                   // Tea: 249 * 2 = 498
          { productId: 's-kanchipuram-01', quantity: 1 },         // Sarees: 18500 * 1 = 18500
          { productId: 'j-aurora-01', quantity: 1 },              // Jewellery: 2499 * 1 = 2499
        ],
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.canCheckout, true);
    assert.strictEqual(body.totals.payableCount, 7); // 2 + 1 + 2 + 1 + 1

    const expectedSubtotal = 498 + 199 + 498 + 18500 + 2499; // 22194
    assert.strictEqual(body.totals.subtotal, expectedSubtotal);

    // Verify lines contain all 4 collections
    const collectionsPresent = new Set(body.lines.map((l) => l.collectionId));
    assert.ok(collectionsPresent.has('food'), 'Must contain food collection');
    assert.ok(collectionsPresent.has('tea'), 'Must contain tea collection');
    assert.ok(collectionsPresent.has('sarees'), 'Must contain sarees collection');
    assert.ok(collectionsPresent.has('jewellery'), 'Must contain jewellery collection');
  });

  // 5. Order Creation with Tea Item & Guest Access
  let createdOrderRef;
  let guestAccessToken;

  test('POST /api/orders creates persistent order including Tea item', async () => {
    const idempotencyKey = `idemp-test-tea-${Date.now()}`;
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: 'tea-01', quantity: 2 }, // Butterfly Blue Pea: 199 * 2 = 398
          { productId: 'tea-03', quantity: 1 }, // Cinnamon Tea: 219 * 1 = 219
        ],
        customer: {
          fullName: 'Arundhati Roy',
          email: 'arundhati@example.com',
          phone: '9840198401',
          addressLine1: 'No 45, Greenways Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600028',
          instructions: 'Call before delivery',
        },
        idempotencyKey,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.orderReference.startsWith('AMOGA-ORD-'));
    assert.ok(body.guestAccessToken);
    assert.strictEqual(body.totals.subtotal, 398 + 219); // 617

    createdOrderRef = body.orderReference;
    guestAccessToken = body.guestAccessToken;

    // Verify tea collection reference in line items
    const hasTeaItems = body.items.some((i) => i.collectionId === 'tea');
    assert.strictEqual(hasTeaItems, true);
  });

  // 6. Payment Flow, Test Verification, and Order Confirmation
  test('Complete payment verification transitions Tea order to CONFIRMED and SUCCEEDED', async () => {
    assert.ok(createdOrderRef);
    assert.ok(guestAccessToken);

    // 1. Create payment order
    const payRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestAccessToken,
      },
      body: JSON.stringify({
        orderReference: createdOrderRef,
        idempotencyKey: `pay-${createdOrderRef}`,
      }),
    });
    assert.strictEqual(payRes.status, 201);
    const payBody = await payRes.json();
    assert.strictEqual(payBody.success, true);
    const paymentRef = payBody.data.paymentReference;

    // 2. Obtain signed test simulation parameters
    const simRes = await fetch(`${baseUrl}/payments/test-simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestAccessToken,
      },
      body: JSON.stringify({
        orderReference: createdOrderRef,
        paymentReference: paymentRef,
        outcome: 'success',
      }),
    });
    assert.strictEqual(simRes.status, 200);
    const simBody = await simRes.json();

    // 3. Verify payment signature on server
    const verifyRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestAccessToken,
      },
      body: JSON.stringify({
        orderReference: createdOrderRef,
        paymentReference: paymentRef,
        providerOrderId: simBody.providerOrderId,
        providerPaymentId: simBody.providerPaymentId,
        providerSignature: simBody.providerSignature,
      }),
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.strictEqual(verifyBody.success, true);
    assert.strictEqual(verifyBody.data.verified, true);
    assert.strictEqual(verifyBody.data.status, 'SUCCEEDED');

    // 4. Test order retrieval (as simulated by page refresh)
    const getOrderRes = await fetch(`${baseUrl}/orders/${createdOrderRef}`, {
      headers: {
        'x-guest-access-token': guestAccessToken,
      },
    });
    assert.strictEqual(getOrderRes.status, 200);
    const orderResponse = await getOrderRes.json();
    assert.strictEqual(orderResponse.success, true);
    const orderData = orderResponse.data;
    assert.strictEqual(orderData.status, 'CONFIRMED');
    assert.strictEqual(orderData.paymentStatus, 'SUCCEEDED');
    assert.strictEqual(orderData.customer.fullName, 'Arundhati Roy');
    assert.strictEqual(orderData.items.length, 2);
  });
});
