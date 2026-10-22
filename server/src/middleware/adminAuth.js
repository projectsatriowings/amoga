import { prisma } from '../config/prisma.js';
import { hashSessionToken } from '../utils/adminAuth.js';

/**
 * Standard roles permitted in the Main Administrative Atelier.
 * Stall-only roles (STALL_MANAGER, STALL_CASHIER) are strictly prohibited from general admin.
 */
export const ADMIN_PANEL_ROLES = [
  'SUPER_ADMIN',
  'CATALOGUE_MANAGER',
  'ORDER_MANAGER',
  'CONTENT_MANAGER',
];

/**
 * Roles permitted to operate the Stall Point-of-Sale Register and Stall features.
 */
export const STALL_ROLES = [
  'SUPER_ADMIN',
  'STALL_MANAGER',
  'STALL_CASHIER',
];

// High-performance in-memory cache for validated admin sessions
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 20 * 1000; // 20 seconds TTL

export function invalidateSessionCache(tokenHash = null) {
  if (tokenHash) {
    sessionCache.delete(tokenHash);
  } else {
    sessionCache.clear();
  }
}

/**
 * Middleware to authenticate admin requests via Bearer token.
 * Defaults to ADMIN_PANEL_ROLES so that stall-only roles cannot access admin panel endpoints.
 * @param {string[]} [allowedRoles] - Optional list of required roles. SUPER_ADMIN is always authorized.
 */
export function requireAdminAuth(allowedRoles = []) {
  const targetRoles = (Array.isArray(allowedRoles) && allowedRoles.length > 0)
    ? allowedRoles
    : ADMIN_PANEL_ROLES;

  return async (req, res, next) => {
    try {
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (req.headers['x-admin-token']) {
        token = String(req.headers['x-admin-token']).trim();
      }

      if (!token) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Admin authorization token required',
        });
      }

      const tokenHash = hashSessionToken(token);
      let session = null;
      const cached = sessionCache.get(tokenHash);
      const now = Date.now();

      if (cached && (now - cached.timestamp < SESSION_CACHE_TTL_MS)) {
        session = cached.session;
      } else {
        session = await prisma.adminSession.findUnique({
          where: { tokenHash },
          include: { admin: true },
        });
        if (session) {
          sessionCache.set(tokenHash, { session, timestamp: now });
        }
      }

      if (!session) {
        return res.status(401).json({
          error: 'INVALID_SESSION',
          message: 'Session token is invalid or expired',
        });
      }

      if (new Date() > new Date(session.expiresAt)) {
        // Asynchronously clean up expired session
        prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
        return res.status(401).json({
          error: 'SESSION_EXPIRED',
          message: 'Admin session has expired. Please log in again.',
        });
      }

      if (!session.admin || !session.admin.isActive) {
        return res.status(403).json({
          error: 'ACCOUNT_DEACTIVATED',
          message: 'Admin account has been deactivated',
        });
      }

      // Check role permissions against target roles
      const userRole = session.admin.role;
      const hasAccess = userRole === 'SUPER_ADMIN' || targetRoles.includes(userRole);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: `Access denied. Endpoint requires one of the following roles: ${targetRoles.join(', ')}`,
        });
      }

      // Attach admin to request
      req.admin = {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
        assignedLocationIds: session.admin.assignedLocationIds || null,
      };
      req.adminSessionId = session.id;

      next();
    } catch (err) {
      console.error('[ADMIN AUTH ERROR]:', err);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify admin credentials',
      });
    }
  };
}

/**
 * Dedicated Stall Authentication & Location-authorization middleware.
 * Authenticates stall staff (or Super Admin) and validates stall location permissions.
 * @param {string[]} [allowedRoles] - Optional allowed stall roles (default: STALL_ROLES)
 */
export function requireStallAuth(allowedRoles = STALL_ROLES) {
  return async (req, res, next) => {
    try {
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (req.headers['x-stall-token']) {
        token = String(req.headers['x-stall-token']).trim();
      } else if (req.headers['x-admin-token']) {
        token = String(req.headers['x-admin-token']).trim();
      }

      if (!token) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Stall staff authorization token required. Please sign in at /stall/login',
        });
      }

      const tokenHash = hashSessionToken(token);
      const session = await prisma.adminSession.findUnique({
        where: { tokenHash },
        include: { admin: true },
      });

      if (!session) {
        return res.status(401).json({
          error: 'INVALID_SESSION',
          message: 'Stall session is invalid or has expired',
        });
      }

      if (new Date() > new Date(session.expiresAt)) {
        prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
        return res.status(401).json({
          error: 'SESSION_EXPIRED',
          message: 'Stall staff session has expired. Please sign in again at /stall/login',
        });
      }

      if (!session.admin || !session.admin.isActive) {
        return res.status(403).json({
          error: 'ACCOUNT_DEACTIVATED',
          message: 'Staff account has been deactivated. Please contact an administrator.',
        });
      }

      const userRole = session.admin.role;
      const isRoleAllowed = userRole === 'SUPER_ADMIN' || allowedRoles.includes(userRole);
      if (!isRoleAllowed) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: `Stall action requires one of the following roles: ${allowedRoles.join(', ')}`,
        });
      }

      // Parse assigned location IDs safely
      let assignedLocations = [];
      if (Array.isArray(session.admin.assignedLocationIds)) {
        assignedLocations = session.admin.assignedLocationIds;
      } else if (typeof session.admin.assignedLocationIds === 'string') {
        try {
          const parsed = JSON.parse(session.admin.assignedLocationIds);
          if (Array.isArray(parsed)) assignedLocations = parsed;
        } catch (_) {}
      }

      // Check stall location permission if a location was requested
      const requestedLocationId = req.query.stockLocationId || req.body.stockLocationId || null;
      if (requestedLocationId && requestedLocationId !== 'all') {
        if (userRole !== 'SUPER_ADMIN' && assignedLocations.length > 0) {
          if (!assignedLocations.includes(requestedLocationId)) {
            return res.status(403).json({
              error: 'FORBIDDEN_LOCATION',
              message: 'Staff member is not authorized to access or bill for this stall location.',
            });
          }
        }
      }

      req.admin = {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
        assignedLocationIds: assignedLocations,
      };
      req.adminSessionId = session.id;

      next();
    } catch (err) {
      console.error('[STALL AUTH ERROR]:', err);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify stall staff credentials',
      });
    }
  };
}
