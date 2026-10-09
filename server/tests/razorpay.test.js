import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { RazorpayPaymentProvider } from '../src/payments/providers/razorpayProvider.js';

describe('Razorpay Payment Provider Adapter Unit Tests', () => {
  const mockKeyId = 'rzp_test_mockKeyId12345';
  const mockKeySecret = 'mockSecretKey9876543210abcdef';
  const mockWebhookSecret = 'mockWebhookSecret1234567890abcdef';

  function createTestAdapter() {
    const adapter = new RazorpayPaymentProvider();
    adapter.keyId = mockKeyId;
    adapter.keySecret = mockKeySecret;
    adapter.webhookSecret = mockWebhookSecret;
    return adapter;
  }

  test('getProviderName returns "razorpay"', () => {
    const adapter = createTestAdapter();
    assert.strictEqual(adapter.getProviderName(), 'razorpay');
  });

  test('constructor throws fatal security error if live credentials (rzp_live_...) are provided', async () => {
    const { env } = await import('../src/config/env.js');
    const originalKey = env.RAZORPAY_KEY_ID;
    try {
      env.RAZORPAY_KEY_ID = 'rzp_live_unauthorized_key_12345';
      assert.throws(
        () => new RazorpayPaymentProvider(),
        /Live credentials \("rzp_live_\.\.\."\) detected/
      );
    } finally {
      env.RAZORPAY_KEY_ID = originalKey;
    }
  });

  test('verifyPaymentCallback accepts valid HMAC-SHA256 signature', async () => {
    const adapter = createTestAdapter();
    const orderId = 'order_DA12345678';
    const paymentId = 'pay_XY98765432';

    // Official Razorpay formula: HMAC-SHA256 of orderId + "|" + paymentId
    const signature = crypto
      .createHmac('sha256', mockKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = await adapter.verifyPaymentCallback({
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: signature,
      expectedCurrency: 'INR',
    });

    assert.strictEqual(result.verified, true);
    assert.strictEqual(result.providerPaymentId, paymentId);
    assert.strictEqual(result.status, 'SUCCEEDED');
  });

  test('verifyPaymentCallback rejects tampered or invalid signature', async () => {
    const adapter = createTestAdapter();
    const orderId = 'order_DA12345678';
    const paymentId = 'pay_XY98765432';
    const invalidSignature = 'tampered_signature_1234567890abcdef1234567890abcdef';

    const result = await adapter.verifyPaymentCallback({
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: invalidSignature,
      expectedCurrency: 'INR',
    });

    assert.strictEqual(result.verified, false);
    assert.ok(result.error.toLowerCase().includes('signature'));
  });

  test('verifyPaymentCallback rejects unsupported currency', async () => {
    const adapter = createTestAdapter();
    const orderId = 'order_DA12345678';
    const paymentId = 'pay_XY98765432';
    const signature = crypto
      .createHmac('sha256', mockKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = await adapter.verifyPaymentCallback({
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: signature,
      expectedCurrency: 'USD',
    });

    assert.strictEqual(result.verified, false);
    assert.ok(result.error.includes('Unsupported payment currency'));
  });

  test('verifyWebhook verifies authentic signature against raw request body', () => {
    const adapter = createTestAdapter();
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: 'pay_123' } },
      },
    });

    const signature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    const isValid = adapter.verifyWebhook({
      rawBody,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    assert.strictEqual(isValid, true);
  });

  test('verifyWebhook rejects tampered payload or missing signature', () => {
    const adapter = createTestAdapter();
    const rawBody = '{"event":"payment.captured"}';

    assert.strictEqual(
      adapter.verifyWebhook({
        rawBody,
        headers: {},
      }),
      false
    );

    assert.strictEqual(
      adapter.verifyWebhook({
        rawBody,
        headers: { 'x-razorpay-signature': 'tampered' },
      }),
      false
    );
  });

  test('parseVerifiedWebhookEvent normalizes "payment.captured" into canonical event', () => {
    const adapter = createTestAdapter();
    const payload = {
      event_id: 'evt_test_123',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_payment_99',
            order_id: 'order_test_rzp_88',
            amount: 24900,
            notes: {
              orderReference: 'AMOGA-ORD-2026-TEST',
              paymentReference: 'AMOGA-PAY-2026-TEST',
            },
          },
        },
        order: {
          entity: {
            id: 'order_test_rzp_88',
          },
        },
      },
    };

    const parsed = adapter.parseVerifiedWebhookEvent({
      rawBody: JSON.stringify(payload),
      headers: {},
    });

    assert.strictEqual(parsed.eventId, 'evt_test_123');
    assert.strictEqual(parsed.eventType, 'payment.succeeded');
    assert.strictEqual(parsed.orderReference, 'AMOGA-ORD-2026-TEST');
    assert.strictEqual(parsed.paymentReference, 'AMOGA-PAY-2026-TEST');
    assert.strictEqual(parsed.providerPaymentId, 'pay_test_payment_99');
    assert.strictEqual(parsed.providerOrderId, 'order_test_rzp_88');
    assert.strictEqual(parsed.status, 'SUCCEEDED');
  });

  test('parseVerifiedWebhookEvent normalizes "payment.failed" into canonical event', () => {
    const adapter = createTestAdapter();
    const payload = {
      event_id: 'evt_fail_999',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_failed_11',
            order_id: 'order_failed_22',
            notes: {
              orderReference: 'AMOGA-ORD-2026-FAIL',
            },
          },
        },
      },
    };

    const parsed = adapter.parseVerifiedWebhookEvent({
      rawBody: JSON.stringify(payload),
      headers: {},
    });

    assert.strictEqual(parsed.eventId, 'evt_fail_999');
    assert.strictEqual(parsed.eventType, 'payment.failed');
    assert.strictEqual(parsed.orderReference, 'AMOGA-ORD-2026-FAIL');
    assert.strictEqual(parsed.status, 'FAILED');
  });
});
