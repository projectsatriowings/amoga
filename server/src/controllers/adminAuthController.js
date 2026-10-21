import { prisma } from '../config/prisma.js';
import {
  verifyPassword,
  generateAdminSessionToken,
  hashSessionToken,
  logAdminAction,
} from '../utils/adminAuth.js';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        error: 'ACCOUNT_DEACTIVATED',
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    // Stall-only staff must use dedicated /stall/login
    if (admin.role === 'STALL_MANAGER' || admin.role === 'STALL_CASHIER') {
      return res.status(403).json({
        error: 'STALL_STAFF_RESTRICTED',
        message: 'Stall staff accounts must sign in via the dedicated Stall POS portal at /stall/login',
      });
    }

    const isMatch = verifyPassword(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Generate session token
    const rawToken = generateAdminSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN',
      entityType: 'AdminUser',
      entityId: admin.id,
      details: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    return res.status(200).json({
      success: true,
      token: rawToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[ADMIN LOGIN ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process admin login',
    });
  }
}

export async function logoutAdmin(req, res) {
  try {
    if (req.adminSessionId) {
      await prisma.adminSession.delete({
        where: { id: req.adminSessionId },
      }).catch(() => {});
    }

    if (req.admin) {
      await logAdminAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ADMIN_LOGOUT',
        entityType: 'AdminUser',
        entityId: req.admin.id,
      });
    }

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[ADMIN LOGOUT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process logout',
    });
  }
}

export async function getAdminProfile(req, res) {
  return res.status(200).json({
    admin: req.admin,
  });
}
