import { prisma } from '../config/prisma.js';
import {
  verifyPassword,
  generateAdminSessionToken,
  hashSessionToken,
  logAdminAction,
} from '../utils/adminAuth.js';
import { STALL_ROLES } from '../middleware/adminAuth.js';

// Session duration for stall POS terminal: 24 hours (end-of-day register cycle)
const STALL_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Dedicated Stall Staff Authentication Controller
 */
export async function loginStallStaff(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Invalid email or password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    // Generic failure response prevents account enumeration
    if (!admin) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        error: 'ACCOUNT_DEACTIVATED',
        message: 'This staff account has been deactivated. Contact an administrator.',
      });
    }

    // Role check: Only STALL_MANAGER, STALL_CASHIER, or SUPER_ADMIN
    if (!STALL_ROLES.includes(admin.role)) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isMatch = verifyPassword(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Generate secure session
    const rawToken = generateAdminSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + STALL_SESSION_DURATION_MS);

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    // Record last login timestamp
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'STALL_STAFF_LOGIN',
      entityType: 'AdminUser',
      entityId: admin.id,
      details: {
        role: admin.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    let assignedLocations = [];
    if (Array.isArray(admin.assignedLocationIds)) {
      assignedLocations = admin.assignedLocationIds;
    } else if (typeof admin.assignedLocationIds === 'string') {
      try {
        const parsed = JSON.parse(admin.assignedLocationIds);
        if (Array.isArray(parsed)) assignedLocations = parsed;
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      token: rawToken,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        assignedLocationIds: assignedLocations,
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[STALL LOGIN ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process stall staff login',
    });
  }
}

export async function getStallProfile(req, res) {
  try {
    return res.status(200).json({
      success: true,
      user: req.admin,
    });
  } catch (err) {
    console.error('[STALL PROFILE ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve stall profile',
    });
  }
}

export async function logoutStallStaff(req, res) {
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
        action: 'STALL_STAFF_LOGOUT',
        entityType: 'AdminUser',
        entityId: req.admin.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stall register session terminated successfully',
    });
  } catch (err) {
    console.error('[STALL LOGOUT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to log out of stall session',
    });
  }
}

/**
 * Self-service change password for authenticated stall staff member
 */
export async function changePasswordStallStaff(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    const { changePasswordSelfService } = await import('../services/passwordResetService.js');
    const result = await changePasswordSelfService({
      userId: req.admin.id,
      accountType: 'STAFF',
      currentPassword,
      newPassword,
      confirmPassword,
      currentSessionId: req.adminSessionId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[STALL CHANGE PASSWORD ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to change stall staff password',
    });
  }
}

/**
 * Verify stall staff reset token validity
 */
export async function verifyStallResetToken(req, res) {
  try {
    const { token } = req.query || {};
    const { validatePasswordResetToken } = await import('../services/passwordResetService.js');
    const result = await validatePasswordResetToken(token, 'STAFF');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      email: result.email,
      name: result.adminUser?.name,
      role: result.adminUser?.role,
    });
  } catch (err) {
    console.error('[VERIFY STALL RESET TOKEN ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to verify reset link',
    });
  }
}

/**
 * Reset stall staff password using secure single-use token
 */
export async function resetPasswordStallStaff(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body || {};
    const { consumePasswordResetToken } = await import('../services/passwordResetService.js');

    const result = await consumePasswordResetToken({
      rawToken: token,
      newPassword,
      confirmPassword,
      expectedAccountType: 'STAFF',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[RESET STALL PASSWORD ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to reset staff password',
    });
  }
}
