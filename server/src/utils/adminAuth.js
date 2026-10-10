import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 * Hash a password securely using PBKDF2 with SHA-512 and random salt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `pbkdf2:${DIGEST}:${ITERATIONS}:${salt}:${derivedKey}`;
}

/**
 * Verify a plaintext password against a stored PBKDF2 hash
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;

  const [_, digest, iterStr, salt, expectedKey] = parts;
  const iterations = parseInt(iterStr, 10);
  const actualKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, digest).toString('hex');

  const bufA = Buffer.from(actualKey, 'utf8');
  const bufB = Buffer.from(expectedKey, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a new random 256-bit admin session token
 */
export function generateAdminSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash admin session token for storage
 */
export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Helper to write append-only audit trail
 */
export async function logAdminAction({ adminId, adminEmail, action, entityType, entityId, details }) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: adminId || null,
        adminEmail: adminEmail || 'system@amoga.com',
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: details || {},
      },
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]: Failed to persist audit log entry:', err.message);
  }
}
