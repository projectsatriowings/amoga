import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  verifyPassword,
  hashPassword,
  generateAdminSessionToken,
  hashSessionToken,
  logAdminAction,
} from '../utils/adminAuth.js';
import { sendAdminPasswordResetOtp } from '../services/emailService.js';

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

/**
 * Request a 6-digit OTP for admin password reset (sent to registered Gmail / SMTP)
 */
export async function requestPasswordResetOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Valid staff email is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin || !admin.isActive) {
      // Return 200 with generic message to avoid email enumeration
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a 6-digit verification code has been dispatched.',
      });
    }

    // Generate 6-digit cryptographic numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs for this email
    await prisma.$executeRawUnsafe(
      `UPDATE admin_password_resets SET used = true WHERE email = $1 AND used = false`,
      cleanEmail
    );

    // Persist new OTP record
    const resetId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_password_resets (id, email, "otpHash", "expiresAt", used, "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())`,
      resetId,
      cleanEmail,
      otpHash,
      expiresAt
    );

    // Dispatch email or log to terminal in dev mode
    const emailResult = await sendAdminPasswordResetOtp({
      to: cleanEmail,
      otp,
      adminName: admin.name,
    });

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_PASSWORD_RESET_OTP_REQUESTED',
      entityType: 'AdminUser',
      entityId: admin.id,
      details: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    return res.status(200).json({
      success: true,
      message: 'A 6-digit verification code has been dispatched to your email (valid for 10 minutes).',
      ...(emailResult.devMode ? { devOtp: otp, isDevFallback: true } : {}),
    });
  } catch (err) {
    console.error('[PASSWORD RESET OTP ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process password reset request',
    });
  }
}

/**
 * Verify OTP and update admin password
 */
export async function verifyAndResetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Email, OTP, and new password are required',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'New password must be at least 8 characters long',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const otpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    // Retrieve active matching OTP
    const resets = await prisma.$queryRawUnsafe(
      `SELECT * FROM admin_password_resets
       WHERE email = $1 AND used = false AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      cleanEmail
    );

    if (!resets || resets.length === 0) {
      return res.status(400).json({
        error: 'INVALID_OR_EXPIRED_OTP',
        message: 'Verification code is invalid or has expired. Please request a new code.',
      });
    }

    const activeReset = resets[0];
    if (activeReset.otpHash !== otpHash) {
      return res.status(400).json({
        error: 'INVALID_OR_EXPIRED_OTP',
        message: 'Verification code is incorrect. Please double check and retry.',
      });
    }

    // Verify admin user still exists and is active
    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin || !admin.isActive) {
      return res.status(400).json({
        error: 'ACCOUNT_INVALID',
        message: 'Account not found or deactivated.',
      });
    }

    // Mark reset code as used
    await prisma.$executeRawUnsafe(
      `UPDATE admin_password_resets SET used = true WHERE id = $1`,
      activeReset.id
    );

    // Hash new password using PBKDF2 with SHA-512 and random salt
    const newPasswordHash = hashPassword(newPassword);

    // Update password in PostgreSQL
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all existing sessions for this administrator
    await prisma.adminSession.deleteMany({
      where: { adminId: admin.id },
    }).catch(() => {});

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_PASSWORD_RESET_COMPLETED',
      entityType: 'AdminUser',
      entityId: admin.id,
      details: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    return res.status(200).json({
      success: true,
      message: 'Master Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (err) {
    console.error('[PASSWORD RESET VERIFY ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to complete password reset',
    });
  }
}
