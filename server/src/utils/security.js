import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generate a public, non-sequential order reference
 * Format: AMOGA-ORD-[YEAR]-[TIMESTAMP36]-[RANDOM4]
 */
export function generateOrderReference() {
  const year = new Date().getFullYear();
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AMOGA-ORD-${year}-${timestampPart}-${randomPart}`;
}

/**
 * Generate an unguessable 256-bit cryptographically secure guest access token
 */
export function generateGuestAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash guest access token with secret salt before storing in PostgreSQL
 */
export function hashGuestAccessToken(token) {
  if (!token || typeof token !== 'string') return null;
  return crypto
    .createHmac('sha256', env.GUEST_ORDER_TOKEN_SECRET)
    .update(token.trim())
    .digest('hex');
}

/**
 * Timing-safe token verification against stored hash
 * Prevents timing attacks and handles length mismatches safely
 */
export function verifyGuestAccessToken(token, storedHash) {
  if (!token || !storedHash || typeof token !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const computedHash = hashGuestAccessToken(token);
  if (!computedHash) return false;

  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');

  // Prevent timing attacks while safely handling mismatched lengths
  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a deterministic SHA-256 fingerprint of order creation request parameters
 * Used to verify whether repeated idempotency keys contain identical payloads
 */
export function computeOrderFingerprint(items, customer) {
  const canonical = {
    items: items
      .map((i) => ({
        p: String(i.productId || ''),
        v: String(i.variantId || ''),
        q: Number(i.quantity || 0),
      }))
      .sort((a, b) => a.p.localeCompare(b.p) || a.v.localeCompare(b.v)),
    customer: {
      name: (customer.fullName || '').trim().toLowerCase(),
      email: (customer.email || '').trim().toLowerCase(),
      phone: (customer.phone || '').replace(/[\s-]/g, ''),
      pin: (customer.pincode || '').trim(),
    },
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
