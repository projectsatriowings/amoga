process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { prisma } from '../src/config/prisma.js';
import { hashPassword, verifyPassword, generateAdminSessionToken, hashSessionToken } from '../src/utils/adminAuth.js';
import { generateCustomerSessionToken, hashCustomerSessionToken } from '../src/utils/customerAuth.js';
import customerRoutes from '../src/routes/customerRoutes.js';
import stallRoutes from '../src/routes/stallRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';

describe('Password Visibility, Forgot Password, and Stall Staff Password Management Tests', () => {
  let app;
  let server;
  let port;
  let baseUrl;

  let testCustomerEmail = `test_cust_${Date.now()}@example.com`;
  let testStaffEmail = `test_staff_${Date.now()}@amoga.com`;
  let testAdminEmail = `test_admin_${Date.now()}@amoga.com`;

  let createdCustomerId;
  let createdStaffId;
  let createdAdminId;
  let adminSessionToken;
  let staffSessionToken;
  let customerSessionToken;

  before(async () => {
    // 1. Setup express test server
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/customers', customerRoutes);
    app.use('/api/stall', stallRoutes);
    app.use('/api/admin', adminRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 2. Create test customer
    const rawCustomerToken = generateCustomerSessionToken();
    const customer = await prisma.customer.create({
      data: {
        email: testCustomerEmail,
        name: 'Test Customer User',
        passwordHash: hashPassword('OriginalPassword123!'),
        isActive: true,
        sessions: {
          create: {
            tokenHash: hashCustomerSessionToken(rawCustomerToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    createdCustomerId = customer.id;
    customerSessionToken = rawCustomerToken;

    // 3. Create test Super Admin user
    const rawAdminToken = generateAdminSessionToken();
    const admin = await prisma.adminUser.create({
      data: {
        email: testAdminEmail,
        name: 'Super Admin Tester',
        role: 'SUPER_ADMIN',
        isActive: true,
        passwordHash: hashPassword('SuperAdminPass123!'),
        sessions: {
          create: {
            tokenHash: hashSessionToken(rawAdminToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    createdAdminId = admin.id;
    adminSessionToken = rawAdminToken;

    // 4. Create test Stall Cashier staff user
    const rawStaffToken = generateAdminSessionToken();
    const staff = await prisma.adminUser.create({
      data: {
        email: testStaffEmail,
        name: 'Test Stall Cashier',
        role: 'STALL_CASHIER',
        isActive: true,
        passwordHash: hashPassword('InitialStaffPass123!'),
        sessions: {
          create: {
            tokenHash: hashSessionToken(rawStaffToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    createdStaffId = staff.id;
    staffSessionToken = rawStaffToken;
  });

  after(async () => {
    // Clean up created test records
    try {
      if (createdCustomerId) {
        await prisma.passwordResetToken.deleteMany({ where: { customerId: createdCustomerId } });
        await prisma.customerSession.deleteMany({ where: { customerId: createdCustomerId } });
        await prisma.customer.delete({ where: { id: createdCustomerId } });
      }
      if (createdStaffId) {
        await prisma.passwordResetToken.deleteMany({ where: { adminUserId: createdStaffId } });
        await prisma.adminSession.deleteMany({ where: { adminId: createdStaffId } });
        await prisma.adminUser.delete({ where: { id: createdStaffId } });
      }
      if (createdAdminId) {
        await prisma.adminSession.deleteMany({ where: { adminId: createdAdminId } });
        await prisma.adminUser.delete({ where: { id: createdAdminId } });
      }
    } catch (e) {
      console.warn('Cleanup error:', e.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // Test 1: Generic Anti-Enumeration Response
  // ==========================================
  it('Forgot Password: returns generic confirmation preventing account enumeration', async () => {
    // 1. Request with registered email
    const resExisting = await fetch(`${baseUrl}/api/customers/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail }),
    });
    const jsonExisting = await resExisting.json();
    assert.equal(resExisting.status, 200);
    assert.equal(jsonExisting.success, true);
    assert.ok(jsonExisting.message.toLowerCase().includes('password reset instructions'));

    // 2. Request with unregistered email
    const resNonExistent = await fetch(`${baseUrl}/api/customers/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_99999@randomdomain.xyz' }),
    });
    const jsonNonExistent = await resNonExistent.json();
    assert.equal(resNonExistent.status, 200);
    assert.equal(jsonNonExistent.success, true);
    // Both messages must be completely generic and identical
    assert.equal(jsonExisting.message, jsonNonExistent.message);
  });

  // ==========================================
  // Test 2: Token Generation, Hash & Expiry
  // ==========================================
  it('Forgot Password: creates single-use token stored as SHA-256 hash with 30-min expiry', async () => {
    const dbToken = await prisma.passwordResetToken.findFirst({
      where: { customerId: createdCustomerId, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(dbToken, 'Reset token record must exist in PostgreSQL');
    assert.equal(dbToken.accountType, 'CUSTOMER');
    assert.equal(dbToken.email, testCustomerEmail);
    assert.equal(dbToken.tokenHash.length, 64, 'Token hash must be 64-char SHA-256 hex string');
    assert.ok(dbToken.expiresAt > new Date(), 'Expiry must be in future');

    // Expiry difference should be approximately 30 minutes (within 1 minute margin)
    const diffMinutes = (dbToken.expiresAt.getTime() - dbToken.createdAt.getTime()) / (1000 * 60);
    assert.ok(diffMinutes >= 29 && diffMinutes <= 31, 'Expiry should be 30 minutes');
  });

  // ==========================================
  // Test 3: Token Validation Endpoint
  // ==========================================
  it('Reset Token Verification: validates existing token and rejects non-existent/invalid tokens', async () => {
    // Re-trigger token generation via the service to get raw token for verification
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken } = await createPasswordResetToken({
      accountType: 'CUSTOMER',
      email: testCustomerEmail,
      customerId: createdCustomerId,
    });

    // 1. Verify valid token
    const resValid = await fetch(`${baseUrl}/api/customers/verify-reset-token?token=${rawToken}`);
    const jsonValid = await resValid.json();
    assert.equal(resValid.status, 200);
    assert.equal(jsonValid.valid, true);
    assert.equal(jsonValid.email, testCustomerEmail);

    // 2. Verify invalid token
    const resInvalid = await fetch(`${baseUrl}/api/customers/verify-reset-token?token=completely_fake_token_12345`);
    const jsonInvalid = await resInvalid.json();
    assert.equal(resInvalid.status, 400);
    assert.equal(jsonInvalid.valid, false);
  });

  // ==========================================
  // Test 4: Password Policy Enforcement
  // ==========================================
  it('Reset Password: rejects weak passwords under 6 characters', async () => {
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken } = await createPasswordResetToken({
      accountType: 'CUSTOMER',
      email: testCustomerEmail,
      customerId: createdCustomerId,
    });

    const res = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: '123' }),
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.ok(json.message.includes('at least 6 characters'));
  });

  // ==========================================
  // Test 5: Successful Customer Password Reset & Session Revocation
  // ==========================================
  it('Reset Password: updates password hash, marks token consumed, and revokes active sessions', async () => {
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken } = await createPasswordResetToken({
      accountType: 'CUSTOMER',
      email: testCustomerEmail,
      customerId: createdCustomerId,
    });

    const newPassword = 'BrandNewPassword2026!';
    const res = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword }),
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);

    // Verify token marked consumed
    const consumedToken = await prisma.passwordResetToken.findFirst({
      where: { customerId: createdCustomerId, consumedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(consumedToken.consumedAt !== null, 'Token must be marked consumed');

    // Verify sessions revoked
    const activeSessions = await prisma.customerSession.findMany({
      where: { customerId: createdCustomerId },
    });
    assert.equal(activeSessions.length, 0, 'All existing customer sessions must be revoked');

    // Verify customer can sign in with new password
    const loginRes = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: newPassword }),
    });
    const loginJson = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginJson.success, true);
    assert.ok(loginJson.token || loginJson.sessionToken, 'Login with new password must return session token');

    // Verify old password fails
    const oldLoginRes = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: 'OriginalPassword123!' }),
    });
    assert.equal(oldLoginRes.status, 401);
  });

  // ==========================================
  // Test 6: Prevention of Token Reuse
  // ==========================================
  it('Token Reuse Prevention: rejected when attempting to use an already-consumed token', async () => {
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken } = await createPasswordResetToken({
      accountType: 'CUSTOMER',
      email: testCustomerEmail,
      customerId: createdCustomerId,
    });

    // 1. Consume it once
    const res1 = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'AnotherPassword2026!' }),
    });
    assert.equal(res1.status, 200);

    // 2. Attempt to reuse it
    const res2 = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'ThirdPassword2026!' }),
    });
    const json2 = await res2.json();
    assert.equal(res2.status, 400);
    assert.ok(json2.message.includes('already been used') || json2.message.includes('invalid') || json2.message.includes('expired'));
  });

  // ==========================================
  // Test 7: Expired Token Rejection
  // ==========================================
  it('Expired Token Rejection: rejects token whose expiresAt is in the past', async () => {
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken, tokenId } = await createPasswordResetToken({
      accountType: 'CUSTOMER',
      email: testCustomerEmail,
      customerId: createdCustomerId,
    });

    // Artificially expire the token in DB
    await prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) }, // 1 minute in past
    });

    const res = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'ValidPassword123!' }),
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.ok(json.message.includes('expired') || json.message.includes('invalid'));
  });

  // ==========================================
  // Test 8: Customer Authenticated Self-Service Password Change
  // ==========================================
  it('Customer Change Password: requires valid current password and updates credentials', async () => {
    // Log in to get fresh session token
    const loginRes = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: 'AnotherPassword2026!' }),
    });
    const loginJson = await loginRes.json();
    const token = loginJson.token || loginJson.sessionToken;

    // 1. Wrong current password fails
    const resFail = await fetch(`${baseUrl}/api/customers/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewSecurePassword789!',
      }),
    });
    assert.equal(resFail.status, 400);
    const jsonFail = await resFail.json();
    assert.ok(jsonFail.message.toLowerCase().includes('current password') && jsonFail.message.toLowerCase().includes('incorrect'));

    // 2. Correct current password succeeds
    const resSuccess = await fetch(`${baseUrl}/api/customers/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'AnotherPassword2026!',
        newPassword: 'BrandNewSecurePassword789!',
      }),
    });
    assert.equal(resSuccess.status, 200);
    const jsonSuccess = await resSuccess.json();
    assert.equal(jsonSuccess.success, true);
  });

  // ==========================================
  // Test 9: Admin-Initiated Staff Password Reset Link
  // ==========================================
  it('Admin Staff Management: Super Admin can issue reset link; unauthorized users rejected', async () => {
    // 1. Super Admin issues reset link for stall cashier
    const resAdmin = await fetch(`${baseUrl}/api/admin/users/${createdStaffId}/send-reset-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`,
      },
    });
    const jsonAdmin = await resAdmin.json();
    assert.equal(resAdmin.status, 200);
    assert.equal(jsonAdmin.success, true);
    assert.ok(jsonAdmin.resetUrl ? jsonAdmin.resetUrl.includes('/stall/reset-password?token=') : true);

    // 2. Unauthenticated user cannot issue reset link
    const resNoAuth = await fetch(`${baseUrl}/api/admin/users/${createdStaffId}/send-reset-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(resNoAuth.status, 401);
  });

  // ==========================================
  // Test 10: Stall Staff Password Reset Flow
  // ==========================================
  it('Stall Staff Reset: staff resets password on dedicated stall reset endpoint', async () => {
    // Issue token
    const { createPasswordResetToken } = await import('../src/services/passwordResetService.js');
    const { rawToken } = await createPasswordResetToken({
      accountType: 'STAFF',
      email: testStaffEmail,
      adminUserId: createdStaffId,
    });

    // 1. Verify stall reset token
    const verifyRes = await fetch(`${baseUrl}/api/stall/auth/verify-reset-token?token=${rawToken}`);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyJson.valid, true);
    assert.equal(verifyJson.email, testStaffEmail);

    // 2. Perform stall password reset
    const newStaffPass = 'NewStaffSecretPassword2026!';
    const resetRes = await fetch(`${baseUrl}/api/stall/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: newStaffPass }),
    });
    const resetJson = await resetRes.json();
    assert.equal(resetRes.status, 200);
    assert.equal(resetJson.success, true);

    // 3. Login with new staff password succeeds and records lastLoginAt
    const loginRes = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStaffEmail, password: newStaffPass }),
    });
    const loginJson = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginJson.success, true);
    assert.ok(loginJson.token);

    // Check lastLoginAt updated in DB
    const updatedStaff = await prisma.adminUser.findUnique({ where: { id: createdStaffId } });
    assert.ok(updatedStaff.lastLoginAt !== null, 'lastLoginAt must be populated on login');
  });

  // ==========================================
  // Test 11: Stall Staff Self-Service Password Change
  // ==========================================
  it('Stall Staff Self-Service: authenticated stall staff can change password after verifying current', async () => {
    // Login to obtain active staff token
    const loginRes = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStaffEmail, password: 'NewStaffSecretPassword2026!' }),
    });
    const loginJson = await loginRes.json();
    const token = loginJson.token;

    // 1. Reject invalid current password
    const failRes = await fetch(`${baseUrl}/api/stall/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'IncorrectOldPassword!',
        newPassword: 'EvenNewerStaffPass2026!',
      }),
    });
    assert.equal(failRes.status, 400);

    // 2. Accept correct current password
    const successRes = await fetch(`${baseUrl}/api/stall/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'NewStaffSecretPassword2026!',
        newPassword: 'EvenNewerStaffPass2026!',
      }),
    });
    const successJson = await successRes.json();
    assert.equal(successRes.status, 200);
    assert.equal(successJson.success, true);
  });

  // ==========================================
  // Test 12: Disabled / Deactivated Account Cannot Authenticate
  // ==========================================
  it('Account Deactivation: deactivated staff account cannot login; reactivation restores access', async () => {
    // 1. Deactivate account in DB (or via admin toggle)
    await prisma.adminUser.update({
      where: { id: createdStaffId },
      data: { isActive: false },
    });

    const loginResDeactivated = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStaffEmail, password: 'EvenNewerStaffPass2026!' }),
    });
    assert.equal(loginResDeactivated.status, 403);
    const jsonDeactivated = await loginResDeactivated.json();
    assert.ok(jsonDeactivated.message.includes('deactivated'));

    // 2. Reactivate account
    await prisma.adminUser.update({
      where: { id: createdStaffId },
      data: { isActive: true },
    });

    const loginResReactivated = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStaffEmail, password: 'EvenNewerStaffPass2026!' }),
    });
    assert.equal(loginResReactivated.status, 200);
  });

  // ==========================================
  // Test 13: Truthful Email Delivery Reporting
  // ==========================================
  it('Truthful Email Delivery: correctly reports configuration status without pretending delivery', async () => {
    const { isEmailDeliveryConfigured, sendPasswordResetEmail } = await import('../src/services/passwordResetService.js');
    const configured = isEmailDeliveryConfigured();

    const result = await sendPasswordResetEmail({
      recipientEmail: 'test_delivery@example.com',
      recipientName: 'Test Recipient',
      accountType: 'CUSTOMER',
      rawToken: 'mock_raw_token_for_truthful_check',
    });

    assert.equal(result.configured, configured);
    if (!configured) {
      assert.equal(result.sent, false, 'Should truthfully report sent=false when SMTP/service is unconfigured');
    }
  });
});
