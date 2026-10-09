import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { getPaymentProvider } from '../src/payments/paymentService.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('1. Payment Order Creation API', () => {
  let createdOrderRef;
  let guestToken;

  before(async () => {
    // Create an eligible order for testing payment creation
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 1 }],
        customer: {
          fullName: 'Ananya Sharma',
          email: 'ananya.sharma@example.com',
          phone: '9812345678',
          addressLine1: '45 Lake View Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
        },
      }),
    });
    const orderData = await orderRes.json();
    createdOrderRef = orderData.orderReference;
    guestToken = orderData.guestAccessToken;
  });

  test('POST /api/payments/create-order creates a payment attempt with database-authoritative amount', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: createdOrderRef,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.paymentReference.startsWith('AMOGA-PAY-'));
    assert.strictEqual(body.data.orderReference, createdOrderRef);
    assert.strictEqual(body.data.provider, 'test');
    assert.strictEqual(body.data.currency, 'INR');
    assert.strictEqual(body.data.amountPaise, 24900); // 249.00 * 100 paise
    assert.strictEqual(body.data.status, 'PENDING');
  });

  test('POST /api/payments/create-order reuses active pending attempt idempotently', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: createdOrderRef,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.orderReference, createdOrderRef);
    assert.strictEqual(body.data.amountPaise, 24900);
  });

  test('POST /api/payments/create-order rejects missing guest access token with 401', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderReference: createdOrderRef,
      }),
    });

    assert.strictEqual(res.status, 401);
  });

  test('POST /api/payments/create-order rejects invalid order reference with 404', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: 'AMOGA-ORD-2026-UNKNOWN-999999',
      }),
    });

    assert.strictEqual(res.status, 404);
  });
});

describe('2. Server-Side Signature Verification & Order State Transition', () => {
  let orderRef;
  let guestToken;
  let paymentRef;
  let providerOrderId;
  let amountPaise;

  before(async () => {
    // Create new order
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 2 }],
        customer: {
          fullName: 'Rohan Mehra',
          email: 'rohan.mehra@example.com',
          phone: '9845098450',
          addressLine1: '78 Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      }),
    });
    const orderData = await orderRes.json();
    orderRef = orderData.orderReference;
    guestToken = orderData.guestAccessToken;

    // Create payment attempt
    const payRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({ orderReference: orderRef }),
    });
    const payData = await payRes.json();
    paymentRef = payData.data.paymentReference;
    providerOrderId = payData.data.providerOrderId;
    amountPaise = payData.data.amountPaise;
  });

  test('POST /api/payments/verify rejects invalid or tampered signature with 400 and leaves database state PENDING', async () => {
    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: orderRef,
        paymentReference: paymentRef,
        providerOrderId,
        providerPaymentId: 'test_pay_invalid_123',
        providerSignature: 'tampered-signature-abcdef1234567890abcdef1234567890',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('signature'));

    // Critical security check: Database state must NOT be mutated to FAILED solely due to invalid callback
    const dbPayment = await prisma.payment.findUnique({
      where: { paymentReference: paymentRef },
    });
    assert.strictEqual(dbPayment.status, 'PENDING');

    const dbOrder = await prisma.order.findUnique({
      where: { orderReference: orderRef },
    });
    assert.strictEqual(dbOrder.status, 'PENDING_CONFIRMATION');
    assert.strictEqual(dbOrder.paymentStatus, 'PENDING');
  });

  test('POST /api/payments/verify accepts cryptographically valid test signature and transitions order to CONFIRMED', async () => {
    const provider = getPaymentProvider();
    const validPaymentId = 'test_pay_success_' + Date.now();
    const validSignature = provider.generateTestSignature({
      paymentReference: paymentRef,
      providerOrderId,
      providerPaymentId: validPaymentId,
      amountPaise,
    });

    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: orderRef,
        paymentReference: paymentRef,
        providerOrderId,
        providerPaymentId: validPaymentId,
        providerSignature: validSignature,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'SUCCEEDED');
    assert.strictEqual(body.data.orderReference, orderRef);

    // Verify order in database is now CONFIRMED and paymentStatus is SUCCEEDED
    const dbOrder = await prisma.order.findUnique({
      where: { orderReference: orderRef },
    });
    assert.strictEqual(dbOrder.status, 'CONFIRMED');
    assert.strictEqual(dbOrder.paymentStatus, 'SUCCEEDED');
  });

  test('POST /api/payments/verify is idempotent for already confirmed payments', async () => {
    const provider = getPaymentProvider();
    const validPaymentId = 'test_pay_dup_' + Date.now();
    const validSignature = provider.generateTestSignature({
      paymentReference: paymentRef,
      providerOrderId,
      providerPaymentId: validPaymentId,
      amountPaise,
    });

    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({
        orderReference: orderRef,
        paymentReference: paymentRef,
        providerOrderId,
        providerPaymentId: validPaymentId,
        providerSignature: validSignature,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'SUCCEEDED');
  });
});

describe('3. Webhook Ingestion & Event Deduplication', () => {
  let orderRef;
  let guestToken;
  let paymentRef;
  let _providerOrderId;

  before(async () => {
    // Create new order and payment attempt for webhook test
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 1 }],
        customer: {
          fullName: 'Kiran Rao',
          email: 'kiran.rao@example.com',
          phone: '9845012345',
          addressLine1: '100 Malleshwaram',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560003',
        },
      }),
    });
    const orderData = await orderRes.json();
    orderRef = orderData.orderReference;
    guestToken = orderData.guestAccessToken;

    const payRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({ orderReference: orderRef }),
    });
    const payData = await payRes.json();
    paymentRef = payData.data.paymentReference;
    _providerOrderId = payData.data.providerOrderId;
  });

  test('POST /api/payments/webhook rejects unauthenticated webhook signature with 401', async () => {
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amoga-test-signature': 'invalid-signature-1234567890abcdef',
      },
      body: JSON.stringify({
        eventId: 'evt_invalid_1',
        eventType: 'payment.succeeded',
      }),
    });

    assert.strictEqual(res.status, 401);
  });

  test('POST /api/payments/webhook processes authentic signed event and updates order', async () => {
    const provider = getPaymentProvider();
    const eventId = `test_evt_webhook_${Date.now()}`;
    const rawPayload = JSON.stringify({
      eventId,
      eventType: 'payment.succeeded',
      orderReference: orderRef,
      paymentReference: paymentRef,
      providerPaymentId: `test_pay_wh_${Date.now()}`,
    });

    // Generate valid webhook signature
    const signature = Buffer.from(
      (await import('crypto')).default
        .createHmac('sha256', provider.secret)
        .update(Buffer.from(rawPayload, 'utf8'))
        .digest('hex')
    ).toString('utf8');

    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amoga-test-signature': signature,
      },
      body: rawPayload,
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.received, true);
    assert.strictEqual(body.eventId, eventId);

    // Verify order was confirmed by webhook
    const dbOrder = await prisma.order.findUnique({
      where: { orderReference: orderRef },
    });
    assert.strictEqual(dbOrder.status, 'CONFIRMED');
    assert.strictEqual(dbOrder.paymentStatus, 'SUCCEEDED');
  });

  test('POST /api/payments/webhook deduplicates duplicate event IDs safely', async () => {
    const provider = getPaymentProvider();
    const duplicateEventId = `test_evt_dup_${Date.now()}`;
    const rawPayload = JSON.stringify({
      eventId: duplicateEventId,
      eventType: 'payment.succeeded',
      orderReference: orderRef,
      paymentReference: paymentRef,
      providerPaymentId: `test_pay_wh_dup_${Date.now()}`,
    });

    const crypto = (await import('crypto')).default;
    const signature = crypto.createHmac('sha256', provider.secret).update(Buffer.from(rawPayload, 'utf8')).digest('hex');

    // First delivery
    const firstRes = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amoga-test-signature': signature,
      },
      body: rawPayload,
    });
    assert.strictEqual(firstRes.status, 200);

    // Second delivery of identical event ID
    const secondRes = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amoga-test-signature': signature,
      },
      body: rawPayload,
    });
    assert.strictEqual(secondRes.status, 200);
    const secondBody = await secondRes.json();
    assert.strictEqual(secondBody.duplicate, true);
  });
});

describe('4. Protected Payment Status Endpoint', () => {
  let orderRef;
  let guestToken;
  let paymentRef;

  before(async () => {
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 1 }],
        customer: {
          fullName: 'Tara Varma',
          email: 'tara.varma@example.com',
          phone: '9845088888',
          addressLine1: '24 Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
        },
      }),
    });
    const orderData = await orderRes.json();
    orderRef = orderData.orderReference;
    guestToken = orderData.guestAccessToken;

    const payRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': guestToken,
      },
      body: JSON.stringify({ orderReference: orderRef }),
    });
    const payData = await payRes.json();
    paymentRef = payData.data.paymentReference;
  });

  test('GET /api/payments/:paymentReference/status returns payment snapshot when authorized', async () => {
    const res = await fetch(`${baseUrl}/payments/${paymentRef}/status`, {
      headers: {
        'x-guest-access-token': guestToken,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.paymentReference, paymentRef);
    assert.strictEqual(body.data.orderReference, orderRef);
    assert.strictEqual(body.data.status, 'PENDING');
  });

  test('GET /api/payments/:paymentReference/status rejects unauthorized request without token', async () => {
    const res = await fetch(`${baseUrl}/payments/${paymentRef}/status`);
    assert.strictEqual(res.status, 401);
  });
});

describe('5. Phase 8.1 Concurrency, Idempotency & State Machine Hardening', () => {
  let orderA;
  let tokenA;
  let orderB;
  let tokenB;

  before(async () => {
    // Create Order A
    const resA = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 1 }],
        customer: {
          fullName: 'Order A Customer',
          email: 'ordera@example.com',
          phone: '9800000001',
          addressLine1: 'Address A',
          city: 'City A',
          state: 'State A',
          pincode: '500001',
        },
      }),
    });
    const dataA = await resA.json();
    orderA = dataA.orderReference;
    tokenA = dataA.guestAccessToken;

    // Create Order B
    const resB = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'f-turmeric-01', quantity: 1 }],
        customer: {
          fullName: 'Order B Customer',
          email: 'orderb@example.com',
          phone: '9800000002',
          addressLine1: 'Address B',
          city: 'City B',
          state: 'State B',
          pincode: '500002',
        },
      }),
    });
    const dataB = await resB.json();
    orderB = dataB.orderReference;
    tokenB = dataB.guestAccessToken;
  });

  test('POST /api/payments/create-order with idempotencyKey reuses attempt for same order', async () => {
    const testIdempKey = `IDEMP-SAME-${Date.now()}`;
    const res1 = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenA,
      },
      body: JSON.stringify({
        orderReference: orderA,
        idempotencyKey: testIdempKey,
      }),
    });
    assert.strictEqual(res1.status, 201);
    const body1 = await res1.json();

    const res2 = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenA,
      },
      body: JSON.stringify({
        orderReference: orderA,
        idempotencyKey: testIdempKey,
      }),
    });
    assert.strictEqual(res2.status, 201);
    const body2 = await res2.json();
    assert.strictEqual(body1.data.paymentReference, body2.data.paymentReference);
  });

  test('POST /api/payments/create-order rejects reusing idempotencyKey for DIFFERENT order with HTTP 409 Conflict', async () => {
    const testIdempKeyConflict = `IDEMP-CONFLICT-${Date.now()}`;
    // First order uses key
    const res1 = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenA,
      },
      body: JSON.stringify({
        orderReference: orderA,
        idempotencyKey: testIdempKeyConflict,
      }),
    });
    assert.strictEqual(res1.status, 201);

    // Second different order attempts to use same key
    const res2 = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenB,
      },
      body: JSON.stringify({
        orderReference: orderB,
        idempotencyKey: testIdempKeyConflict,
      }),
    });
    assert.strictEqual(res2.status, 409);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, false);
    assert.ok(body2.error.toLowerCase().includes('conflict'));
  });

  test('Concurrent duplicate webhook delivery is handled idempotently without throwing 500', async () => {
    const provider = getPaymentProvider();
    const eventId = `test_concurrent_evt_${Date.now()}`;
    const rawPayload = JSON.stringify({
      eventId,
      eventType: 'payment.succeeded',
      orderReference: orderA,
      providerPaymentId: `test_pay_concurrent_${Date.now()}`,
    });

    const crypto = (await import('crypto')).default;
    const signature = crypto.createHmac('sha256', provider.secret).update(Buffer.from(rawPayload, 'utf8')).digest('hex');

    // Fire two identical webhooks simultaneously
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-amoga-test-signature': signature,
        },
        body: rawPayload,
      }),
      fetch(`${baseUrl}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-amoga-test-signature': signature,
        },
        body: rawPayload,
      }),
    ]);

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res2.status, 200);
    const b1 = await res1.json();
    const b2 = await res2.json();
    assert.ok(b1.received === true);
    assert.ok(b2.received === true);
    assert.ok(b1.duplicate === true || b2.duplicate === true);
  });

  test('Delayed payment.failed webhook CANNOT downgrade a SUCCEEDED payment or CONFIRMED order', async () => {
    // 1. Create a payment for orderB and mark it SUCCEEDED
    const payRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenB,
      },
      body: JSON.stringify({ orderReference: orderB }),
    });
    const payData = await payRes.json();
    const paymentRefB = payData.data.paymentReference;
    const providerOrderIdB = payData.data.providerOrderId;
    const amountPaiseB = payData.data.amountPaise;

    const provider = getPaymentProvider();
    const validPaymentId = 'test_pay_orderb_' + Date.now();
    const validSignature = provider.generateTestSignature({
      paymentReference: paymentRefB,
      providerOrderId: providerOrderIdB,
      providerPaymentId: validPaymentId,
      amountPaise: amountPaiseB,
    });

    const verifyRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-access-token': tokenB,
      },
      body: JSON.stringify({
        orderReference: orderB,
        paymentReference: paymentRefB,
        providerOrderId: providerOrderIdB,
        providerPaymentId: validPaymentId,
        providerSignature: validSignature,
      }),
    });
    assert.strictEqual(verifyRes.status, 200);

    // Verify it is SUCCEEDED in DB
    const paymentBefore = await prisma.payment.findUnique({
      where: { paymentReference: paymentRefB },
    });
    assert.strictEqual(paymentBefore.status, 'SUCCEEDED');

    // 2. Now simulate a delayed out-of-order payment.failed webhook
    const rawFailurePayload = JSON.stringify({
      eventId: `test_delayed_fail_${Date.now()}`,
      eventType: 'payment.failed',
      orderReference: orderB,
      paymentReference: paymentRefB,
      providerPaymentId: validPaymentId,
    });
    const crypto = (await import('crypto')).default;
    const signature = crypto.createHmac('sha256', provider.secret).update(Buffer.from(rawFailurePayload, 'utf8')).digest('hex');

    const webhookRes = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amoga-test-signature': signature,
      },
      body: rawFailurePayload,
    });
    assert.strictEqual(webhookRes.status, 200);

    // 3. Verify payment status is STILL SUCCEEDED and order is STILL CONFIRMED
    const paymentAfter = await prisma.payment.findUnique({
      where: { paymentReference: paymentRefB },
    });
    assert.strictEqual(paymentAfter.status, 'SUCCEEDED', 'Payment must not be downgraded from SUCCEEDED to FAILED');

    const orderAfter = await prisma.order.findUnique({
      where: { orderReference: orderB },
    });
    assert.strictEqual(orderAfter.status, 'CONFIRMED', 'Order must remain CONFIRMED');
    assert.strictEqual(orderAfter.paymentStatus, 'SUCCEEDED', 'Order paymentStatus must remain SUCCEEDED');
  });

  test('POST /api/payments/test-simulate rejects unauthorized guest access with 401', async () => {
    const res = await fetch(`${baseUrl}/payments/test-simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderReference: orderA,
        paymentReference: 'dummy-ref',
      }),
    });
    assert.strictEqual(res.status, 401);
  });
});
