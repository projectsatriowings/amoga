import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

/**
 * Helper to get an active Razorpay client instance
 */
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (paise), currency, receipt, notes }
 * Minimum amount: 100 paise (1 INR)
 * Return: { success: true, order_id, amount, currency, key_id }
 */
export async function createStandardOrder(req, res) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Razorpay API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in environment.',
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body || {};

    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum < 100) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Amount is required and must be at least 100 paise (1 INR).',
      });
    }

    const client = getRazorpayClient();
    const orderOptions = {
      amount: Math.round(amountNum), // Authoritative integer paise
      currency: String(currency).toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const razorpayOrder = await client.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      key_id: keyId,
    });
  } catch (err) {
    console.error('[RAZORPAY CREATE ORDER ERROR]:', err);
    const statusCode = err.statusCode || (err.error?.code === 'BAD_REQUEST_ERROR' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      error: 'ORDER_CREATION_FAILED',
      message: err?.error?.description || err.message || 'Failed to create order with Razorpay.',
      details: err?.error || undefined,
    });
  }
}

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
export async function verifyStandardPayment(req, res) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Razorpay secret key is not configured on the server.',
      });
    }

    const {
      razorpay_order_id,
      order_id,
      razorpay_payment_id,
      payment_id,
      razorpay_signature,
      signature,
    } = req.body || {};

    const targetOrderId = razorpay_order_id || order_id;
    const targetPaymentId = razorpay_payment_id || payment_id;
    const targetSignature = razorpay_signature || signature;

    if (!targetOrderId || !targetPaymentId || !targetSignature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: order_id, payment_id, and signature are all required.',
      });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${targetOrderId}|${targetPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const bufA = Buffer.from(String(targetSignature).trim(), 'utf8');
    const bufB = Buffer.from(String(expectedSignature).trim(), 'utf8');

    if (bufA.length !== bufB.length) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Signature verification failed. Invalid payment signature.',
      });
    }

    const isValid = crypto.timingSafeEqual(bufA, bufB);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Signature verification failed. Invalid payment signature.',
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully.',
      order_id: targetOrderId,
      payment_id: targetPaymentId,
    });
  } catch (err) {
    console.error('[RAZORPAY VERIFY PAYMENT ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'VERIFICATION_ERROR',
      message: err.message || 'Internal error during payment verification.',
    });
  }
}
