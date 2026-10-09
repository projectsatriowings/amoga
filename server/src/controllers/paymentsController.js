import {
  createPaymentOrder,
  verifyPaymentCallback,
  processWebhook,
  getPaymentStatus as fetchPaymentStatusService,
} from '../payments/paymentService.js';
import {
  createPaymentOrderSchema,
  verifyPaymentCallbackSchema,
} from '../schemas/paymentSchemas.js';

function extractGuestToken(req) {
  const headerToken = req.headers['x-guest-access-token'];
  if (headerToken && typeof headerToken === 'string') {
    return headerToken.trim();
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export async function postCreatePaymentOrder(req, res, next) {
  try {
    const parseResult = createPaymentOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const guestAccessToken = extractGuestToken(req);
    if (!guestAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing guest order access token. Provide in "x-guest-access-token" header.',
      });
    }

    const { orderReference, idempotencyKey } = parseResult.data;

    const result = await createPaymentOrder({
      orderReference,
      guestAccessToken,
      idempotencyKey,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function postVerifyPayment(req, res, next) {
  try {
    const parseResult = verifyPaymentCallbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const guestAccessToken = extractGuestToken(req);
    if (!guestAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing guest order access token. Provide in "x-guest-access-token" header.',
      });
    }

    const {
      orderReference,
      paymentReference,
      providerOrderId,
      providerPaymentId,
      providerSignature,
    } = parseResult.data;

    const result = await verifyPaymentCallback({
      orderReference,
      paymentReference,
      providerOrderId,
      providerPaymentId,
      providerSignature,
      guestAccessToken,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function postWebhook(req, res, next) {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const headers = req.headers;

    const result = await processWebhook({ rawBody, headers });

    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function getPaymentStatus(req, res, next) {
  try {
    const { paymentReference } = req.params;
    const guestAccessToken = extractGuestToken(req);

    if (!guestAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing guest order access token. Provide in "x-guest-access-token" header.',
      });
    }

    const result = await fetchPaymentStatusService({
      paymentReference,
      guestAccessToken,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Development-Only Test Simulation Helper
 * Restricted to non-production environments with mandatory guest token authorization
 */
export async function postTestSimulate(req, res, next) {
  try {
    const { env } = await import('../config/env.js');
    if (env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test payment simulation is strictly prohibited in production.',
      });
    }

    const guestAccessToken = extractGuestToken(req);
    if (!guestAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing guest order access token. Provide in "x-guest-access-token" header.',
      });
    }

    const { orderReference, paymentReference, outcome = 'success' } = req.body;
    if (!orderReference || !paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Both orderReference and paymentReference are required.',
      });
    }

    const { prisma } = await import('../config/prisma.js');
    const { verifyGuestAccessToken } = await import('../utils/security.js');
    const { getPaymentProvider } = await import('../payments/paymentService.js');
    const crypto = (await import('crypto')).default;

    const order = await prisma.order.findUnique({ where: { orderReference } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (!verifyGuestAccessToken(guestAccessToken, order.guestAccessTokenHash)) {
      return res.status(401).json({ success: false, error: 'Unauthorized guest access.' });
    }

    const payment = await prisma.payment.findUnique({ where: { paymentReference } });
    if (!payment || payment.orderId !== order.id) {
      return res.status(400).json({ success: false, error: 'Payment attempt does not match order.' });
    }

    const provider = getPaymentProvider();

    if (outcome === 'failure') {
      return res.status(200).json({
        success: true,
        outcome: 'failure',
        orderReference,
        paymentReference,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: `test_pay_failed_${Date.now()}`,
        providerSignature: 'invalid_simulation_failure_signature_tampered',
      });
    }

    const providerPaymentId = `test_pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const providerSignature = provider.generateTestSignature({
      paymentReference: payment.paymentReference,
      providerOrderId: payment.providerOrderId,
      providerPaymentId,
      amountPaise: payment.amountPaise,
    });

    return res.status(200).json({
      success: true,
      outcome: 'success',
      orderReference,
      paymentReference,
      providerOrderId: payment.providerOrderId,
      providerPaymentId,
      providerSignature,
    });
  } catch (error) {
    next(error);
  }
}

