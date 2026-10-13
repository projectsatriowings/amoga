import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product identifier is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity cannot exceed 50 per item'),
});

export const validateCartBodySchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty. Please add items to proceed.'),
});

export const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'),
  addressLine1: z.string().trim().min(5, 'Address line 1 must be at least 5 characters').max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian postal code'),
  instructions: z.string().trim().max(500).optional().nullable(),
});

export const createOrderBodySchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Order must contain at least one item'),
  customer: customerDetailsSchema,
  idempotencyKey: z.string().max(100).optional().nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
});
