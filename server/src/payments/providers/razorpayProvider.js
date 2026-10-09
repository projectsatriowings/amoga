import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PaymentProvider } from '../paymentProvider.js';
import { env } from '../../config/env.js';

/**
 * AMOGA E-COMMERCE — RAZORPAY PAYMENT GATEWAY ADAPTER
 * 
 * Integrates official Razorpay Standard Checkout & Orders API with:
 * - Native integer paise calculations (1 INR = 100 paise)
 * - Automatic payment capture (payment_capture: 1)
 * - Constant-time HMAC-SHA256 callback signature verification
 * - Raw request body webhook verification
 * - Normalized event mapping into Amoga payment lifecycle states
 */
export class RazorpayPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (!this.keyId || !this.keySecret) {
      if (env.NODE_ENV === 'production') {
        throw new Error('[FATAL SECURITY ERROR]: Razorpay key ID and secret must be configured in production.');
      }
    }

    // Safety Guard: Live payments are strictly disabled in this phase
    if (this.keyId && this.keyId.startsWith('rzp_live_')) {
      throw new Error('[FATAL SECURITY ERROR]: Live credentials ("rzp_live_...") detected. Live payment processing is strictly disabled.');
    }

    if (this.keyId && this.keySecret) {
      this.client = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  getProviderName() {
    return 'razorpay';
  }

  /**
   * Creates a server-side Razorpay Order with automatic capture
   */
  async createPaymentOrder({ orderReference, paymentReference, amountPaise, currency, customer }) {
    if (!this.client) {
      throw new Error('Razorpay client is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    const orderOptions = {
      amount: amountPaise, // Authoritative integer paise
      currency: currency || 'INR',
      receipt: paymentReference,
      payment_capture: 1, // Automatic capture policy
      notes: {
        orderReference,
        paymentReference,
        customerName: customer?.name || 'Customer',
        customerEmail: customer?.email || '',
      },
    };

    const razorpayOrder = await this.client.orders.create(orderOptions);

    return {
      providerOrderId: razorpayOrder.id,
      clientPayload: {
        mode: env.PAYMENT_MODE || 'sandbox',
        provider: 'razorpay',
        keyId: this.keyId,
        orderId: razorpayOrder.id,
        amountPaise,
        currency: currency || 'INR',
        name: 'AMOGA',
        description: `Order ${orderReference}`,
        prefill: {
          name: customer?.name || '',
          email: customer?.email || '',
          contact: customer?.phone || '',
        },
        notes: {
          orderReference,
          paymentReference,
        },
      },
    };
  }

  /**
   * Constant-time verification of Razorpay callback signatures
   * Payload: `${providerOrderId}|${providerPaymentId}`
   */
  async verifyPaymentCallback({
    providerOrderId,
    providerPaymentId,
    providerSignature,
    expectedCurrency,
  }) {
    if (!providerSignature || typeof providerSignature !== 'string') {
      return { verified: false, error: 'Missing or malformed Razorpay signature.' };
    }

    if (expectedCurrency && expectedCurrency !== 'INR') {
      return { verified: false, error: `Unsupported payment currency: ${expectedCurrency}` };
    }

    if (!this.keySecret) {
      return { verified: false, error: 'Razorpay secret key is not configured.' };
    }

    const payload = `${providerOrderId}|${providerPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    const bufA = Buffer.from(providerSignature.trim(), 'utf8');
    const bufB = Buffer.from(expectedSignature, 'utf8');

    if (bufA.length !== bufB.length) {
      return { verified: false, error: 'Invalid Razorpay signature length mismatch.' };
    }

    const isValid = crypto.timingSafeEqual(bufA, bufB);
    if (!isValid) {
      return { verified: false, error: 'Invalid Razorpay payment signature.' };
    }

    return {
      verified: true,
      providerPaymentId,
      status: 'SUCCEEDED',
    };
  }

  /**
   * Verifies Razorpay webhook signature against the raw request body
   */
  verifyWebhook({ rawBody, headers }) {
    const signature = headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string' || !this.webhookSecret) {
      return false;
    }

    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf8');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyBuffer)
      .digest('hex');

    const bufA = Buffer.from(signature.trim(), 'utf8');
    const bufB = Buffer.from(expectedSignature, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Normalizes Razorpay webhook payload into canonical Amoga event format
   */
  parseVerifiedWebhookEvent({ rawBody, headers }) {
    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    const paymentEntity = data.payload?.payment?.entity;
    const orderEntity = data.payload?.order?.entity;

    const eventId = data.event_id || (headers && headers['x-razorpay-event-id']) || `rzp_evt_${Date.now()}`;

    // Map Razorpay event names to Amoga canonical events
    let eventType = data.event;
    if (data.event === 'payment.captured' || data.event === 'order.paid') {
      eventType = 'payment.succeeded';
    } else if (data.event === 'payment.failed') {
      eventType = 'payment.failed';
    }

    return {
      eventId,
      eventType,
      orderReference: paymentEntity?.notes?.orderReference || orderEntity?.notes?.orderReference || null,
      paymentReference: paymentEntity?.notes?.paymentReference || null,
      providerPaymentId: paymentEntity?.id || null,
      providerOrderId: orderEntity?.id || paymentEntity?.order_id || null,
      status: eventType === 'payment.succeeded' ? 'SUCCEEDED' : 'FAILED',
      payload: data,
    };
  }

  /**
   * Fetches authoritative payment record from Razorpay API for reconciliation
   */
  async fetchPaymentStatus({ providerPaymentId }) {
    if (!this.client) {
      throw new Error('Razorpay client not configured.');
    }
    return this.client.payments.fetch(providerPaymentId);
  }
}
