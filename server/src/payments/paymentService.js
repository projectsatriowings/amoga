import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { verifyGuestAccessToken } from '../utils/security.js';
import { TestPaymentProvider } from './providers/testProvider.js';
import { RazorpayPaymentProvider } from './providers/razorpayProvider.js';
import { commitReservation, releaseReservation } from '../services/inventoryService.js';

/**
 * AMOGA E-COMMERCE — PAYMENT SERVICE ORCHESTRATOR
 * 
 * Manages provider resolution, payment attempt lifecycle, state transitions,
 * and database transactions with authoritative integer-paise financial precision.
 */

// Active Provider Registry
let activeProvider = null;

export function getPaymentProvider() {
  if (!activeProvider) {
    if (env.PAYMENT_PROVIDER === 'test') {
      activeProvider = new TestPaymentProvider();
    } else if (env.PAYMENT_PROVIDER === 'razorpay') {
      activeProvider = new RazorpayPaymentProvider();
    } else {
      throw new Error(`Unsupported PAYMENT_PROVIDER: "${env.PAYMENT_PROVIDER}".`);
    }
  }
  return activeProvider;
}

export function setPaymentProviderForTesting(provider) {
  activeProvider = provider;
}

/**
 * Generate a public, non-sequential payment reference
 * Format: AMOGA-PAY-[YEAR]-[TIMESTAMP36]-[RANDOM4]
 */
export function generatePaymentReference() {
  const year = new Date().getFullYear();
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AMOGA-PAY-${year}-${timestampPart}-${randomPart}`;
}

/**
 * Creates or reuses a payment order attempt for an eligible order
 */
export async function createPaymentOrder({ orderReference, guestAccessToken, idempotencyKey = null }) {
  const provider = getPaymentProvider();

  // 1. Fetch order from PostgreSQL
  const order = await prisma.order.findUnique({
    where: { orderReference },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!order) {
    const error = new Error(`Order with reference "${orderReference}" not found.`);
    error.status = 404;
    throw error;
  }

  // 2. Authorize guest access token
  const isAuthorized = verifyGuestAccessToken(guestAccessToken, order.guestAccessTokenHash);
  if (!isAuthorized) {
    const error = new Error('Unauthorized: A valid guest order access token is required.');
    error.status = 401;
    throw error;
  }

  // 3. Confirm order eligibility for payment
  if (order.status === 'CANCELLED') {
    const error = new Error('This order has been cancelled and cannot be paid.');
    error.status = 400;
    throw error;
  }

  if (order.paymentStatus === 'SUCCEEDED') {
    const error = new Error('This order has already been successfully paid.');
    error.status = 400;
    throw error;
  }

  // 4. Resolve authoritative amount in integer paise using exact Decimal arithmetic
  const authoritativeAmountPaise = Number(order.totalAmount.mul(100).toFixed(0));
  const authoritativeAmountRupees = Number(order.totalAmount.toFixed(2));

  if (!Number.isSafeInteger(authoritativeAmountPaise) || authoritativeAmountPaise <= 0) {
    const error = new Error('Cannot process payment for an order with zero or invalid payable balance.');
    error.status = 422;
    throw error;
  }

  if (authoritativeAmountPaise > 1000000000) {
    const error = new Error('Payable amount exceeds maximum permissible single transaction limit.');
    error.status = 422;
    throw error;
  }

  // 5. Strict Idempotency Check across payment attempts
  if (idempotencyKey) {
    const existingKeyPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });

    if (existingKeyPayment) {
      // If used for the SAME order -> return existing payment attempt idempotently
      if (existingKeyPayment.orderId === order.id) {
        return {
          success: true,
          isDuplicate: true,
          paymentReference: existingKeyPayment.paymentReference,
          orderReference: order.orderReference,
          provider: existingKeyPayment.provider,
          providerOrderId: existingKeyPayment.providerOrderId,
          amountPaise: existingKeyPayment.amountPaise,
          amount: Number(existingKeyPayment.amount),
          currency: existingKeyPayment.currency,
          status: existingKeyPayment.status,
          clientPayload: {
            mode: env.PAYMENT_MODE,
            provider: existingKeyPayment.provider,
            orderReference: order.orderReference,
            paymentReference: existingKeyPayment.paymentReference,
            providerOrderId: existingKeyPayment.providerOrderId,
            amountPaise: existingKeyPayment.amountPaise,
            currency: existingKeyPayment.currency,
          },
        };
      }

      // If used for a DIFFERENT order -> reject with HTTP 409 Conflict!
      const conflictError = new Error(
        `Idempotency key "${idempotencyKey}" has already been used for a different order payment attempt.`
      );
      conflictError.status = 409;
      throw conflictError;
    }
  }

  // 6. Check for active reusable payment attempt on this order
  const existingPendingPayment = order.payments.find(
    (p) =>
      (p.status === 'PENDING' || p.status === 'CREATED') &&
      (!idempotencyKey || !p.idempotencyKey || p.idempotencyKey === idempotencyKey)
  );

  let paymentRecord;
  let providerOrderId;
  let clientPayload;

  if (existingPendingPayment) {
    // Reuse existing attempt and bind idempotencyKey if previously unset
    paymentRecord = existingPendingPayment;
    if (idempotencyKey && !existingPendingPayment.idempotencyKey) {
      paymentRecord = await prisma.payment.update({
        where: { id: existingPendingPayment.id },
        data: { idempotencyKey },
      });
    }
    providerOrderId = existingPendingPayment.providerOrderId;
    const providerResult = await provider.createPaymentOrder({
      orderReference: order.orderReference,
      paymentReference: existingPendingPayment.paymentReference,
      amountPaise: authoritativeAmountPaise,
      currency: order.currency,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
    });
    clientPayload = providerResult.clientPayload;
  } else {
    // Create fresh payment attempt
    const paymentReference = generatePaymentReference();

    const providerResult = await provider.createPaymentOrder({
      orderReference: order.orderReference,
      paymentReference,
      amountPaise: authoritativeAmountPaise,
      currency: order.currency,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
    });

    providerOrderId = providerResult.providerOrderId;
    clientPayload = providerResult.clientPayload;

    try {
      paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentReference,
          idempotencyKey: idempotencyKey || null,
          provider: provider.getProviderName(),
          providerOrderId,
          amountPaise: authoritativeAmountPaise,
          amount: authoritativeAmountRupees,
          currency: order.currency,
          status: 'PENDING',
          metadata: {
            customerName: order.customerName,
            customerEmail: order.customerEmail,
          },
        },
      });
    } catch (createError) {
      // Handle concurrent creation with same idempotency key gracefully
      if (createError.code === 'P2002' && idempotencyKey) {
        const concurrentPayment = await prisma.payment.findUnique({
          where: { idempotencyKey },
        });
        if (concurrentPayment && concurrentPayment.orderId === order.id) {
          paymentRecord = concurrentPayment;
        } else {
          throw createError;
        }
      } else {
        throw createError;
      }
    }
  }

  return {
    success: true,
    paymentReference: paymentRecord.paymentReference,
    orderReference: order.orderReference,
    provider: paymentRecord.provider,
    providerOrderId,
    amountPaise: authoritativeAmountPaise,
    amount: authoritativeAmountRupees,
    currency: order.currency,
    status: paymentRecord.status,
    clientPayload,
  };
}

/**
 * Server-side verification of payment callback signatures
 */
export async function verifyPaymentCallback({
  orderReference,
  paymentReference,
  providerOrderId,
  providerPaymentId,
  providerSignature,
  guestAccessToken,
}) {
  const provider = getPaymentProvider();

  // 1. Fetch order and payment from PostgreSQL
  const order = await prisma.order.findUnique({
    where: { orderReference },
  });

  if (!order) {
    const error = new Error(`Order with reference "${orderReference}" not found.`);
    error.status = 404;
    throw error;
  }

  // 2. Authorize guest access token strictly against referenced order
  const isAuthorized = verifyGuestAccessToken(guestAccessToken, order.guestAccessTokenHash);
  if (!isAuthorized) {
    const error = new Error('Unauthorized: A valid guest order access token is required.');
    error.status = 401;
    throw error;
  }

  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
  });

  if (!payment) {
    const error = new Error(`Payment with reference "${paymentReference}" not found.`);
    error.status = 404;
    throw error;
  }

  if (payment.orderId !== order.id) {
    const error = new Error('Payment reference does not match the referenced order.');
    error.status = 400;
    throw error;
  }

  // 3. Idempotent check: if already SUCCEEDED, return immediately without duplicate transitions
  if (payment.status === 'SUCCEEDED') {
    return {
      success: true,
      verified: true,
      isDuplicate: true,
      paymentReference: payment.paymentReference,
      orderReference: order.orderReference,
      status: 'SUCCEEDED',
      amount: Number(payment.amount.toFixed(2)),
      currency: payment.currency,
      verifiedAt: payment.verifiedAt,
    };
  }

  // Terminal state check: cannot verify a cancelled or expired attempt
  if (payment.status === 'CANCELLED' || payment.status === 'EXPIRED') {
    const error = new Error(`Cannot verify a payment attempt in ${payment.status} state. Please initiate a new payment attempt.`);
    error.status = 400;
    throw error;
  }

  // 4. Verify signature through provider adapter
  const verification = await provider.verifyPaymentCallback({
    paymentReference: payment.paymentReference,
    providerOrderId: providerOrderId || payment.providerOrderId,
    providerPaymentId,
    providerSignature,
    expectedAmountPaise: payment.amountPaise,
    expectedCurrency: payment.currency,
  });

  // CRITICAL SECURITY HARDENING:
  // An invalid, missing, or malformed callback signature MUST NOT mark a legitimate
  // payment attempt as FAILED. The payment attempt remains unchanged (e.g. PENDING)
  // so an attacker cannot force-fail an in-flight payment attempt.
  if (!verification.verified) {
    const error = new Error(verification.error || 'Payment signature verification failed.');
    error.status = 400;
    throw error;
  }

  // 5. Commit state transition in an atomic transaction
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        providerPaymentId,
        providerOrderId: providerOrderId || payment.providerOrderId,
        verifiedAt: now,
      },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'SUCCEEDED',
      },
    });

    await tx.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: 'Payment authorized and verified. Order confirmed for atelier processing.',
        actor: 'System (Verified Payment)',
      },
    });

    // Commit inventory deduction exactly once
    await commitReservation({
      tx,
      orderId: order.id,
      orderReference: order.orderReference,
    });

    return { updatedPayment, updatedOrder };
  }, {
    maxWait: 20000,
    timeout: 30000,
  });

  return {
    success: true,
    verified: true,
    paymentReference: updated.updatedPayment.paymentReference,
    orderReference: updated.updatedOrder.orderReference,
    status: 'SUCCEEDED',
    amount: Number(updated.updatedPayment.amount.toFixed(2)),
    currency: updated.updatedPayment.currency,
    verifiedAt: updated.updatedPayment.verifiedAt,
  };
}

/**
 * Idempotent Webhook Event Processing
 */
export async function processWebhook({ rawBody, headers }) {
  const provider = getPaymentProvider();

  // 1. Verify webhook authenticity using adapter
  const isValid = provider.verifyWebhook({ rawBody, headers });
  if (!isValid) {
    const error = new Error('Invalid or unauthenticated webhook signature.');
    error.status = 401;
    throw error;
  }

  // 2. Parse canonical event structure
  const event = provider.parseVerifiedWebhookEvent({ rawBody, headers });

  // 3. Deduplicate using providerEventId in database
  const existingEvent = await prisma.paymentEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: provider.getProviderName(),
        providerEventId: event.eventId,
      },
    },
  });

  if (existingEvent) {
    return {
      received: true,
      duplicate: true,
      eventId: event.eventId,
      message: 'Event already processed idempotently.',
    };
  }

  // 4. Process event within transaction with concurrency protection
  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Record processed event
      await tx.paymentEvent.create({
        data: {
          provider: provider.getProviderName(),
          providerEventId: event.eventId,
          orderReference: event.orderReference || null,
          eventType: event.eventType,
          status: 'PROCESSED',
          payload: event.payload || {},
          processedAt: now,
        },
      });

      // Handle payment succeeded webhook event
      if (event.eventType === 'payment.succeeded' && event.paymentReference) {
        const payment = await tx.payment.findUnique({
          where: { paymentReference: event.paymentReference },
          include: { order: true },
        });

        if (payment && payment.status !== 'SUCCEEDED') {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              providerPaymentId: event.providerPaymentId || payment.providerPaymentId,
              verifiedAt: now,
            },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'SUCCEEDED',
            },
          });

          await tx.orderTrackingEvent.create({
            data: {
              orderId: payment.orderId,
              status: 'CONFIRMED',
              title: 'Order Confirmed',
              description: 'Payment captured via provider webhook. Order confirmed for atelier processing.',
              actor: 'System (Webhook)',
            },
          });

          // Commit inventory deduction exactly once upon verified payment
          await commitReservation({
            tx,
            orderId: payment.orderId,
            orderReference: payment.order.orderReference,
          });
        }
      }

      // Handle payment failed webhook event
      if (event.eventType === 'payment.failed' && event.paymentReference) {
        const payment = await tx.payment.findUnique({
          where: { paymentReference: event.paymentReference },
          include: { order: true },
        });

        // Terminal state protection:
        // 1. Never downgrade SUCCEEDED payment.
        // 2. Never mark payment FAILED if order was already confirmed/succeeded.
        if (payment && payment.status !== 'SUCCEEDED' && payment.order?.paymentStatus !== 'SUCCEEDED') {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureCode: 'WEBHOOK_FAILURE',
              failureMessage: 'Payment marked as failed by provider webhook event.',
            },
          });

          // Release active inventory reservations upon confirmed payment failure
          if (payment.orderId && payment.order?.orderReference) {
            await releaseReservation({
              tx,
              orderId: payment.orderId,
              orderReference: payment.order.orderReference,
              reason: 'Payment failed via webhook',
            });
          }
        }
      }
    }, {
      maxWait: 20000,
      timeout: 30000,
    });
  } catch (txError) {
    // Handle concurrent duplicate webhook delivery race condition safely
    if (txError.code === 'P2002') {
      return {
        received: true,
        duplicate: true,
        eventId: event.eventId,
        message: 'Concurrent duplicate webhook event handled idempotently.',
      };
    }
    throw txError;
  }

  return {
    received: true,
    eventId: event.eventId,
    eventType: event.eventType,
  };
}

/**
 * Get protected payment status snapshot
 */
export async function getPaymentStatus({ paymentReference, guestAccessToken }) {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { order: true },
  });

  if (!payment) {
    const error = new Error(`Payment with reference "${paymentReference}" not found.`);
    error.status = 404;
    throw error;
  }

  const isAuthorized = verifyGuestAccessToken(guestAccessToken, payment.order.guestAccessTokenHash);
  if (!isAuthorized) {
    const error = new Error('Unauthorized: A valid guest order access token is required.');
    error.status = 401;
    throw error;
  }

  return {
    paymentReference: payment.paymentReference,
    orderReference: payment.order.orderReference,
    provider: payment.provider,
    status: payment.status,
    amount: Number(payment.amount.toFixed(2)),
    currency: payment.currency,
    verifiedAt: payment.verifiedAt,
    createdAt: payment.createdAt,
  };
}
