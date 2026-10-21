import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { hashPassword, verifyPassword, logAdminAction } from '../utils/adminAuth.js';

// Expiry period for reset tokens: 30 minutes
export const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Checks if a real or mock email provider is configured in environment
 */
export function isEmailDeliveryConfigured() {
  return Boolean(
    process.env.SMTP_HOST ||
    process.env.SENDGRID_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.MOCK_EMAIL_DELIVERY === 'true'
  );
}

/**
 * Resolves the canonical frontend URL from environment (strictly avoids untrusted host headers)
 */
export function getCanonicalFrontendUrl() {
  return process.env.FRONTEND_URL || env.FRONTEND_ORIGIN || 'http://localhost:5173';
}

/**
 * Generate SHA-256 hash of a raw reset token
 */
export function hashResetToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Issue a cryptographically secure, single-use, expiring reset token
 */
export async function createPasswordResetToken({
  email,
  accountType, // 'CUSTOMER' | 'STAFF'
  customerId = null,
  adminUserId = null,
  createdBy = 'self',
}) {
  const cleanEmail = email.trim().toLowerCase();

  // Invalidate any active, unconsumed tokens for this email and account type
  await prisma.passwordResetToken.updateMany({
    where: {
      email: cleanEmail,
      accountType,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(), // Mark expired/superseded
    },
  }).catch((err) => console.warn('[RESET TOKEN] Failed to revoke prior tokens:', err.message));

  // Generate 256-bit cryptographically secure token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  const record = await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      accountType,
      email: cleanEmail,
      customerId,
      adminUserId,
      expiresAt,
      createdBy,
    },
  });

  const baseUrl = getCanonicalFrontendUrl();
  const resetPath = accountType === 'STAFF' ? '/stall/reset-password' : '/reset-password';
  const resetUrl = `${baseUrl}${resetPath}?token=${rawToken}`;

  return {
    tokenId: record.id,
    rawToken,
    tokenHash,
    expiresAt,
    resetUrl,
  };
}

/**
 * Generates an elegant, luxury branded HTML email template for password reset
 */
export function buildResetEmailHtml({ recipientName, resetUrl, accountType }) {
  const isStaff = accountType === 'STAFF';
  const roleTitle = isStaff ? 'Stall Staff Workspace' : 'Amoga Atelier Account';
  const actionLead = isStaff
    ? 'An administrator or authorized operator has requested a secure password reset for your Amoga Stall Staff credentials.'
    : 'We received a request to reset the password associated with your Amoga customer account.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — Amoga</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin: 0; padding: 24px; color: #292820; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E5E0D5; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    .header { background: #201916; padding: 32px 24px; text-align: center; }
    .brand-title { margin: 0; font-family: Georgia, serif; color: #E8E2D8; font-size: 26px; letter-spacing: 3px; font-weight: normal; }
    .brand-sub { color: #B08A4D; font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; font-family: monospace; display: block; margin-top: 8px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #1A1817; margin-bottom: 14px; }
    .lead { font-size: 14px; line-height: 1.6; color: #554F45; margin-bottom: 28px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #722F37; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
    .expiry { font-size: 12px; color: #8A8478; text-align: center; margin-top: 10px; font-family: monospace; }
    .security-note { padding: 16px; background: #FAF8F5; border-left: 3px solid #B08A4D; border-radius: 6px; font-size: 12px; color: #6E685E; line-height: 1.55; margin-top: 28px; }
    .url-fallback { margin-top: 24px; padding-top: 20px; border-top: 1px dashed #E5E0D5; font-size: 11px; color: #8A8478; word-break: break-all; }
    .url-link { color: #722F37; text-decoration: underline; }
    .footer { border-top: 1px solid #EFEAE1; padding: 22px 32px; font-size: 11px; color: #A89F93; text-align: center; background: #FAF8F5; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">AMOGA</h1>
      <span class="brand-sub">Luxury Crafts & Provisions</span>
    </div>
    <div class="content">
      <div class="greeting">Hello ${recipientName || 'Valued Member'},</div>
      <div class="lead">
        ${actionLead} Click the secure link below to choose your new password for <strong>${roleTitle}</strong>:
      </div>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset My Password</a>
        <div class="expiry">Expires in 30 minutes • Strictly Single-Use</div>
      </div>
      <div class="security-note">
        <strong>Security Notice:</strong> If you did not request this password reset, no action is required. Your current password remains unchanged and completely secure.
      </div>
      <div class="url-fallback">
        If the button above does not work, copy and paste this direct link into your browser:<br>
        <a href="${resetUrl}" class="url-link">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Amoga Luxury Crafts & Provisions. All rights reserved.<br>
      High-Assurance Cryptographic Authentication Protection.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches reset email or truthful log if provider is missing
 */
export async function sendPasswordResetEmail(options = {}) {
  const email = options.email || options.recipientEmail || (typeof options === 'string' ? options : '');
  const name = options.name || options.recipientName || '';
  const resetUrl = options.resetUrl || (options.rawToken ? `${getCanonicalFrontendUrl()}${options.accountType === 'STAFF' ? '/stall/reset-password' : '/reset-password'}?token=${options.rawToken}` : '');
  const accountType = options.accountType || 'CUSTOMER';

  const cleanEmail = String(email || '').trim().toLowerCase();
  const displayName = name ? name.trim() : (accountType === 'STAFF' ? 'Stall Staff' : 'Valued Customer');
  const isConfigured = isEmailDeliveryConfigured();

  if (!isConfigured) {
    // Truthful operator feedback in server logs: never pretend delivery succeeded when no provider is set up
    console.error(`[PASSWORD RESET EMAIL NOT CONFIGURED]: Unable to deliver email to <${cleanEmail}> because no SMTP or email provider (SMTP_HOST, SENDGRID_API_KEY, RESEND_API_KEY, or MOCK_EMAIL_DELIVERY=true) is configured in environment.`);
    
    // In local development, log the link so developers and testers can verify the full workflow end-to-end
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_DEV_RESET_LINKS === 'true') {
      console.info(`[DEV RESET LINK for ${cleanEmail}]: ${resetUrl}`);
    }

    return {
      sent: false,
      delivered: false,
      configured: false,
      providerConfigured: false,
      error: 'NO_PROVIDER_CONFIGURED',
      message: 'No email service configured on server. Operator must configure SMTP or email provider.',
    };
  }

  const subject = accountType === 'STAFF'
    ? 'Amoga Stall Staff — Password Reset Request'
    : 'Reset your Amoga customer account password';

  const html = buildResetEmailHtml({
    recipientName: displayName,
    resetUrl,
    accountType,
  });

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || `"Amoga Atelier Concierge" <concierge@amoga.co.in>`;

  try {
    // 1. Mock delivery mode (used in tests or local dev with MOCK_EMAIL_DELIVERY=true)
    if (process.env.MOCK_EMAIL_DELIVERY === 'true') {
      console.info(`[MOCK EMAIL DELIVERED to ${cleanEmail}]: ${resetUrl}`);
      return {
        sent: true,
        delivered: true,
        configured: true,
        providerConfigured: true,
        provider: 'mock_test_provider',
        messageId: `mock_${Date.now()}_${cleanEmail}`,
      };
    }

    // 2. Resend API Integration (REST)
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || fromAddress,
          to: [cleanEmail],
          subject,
          html,
        }),
      });

      const resJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resJson.message || `Resend error code: ${res.status}`);
      }

      return {
        sent: true,
        delivered: true,
        configured: true,
        providerConfigured: true,
        provider: 'resend',
        messageId: resJson.id || `resend_${Date.now()}`,
      };
    }

    // 3. SendGrid API Integration (REST)
    if (process.env.SENDGRID_API_KEY) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanEmail, name: displayName }] }],
          from: { email: process.env.SENDGRID_FROM || 'concierge@amoga.co.in', name: 'Amoga Atelier' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`SendGrid API error ${res.status}: ${errorText}`);
      }

      return {
        sent: true,
        delivered: true,
        configured: true,
        providerConfigured: true,
        provider: 'sendgrid',
        messageId: `sendgrid_${Date.now()}`,
      };
    }

    // 4. SMTP via Nodemailer
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer');
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        html,
      });

      return {
        sent: true,
        delivered: true,
        configured: true,
        providerConfigured: true,
        provider: 'smtp',
        messageId: info.messageId || `smtp_${Date.now()}`,
      };
    }

    // Fallback if configured flag was true but no known provider matched
    return {
      sent: false,
      delivered: false,
      configured: false,
      providerConfigured: false,
      error: 'NO_MATCHING_PROVIDER',
      message: 'Email environment variables did not match a known provider.',
    };
  } catch (err) {
    console.error(`[PASSWORD RESET EMAIL DISPATCH FAILED for ${cleanEmail}]:`, err.message);
    return {
      sent: false,
      delivered: false,
      configured: true,
      providerConfigured: true,
      error: err.message,
    };
  }
}

/**
 * Validates a reset token: unconsumed, not expired, matching account type
 */
export async function validatePasswordResetToken(tokenOrObj, maybeExpectedAccountType = null) {
  let rawToken = tokenOrObj;
  let expectedAccountType = maybeExpectedAccountType;

  if (tokenOrObj && typeof tokenOrObj === 'object') {
    rawToken = tokenOrObj.rawToken || tokenOrObj.token;
    expectedAccountType = tokenOrObj.expectedAccountType || maybeExpectedAccountType;
  }

  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, error: 'TOKEN_REQUIRED', message: 'Password reset token is required.' };
  }

  const tokenHash = hashResetToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      customer: { select: { id: true, email: true, name: true, isActive: true } },
      adminUser: { select: { id: true, email: true, name: true, role: true, isActive: true } },
    },
  });

  if (!record) {
    return { valid: false, error: 'INVALID_TOKEN', message: 'This password reset link is invalid or has expired.' };
  }

  if (record.consumedAt) {
    return { valid: false, error: 'TOKEN_ALREADY_USED', message: 'This password reset link has already been used. Please request a new one.' };
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, error: 'TOKEN_EXPIRED', message: 'This password reset link has expired (valid for 30 minutes). Please request a new one.' };
  }

  if (expectedAccountType && record.accountType !== expectedAccountType) {
    return { valid: false, error: 'ACCOUNT_TYPE_MISMATCH', message: 'This reset token is not valid for this workspace.' };
  }

  // Account active checks
  if (record.accountType === 'CUSTOMER' && record.customer && !record.customer.isActive) {
    return { valid: false, error: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated.' };
  }

  if (record.accountType === 'STAFF' && record.adminUser && !record.adminUser.isActive) {
    return { valid: false, error: 'ACCOUNT_DEACTIVATED', message: 'This staff account has been deactivated.' };
  }

  return {
    valid: true,
    tokenRecord: record,
    email: record.email,
    accountType: record.accountType,
    customer: record.customer,
    adminUser: record.adminUser,
  };
}

/**
 * Consumes the reset token and safely applies new password
 */
export async function consumePasswordResetToken({
  rawToken,
  newPassword,
  confirmPassword,
  expectedAccountType = null,
}) {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return {
      success: false,
      error: 'WEAK_PASSWORD',
      message: 'New password must contain at least 6 characters.',
    };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return {
      success: false,
      error: 'PASSWORD_MISMATCH',
      message: 'New password and confirmation password do not match.',
    };
  }

  const validation = await validatePasswordResetToken(rawToken, expectedAccountType);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      message: validation.message,
    };
  }

  const { tokenRecord, accountType } = validation;
  const newPasswordHash = hashPassword(newPassword);
  const now = new Date();

  // Atomically update password, consume token, and invalidate active sessions
  await prisma.$transaction(async (tx) => {
    // 1. Mark token consumed
    await tx.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { consumedAt: now },
    });

    if (accountType === 'CUSTOMER' && tokenRecord.customerId) {
      // 2a. Update customer password
      await tx.customer.update({
        where: { id: tokenRecord.customerId },
        data: { passwordHash: newPasswordHash },
      });

      // 3a. Invalidate all active customer sessions
      await tx.customerSession.deleteMany({
        where: { customerId: tokenRecord.customerId },
      });
    } else if (accountType === 'STAFF' && tokenRecord.adminUserId) {
      // 2b. Update staff/admin user password
      await tx.adminUser.update({
        where: { id: tokenRecord.adminUserId },
        data: { passwordHash: newPasswordHash },
      });

      // 3b. Invalidate all active admin sessions for this user
      await tx.adminSession.deleteMany({
        where: { adminId: tokenRecord.adminUserId },
      });
    }
  });

  // Safe audit log without sensitive data
  if (accountType === 'STAFF') {
    await logAdminAction({
      adminId: tokenRecord.adminUserId,
      adminEmail: tokenRecord.email,
      action: 'STAFF_PASSWORD_RESET_COMPLETED',
      entityType: 'AdminUser',
      entityId: tokenRecord.adminUserId,
      status: 'SUCCESS',
      details: { email: tokenRecord.email, resetMethod: 'EMAIL_TOKEN' },
    }).catch(() => {});
  }

  return {
    success: true,
    message: 'Your password has been successfully reset. Please sign in with your new password.',
    accountType,
  };
}

/**
 * Self-service password change for authenticated users
 */
export async function changePasswordSelfService({
  userId,
  accountType, // 'CUSTOMER' | 'STAFF'
  currentPassword,
  newPassword,
  confirmPassword,
  currentSessionId = null,
}) {
  if (!currentPassword || typeof currentPassword !== 'string') {
    return { success: false, error: 'CURRENT_PASSWORD_REQUIRED', message: 'Current password is required.' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return { success: false, error: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters in length.' };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { success: false, error: 'PASSWORD_MISMATCH', message: 'New password and confirmation do not match.' };
  }

  if (accountType === 'STAFF') {
    const admin = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!admin) {
      return { success: false, error: 'USER_NOT_FOUND', message: 'Staff account not found.' };
    }

    const isMatch = verifyPassword(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'INVALID_CURRENT_PASSWORD', message: 'The current password you entered is incorrect.' };
    }

    const newHash = hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate other sessions (keep current if specified)
    if (currentSessionId) {
      await prisma.adminSession.deleteMany({
        where: { adminId: userId, id: { not: currentSessionId } },
      }).catch(() => {});
    }

    await logAdminAction({
      adminId: userId,
      adminEmail: admin.email,
      action: 'STAFF_PASSWORD_CHANGED_SELF',
      entityType: 'AdminUser',
      entityId: userId,
      status: 'SUCCESS',
      details: { email: admin.email },
    }).catch(() => {});

    return { success: true, message: 'Password changed successfully.' };
  } else {
    // Customer
    const customer = await prisma.customer.findUnique({ where: { id: userId } });
    if (!customer) {
      return { success: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer account not found.' };
    }

    const isMatch = verifyPassword(currentPassword, customer.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'INVALID_CURRENT_PASSWORD', message: 'The current password you entered is incorrect.' };
    }

    const newHash = hashPassword(newPassword);
    await prisma.customer.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    if (currentSessionId) {
      await prisma.customerSession.deleteMany({
        where: { customerId: userId, id: { not: currentSessionId } },
      }).catch(() => {});
    }

    return { success: true, message: 'Password changed successfully.' };
  }
}
