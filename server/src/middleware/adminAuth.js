import { prisma } from '../config/prisma.js';
import { hashSessionToken } from '../utils/adminAuth.js';

/**
 * Middleware to authenticate admin requests via Bearer token
 * @param {string[]} [allowedRoles] - Optional list of required roles. SUPER_ADMIN is always authorized.
 */
export function requireAdminAuth(allowedRoles = []) {
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
      const session = await prisma.adminSession.findUnique({
        where: { tokenHash },
        include: { admin: true },
      });

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

      // Check role permissions if specified
      if (allowedRoles.length > 0) {
        const userRole = session.admin.role;
        const hasAccess = userRole === 'SUPER_ADMIN' || allowedRoles.includes(userRole);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'FORBIDDEN',
            message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          });
        }
      }

      // Attach admin to request
      req.admin = {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
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
