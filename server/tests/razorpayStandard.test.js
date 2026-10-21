import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { app } from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Razorpay Standard Checkout API', async (t) => {
  await t.test('1. POST /api/create-order rejects missing or invalid amounts (< 100 paise)', async () => {
    // Missing amount
    const res1 = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res1.status, 400);
    const data1 = await res1.json();
    assert.strictEqual(data1.error, 'INVALID_AMOUNT');

    // Amount below 100 paise (50 paise)
    const res2 = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50 }),
    });
    assert.strictEqual(res2.status, 400);
    const data2 = await res2.json();
    assert.strictEqual(data2.error, 'INVALID_AMOUNT');
  });

  await t.test('2. POST /api/create-order successfully creates an order with Razorpay in test mode', async () => {
    const res = await fetch(`${baseUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000, // 500 INR in paise
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.ok(data.order_id, 'Should return order_id');
    assert.match(data.order_id, /^order_/);
    assert.strictEqual(data.amount, 50000);
    assert.strictEqual(data.currency, 'INR');
  });

  await t.test('3. POST /api/verify-payment rejects requests with missing fields', async () => {
    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_123',
        // missing payment_id and signature
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'MISSING_FIELDS');
  });

  await t.test('4. POST /api/verify-payment rejects invalid or tampered signatures', async () => {
    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_12345',
        razorpay_payment_id: 'pay_test_67890',
        razorpay_signature: 'invalid_hex_signature_000000000000000000000000000000000000000000000000',
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.verified, false);
    assert.strictEqual(data.error, 'SIGNATURE_MISMATCH');
  });

  await t.test('5. POST /api/verify-payment accepts valid HMAC-SHA256 signatures', async () => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'cVFT1RT0RZDiSQ5LNxrsErm1';
    const testOrderId = 'order_test_valid_999';
    const testPaymentId = 'pay_test_valid_888';

    // Compute legitimate signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    const res = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: testOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.verified, true);
    assert.strictEqual(data.order_id, testOrderId);
    assert.strictEqual(data.payment_id, testPaymentId);
  });
});
