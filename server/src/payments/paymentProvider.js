/**
 * AMOGA E-COMMERCE — ABSTRACT PAYMENT PROVIDER INTERFACE
 * 
 * Defines the contract that all payment provider adapters (Test, Razorpay, Cashfree, Stripe)
 * must implement. This isolates provider-specific SDKs, signature schemes, and webhook
 * parsing from core application and order logic.
 */

export class PaymentProvider {
  /**
   * Return the canonical identifier of the provider (e.g. 'test', 'razorpay', 'cashfree', 'stripe')
   * @returns {string}
   */
  getProviderName() {
    throw new Error('Method getProviderName() must be implemented by payment adapter.');
  }

  /**
   * Create a payment order/intent with the provider
   * @param {Object} params
   * @param {string} params.orderReference Internal order reference
   * @param {string} params.paymentReference Internal unique payment attempt reference
   * @param {number} params.amountPaise Authoritative amount in integer paise (1 INR = 100 paise)
   * @param {string} params.currency Currency code ('INR')
   * @param {Object} params.customer Customer snapshot (name, email, phone)
   * @returns {Promise<{ providerOrderId: string, clientPayload: Object }>}
   */
  async createPaymentOrder(/* params */) {
    throw new Error('Method createPaymentOrder() must be implemented by payment adapter.');
  }

  /**
   * Verify callback/redirect result submitted by client
   * @param {Object} params
   * @param {string} params.paymentReference Internal payment attempt reference
   * @param {string} params.providerOrderId Provider's order identifier
   * @param {string} params.providerPaymentId Provider's payment/charge identifier
   * @param {string} params.providerSignature Provider cryptographic signature
   * @param {number} params.expectedAmountPaise Expected amount in integer paise
   * @param {string} params.expectedCurrency Expected currency ('INR')
   * @returns {Promise<{ verified: boolean, providerPaymentId: string, status: string, error?: string }>}
   */
  async verifyPaymentCallback(/* params */) {
    throw new Error('Method verifyPaymentCallback() must be implemented by payment adapter.');
  }

  /**
   * Verify authenticity of a webhook event payload against request headers
   * @param {Object} params
   * @param {Buffer|string} params.rawBody Exact raw request body
   * @param {Object} params.headers Request headers
   * @returns {boolean}
   */
  verifyWebhook(/* params */) {
    throw new Error('Method verifyWebhook() must be implemented by payment adapter.');
  }

  /**
   * Parse a verified webhook event into normalized internal event structure
   * @param {Object} params
   * @param {Buffer|string} params.rawBody
   * @param {Object} params.headers
   * @returns {Object} Normalized event: { eventId, eventType, orderReference, paymentReference, providerPaymentId, status, payload }
   */
  parseVerifiedWebhookEvent(/* params */) {
    throw new Error('Method parseVerifiedWebhookEvent() must be implemented by payment adapter.');
  }

  /**
   * Fetch payment status directly from provider API for reconciliation (optional)
   * @param {Object} params
   * @param {string} params.providerOrderId
   * @param {string} params.providerPaymentId
   * @returns {Promise<Object>}
   */
  async fetchPaymentStatus(/* params */) {
    throw new Error('Method fetchPaymentStatus() is not supported by this payment adapter.');
  }
}
