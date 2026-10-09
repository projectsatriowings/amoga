import crypto from 'crypto';
import { PaymentProvider } from '../paymentProvider.js';
import { env } from '../../config/env.js';

/**
 * AMOGA E-COMMERCE — DEVELOPMENT & TEST PAYMENT PROVIDER ADAPTER
 * 
 * Used strictly for engineering validation, integration tests, and simulated checkout flows
 * prior to client approval and selection of a live gateway provider.
 * 
 * SECURITY SAFEGUARDS:
 * - Cannot be activated in production (fails fast at startup).
 * - Cryptographically verifies simulated signatures using server-side HMAC-SHA256.
 * - Rejects tampered amounts, mismatched currencies, and invalid signatures.
 */
export class TestPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    if (env.NODE_ENV === 'production') {
      throw new Error('[FATAL SECURITY ERROR]: TestPaymentProvider cannot be instantiated in production.');
    }
    this.secret = env.TEST_PAYMENT_SECRET;
  }

  getProviderName() {
    return 'test';
  }

  /**
   * Generates a deterministic simulated provider order
   */
  async createPaymentOrder({ orderReference, paymentReference, amountPaise, currency, customer }) {
    const providerOrderId = `test_ord_${paymentReference.replace(/[^a-zA-Z0-9]/g, '_')}`;

    return {
      providerOrderId,
      clientPayload: {
        mode: 'test',
        provider: 'test',
        orderReference,
        paymentReference,
        providerOrderId,
        amountPaise,
        currency,
        customerName: customer?.name || 'Customer',
        simulationNotice: 'Development Test Payment Flow — No real currency is transferred.',
      },
    };
  }

  /**
   * Helper to generate a valid test signature for development testing
   */
  generateTestSignature({ paymentReference, providerOrderId, providerPaymentId, amountPaise }) {
    const payload = `${paymentReference}|${providerOrderId}|${providerPaymentId}|${amountPaise}`;
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  /**
   * Constant-time verification of test callback signatures
   */
  async verifyPaymentCallback({
    paymentReference,
    providerOrderId,
    providerPaymentId,
    providerSignature,
    expectedAmountPaise,
    expectedCurrency,
  }) {
    if (!providerSignature || typeof providerSignature !== 'string') {
      return { verified: false, error: 'Missing or malformed test payment signature.' };
    }

    if (expectedCurrency !== 'INR') {
      return { verified: false, error: `Unsupported payment currency: ${expectedCurrency}` };
    }

    const expectedSignature = this.generateTestSignature({
      paymentReference,
      providerOrderId,
      providerPaymentId,
      amountPaise: expectedAmountPaise,
    });

    const bufA = Buffer.from(providerSignature.trim(), 'utf8');
    const bufB = Buffer.from(expectedSignature, 'utf8');

    if (bufA.length !== bufB.length) {
      return { verified: false, error: 'Invalid test payment signature (length mismatch).' };
    }

    const isValid = crypto.timingSafeEqual(bufA, bufB);
    if (!isValid) {
      return { verified: false, error: 'Invalid test payment signature.' };
    }

    return {
      verified: true,
      providerPaymentId,
      status: 'SUCCEEDED',
    };
  }

  /**
   * Verifies test webhook signature against raw request body
   */
  verifyWebhook({ rawBody, headers }) {
    const signature = headers['x-amoga-test-signature'];
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf8');
    const expectedSignature = crypto.createHmac('sha256', this.secret).update(bodyBuffer).digest('hex');

    const bufA = Buffer.from(signature.trim(), 'utf8');
    const bufB = Buffer.from(expectedSignature, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Normalizes test webhook payload into canonical internal event format
   */
  parseVerifiedWebhookEvent({ rawBody }) {
    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));

    return {
      eventId: data.eventId || `test_evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      eventType: data.eventType, // e.g. 'payment.succeeded' or 'payment.failed'
      orderReference: data.orderReference,
      paymentReference: data.paymentReference,
      providerPaymentId: data.providerPaymentId,
      status: data.eventType === 'payment.succeeded' ? 'SUCCEEDED' : 'FAILED',
      payload: data,
    };
  }
}
