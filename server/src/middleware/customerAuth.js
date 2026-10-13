import { prisma } from '../config/prisma.js';
import { hashCustomerSessionToken } from '../utils/customerAuth.js';

/**
 * Middleware to require authenticated customer session
 */
export async function requireCustomerAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.headers['x-customer-token']) {
      token = String(req.headers['x-customer-token']).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Customer authentication token required. Please sign in to your Amoga account.',
      });
    }

    const tokenHash = hashCustomerSessionToken(token);
    const session = await prisma.customerSession.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_SESSION',
        message: 'Session token is invalid or expired. Please sign in again.',
      });
    }

    if (new Date() > new Date(session.expiresAt)) {
      prisma.customerSession.delete({ where: { id: session.id } }).catch(() => {});
      return res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Your customer session has expired. Please sign in again.',
      });
    }

    if (!session.customer || !session.customer.isActive) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DEACTIVATED',
        message: 'Customer account is deactivated. Please contact concierge support.',
      });
    }

    req.customer = session.customer;
    req.customerId = session.customer.id;
    req.customerSessionId = session.id;
    next();
  } catch (err) {
    console.error('[CUSTOMER AUTH MIDDLEWARE ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to authenticate customer session',
    });
  }
}

/**
 * Middleware to optionally resolve customer if token present
 */
export async function optionalCustomerAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.headers['x-customer-token']) {
      token = String(req.headers['x-customer-token']).trim();
    }

    if (!token) {
      req.customer = null;
      req.customerId = null;
      return next();
    }

    const tokenHash = hashCustomerSessionToken(token);
    const session = await prisma.customerSession.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (session && new Date() <= new Date(session.expiresAt) && session.customer && session.customer.isActive) {
      req.customer = session.customer;
      req.customerId = session.customer.id;
      req.customerSessionId = session.id;
    } else {
      req.customer = null;
      req.customerId = null;
    }
    next();
  } catch (err) {
    req.customer = null;
    req.customerId = null;
    next();
  }
}
