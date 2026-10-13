import crypto from 'crypto';
import { hashPassword, verifyPassword } from './adminAuth.js';

/**
 * Generate random 256-bit customer session token (64 hex characters)
 */
export function generateCustomerSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash customer session token with SHA-256 for secure DB persistence
 */
export function hashCustomerSessionToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export { hashPassword, verifyPassword };
