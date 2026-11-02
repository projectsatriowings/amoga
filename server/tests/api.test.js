import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { verifyGuestAccessToken, hashGuestAccessToken } from '../src/utils/security.js';
import http from 'node:http';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    // Listen on ephemeral port for tests
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

describe('1. Health and Collections API', () => {
  test('GET /api/health returns ok status and connected database', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.database, 'connected');
  });

  test('GET /api/collections returns all 4 Amoga collections in canonical order', async () => {
    const res = await fetch(`${baseUrl}/collections`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 4);
    const slugs = body.data.map((c) => c.slug);
    assert.strictEqual(slugs[0], 'tea');
    assert.strictEqual(slugs[1], 'sarees');
    assert.strictEqual(slugs[2], 'jewellery');
    assert.strictEqual(slugs[3], 'food');
  });
});

describe('2. Products Catalogue API', () => {
  test('GET /api/products returns paginated products across collections', async () => {
    const res = await fetch(`${baseUrl}/products?limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 10);
    assert.ok(body.meta.total >= 85);
  });

  test('GET /api/products filters by collection jewellery', async () => {
    const res = await fetch(`${baseUrl}/products?collection=jewellery`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 9);
    body.data.forEach((p) => assert.strictEqual(p.collection, 'jewellery'));
  });

  test('GET /api/products filters by collection tea and returns 5 tea products', async () => {
    const res = await fetch(`${baseUrl}/products?collection=tea`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 5);
    body.data.forEach((p) => assert.strictEqual(p.collection, 'tea'));
    const teaSlugs = body.data.map((p) => p.slug);
    assert.ok(teaSlugs.includes('hibiscus-tea'));
    assert.ok(teaSlugs.includes('butterfly-blue-pea-tea'));
    assert.ok(teaSlugs.includes('sarsaparilla-tea'));
    assert.ok(teaSlugs.includes('cinnamon-tea'));
    assert.ok(teaSlugs.includes('moringa-leaf-tea'));
  });

  test('GET /api/products filters by collection food and excludes tea products', async () => {
    const res = await fetch(`${baseUrl}/products?collection=food&limit=100`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 61);
    body.data.forEach((p) => {
      assert.strictEqual(p.collection, 'food');
      assert.notStrictEqual(p.category, 'teas');
    });
  });

  test('GET /api/products/:collection/:slug resolves valid product with variants', async () => {
    const res = await fetch(`${baseUrl}/products/sarees/kanchipuram-pure-silk`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.name, 'Kanchipuram Silk');
    assert.strictEqual(body.data.price, 18500);
    assert.ok(body.data.variants.length >= 3);
  });

  test('GET /api/products/:collection/:slug returns 404 for unknown product', async () => {
    const res = await fetch(`${baseUrl}/products/food/non-existent-soup-slug`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });
});

describe('3. Authoritative Checkout Validation API & Financial Precision', () => {
  test('POST /api/checkout/validate rejects empty cart', async () => {
    const res = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('POST /api/checkout/validate rejects unpriced items with 422', async () => {
    const unpricedProd = await prisma.product.upsert({
      where: { sourceId: 'test-unpriced-01' },
      update: { price: null },
      create: {
        sourceId: 'test-unpriced-01',
        slug: 'test-unpriced-product',
        name: 'Test Unpriced Catalogue Item',
        description: 'Test unpriced catalogue product for safeguard verification',
        collectionId: 'food',
        category: 'podis',
        image: '/assets/images/food-soups-hero.jpg',
        price: null,
        inStock: true,
        isActive: true,
      },
    });

    try {
      const res = await fetch(`${baseUrl}/checkout/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: unpricedProd.id, quantity: 1 }],
        }),
      });
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.strictEqual(body.canCheckout, false);
      assert.ok(body.errors.some((e) => e.includes('pending client approval')));
    } finally {
      await prisma.product.deleteMany({ where: { sourceId: 'test-unpriced-01' } });
    }
  });

  test('POST /api/checkout/validate calculates authoritative totals across collections with integer paise', async () => {
    const res = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: 'f-turmeric-01', quantity: 2 }, // 249 * 2 = 498
          { productId: 'j-aurora-01', quantity: 1 },    // 2499 * 1 = 2499
        ],
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.canCheckout, true);
    assert.strictEqual(body.totals.subtotal, 498 + 2499);
    assert.strictEqual(body.totals.payableCount, 3);
    assert.strictEqual(body.totals.totalAmount, body.totals.subtotal + (body.totals.shippingAmount || 0));
  });

  test('POST /api/checkout/validate rejects invalid quantities', async () => {
    const res = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: -2 }],
      }),
    });
    assert.strictEqual(res.status, 400);
  });
});

describe('4. Persistent Order Creation & Retrieval API with Hardened Security', () => {
  test('POST /api/orders creates persistent order and returns guest access token', async () => {
    const payload = {
      items: [
        { productId: 'f-turmeric-01', quantity: 1 },
        { productId: 's-kanchipuram-01', variantId: 'v-wine', quantity: 1 },
      ],
      customer: {
        fullName: 'Devika Krishnan',
        email: 'devika.krishnan@example.com',
        phone: '9845098765',
        addressLine1: '32 Temple View Avenue, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      idempotencyKey: 'test-order-key-' + Date.now(),
    };

    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.orderReference.startsWith('AMOGA-ORD-'));
    assert.ok(body.guestAccessToken);
    assert.strictEqual(body.customer.fullName, 'Devika Krishnan');
    assert.strictEqual(body.items.length, 2);
    assert.strictEqual(body.totals.totalAmount, 249 + 18500);

    // Security check 1: Reject request with no token header (HTTP 401)
    const unauthRes = await fetch(`${baseUrl}/orders/${body.orderReference}`);
    assert.strictEqual(unauthRes.status, 401);

    // Security check 2: Reject request attempting to leak token in query param (HTTP 401)
    const queryLeakRes = await fetch(`${baseUrl}/orders/${body.orderReference}?token=${body.guestAccessToken}`);
    assert.strictEqual(queryLeakRes.status, 401, 'Query param tokens must be rejected');

    // Security check 3: Reject request with forged / invalid token (HTTP 403)
    const invalidTokenRes = await fetch(`${baseUrl}/orders/${body.orderReference}`, {
      headers: { 'x-guest-access-token': 'wrong-forged-token-12345' },
    });
    assert.strictEqual(invalidTokenRes.status, 403);

    // Security check 4: Authorized guest order retrieval (with valid header token) -> HTTP 200
    const authRes = await fetch(`${baseUrl}/orders/${body.orderReference}`, {
      headers: { 'x-guest-access-token': body.guestAccessToken },
    });
    assert.strictEqual(authRes.status, 200);
    const authBody = await authRes.json();
    assert.strictEqual(authBody.data.orderReference, body.orderReference);
    assert.strictEqual(authBody.data.customer.fullName, 'Devika Krishnan');
    assert.strictEqual(authBody.data.items.length, 2);
  });

  test('POST /api/orders enforces idempotency without duplicating records', async () => {
    const key = 'test-idemp-duplicate-check-' + Date.now();
    const payload = {
      items: [{ productId: 'f-turmeric-01', quantity: 1 }],
      customer: {
        fullName: 'Sameer Rao',
        email: 'sameer.rao@example.com',
        phone: '9876543210',
        addressLine1: '12 MG Road',
        city: 'Mysuru',
        state: 'Karnataka',
        pincode: '570001',
      },
      idempotencyKey: key,
    };

    const firstRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(firstRes.status, 201);
    const firstBody = await firstRes.json();

    // Repeated identical submission returns HTTP 200 with isDuplicate: true
    const secondRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(secondRes.status, 200);
    const secondBody = await secondRes.json();
    assert.strictEqual(secondBody.isDuplicate, true);
    assert.strictEqual(secondBody.orderReference, firstBody.orderReference);
  });

  test('POST /api/orders rejects reusing an idempotency key with a DIFFERENT payload (HTTP 409 Conflict)', async () => {
    const key = 'test-idemp-conflict-check-' + Date.now();
    const originalPayload = {
      items: [{ productId: 'f-turmeric-01', quantity: 1 }],
      customer: {
        fullName: 'Kavita Menon',
        email: 'kavita.menon@example.com',
        phone: '9845011223',
        addressLine1: '14 Palace Cross Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560020',
      },
      idempotencyKey: key,
    };

    const firstRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(originalPayload),
    });
    assert.strictEqual(firstRes.status, 201);

    // Reusing the same key with DIFFERENT items/quantity must return HTTP 409 Conflict
    const conflictingPayload = {
      items: [{ productId: 'j-aurora-01', quantity: 1 }], // Different product!
      customer: {
        fullName: 'Kavita Menon',
        email: 'kavita.menon@example.com',
        phone: '9845011223',
        addressLine1: '14 Palace Cross Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560020',
      },
      idempotencyKey: key,
    };

    const conflictRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conflictingPayload),
    });
    assert.strictEqual(conflictRes.status, 409, 'Must reject conflicting payload with 409');
    const conflictBody = await conflictRes.json();
    assert.ok(conflictBody.error.includes('different order'));
  });
});

describe('5. Cryptographic Security Unit Tests', () => {
  test('verifyGuestAccessToken handles timing-safe verification and mismatched lengths safely', () => {
    const validToken = 'abcdef1234567890abcdef1234567890';
    const storedHash = hashGuestAccessToken(validToken);

    // Matching token returns true
    assert.strictEqual(verifyGuestAccessToken(validToken, storedHash), true);

    // Different token of same length returns false
    const wrongToken = '123456abcdef7890123456abcdef7890';
    assert.strictEqual(verifyGuestAccessToken(wrongToken, storedHash), false);

    // Different length token does not throw and returns false
    assert.strictEqual(verifyGuestAccessToken('short', storedHash), false);
    assert.strictEqual(verifyGuestAccessToken(null, storedHash), false);
    assert.strictEqual(verifyGuestAccessToken('', storedHash), false);
  });
});
