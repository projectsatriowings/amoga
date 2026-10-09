import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  orderReference: z
    .string()
    .min(5, 'Order reference is required.')
    .regex(/^AMOGA-(ORD|DEMO)-[A-Z0-9-]+$/i, 'Invalid order reference format.'),
  idempotencyKey: z.string().max(128).optional(),
});

export const verifyPaymentCallbackSchema = z.object({
  orderReference: z
    .string()
    .min(5, 'Order reference is required.')
    .regex(/^AMOGA-(ORD|DEMO)-[A-Z0-9-]+$/i, 'Invalid order reference format.'),
  paymentReference: z
    .string()
    .min(5, 'Payment reference is required.')
    .regex(/^AMOGA-PAY-[A-Z0-9-]+$/i, 'Invalid payment reference format.'),
  providerOrderId: z.string().optional(),
  providerPaymentId: z.string().min(3, 'Provider payment ID is required.'),
  providerSignature: z.string().min(10, 'Provider signature is required.'),
});
