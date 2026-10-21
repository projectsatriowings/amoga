import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { hashPassword, hashSessionToken, generateAdminSessionToken } from '../src/utils/adminAuth.js';

// We test against the Express app directly
import express from 'express';
import cors from 'cors';
import stallRoutes from '../src/routes/stallRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';

describe('Amoga Stall Staff Authentication & POS Security Tests', () => {
  let app;
  let server;
  let port;
  let baseUrl;

  let superAdminToken;
  let stallManagerToken;
  let stallCashierToken;
  let unauthorizedStallId;
  let authorizedStallId;

  before(async () => {
    // 1. Setup express test server with routes
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/stall', stallRoutes);
    app.use('/api/admin', adminRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 2. Fetch or create test stalls
    const locations = await prisma.stockLocation.findMany({
      where: { type: 'STALL' },
      take: 2,
    });

    if (locations.length < 2) {
      throw new Error('Need at least 2 stall locations to test cross-stall isolation');
    }

    authorizedStallId = locations[0].id;
    unauthorizedStallId = locations[1].id;

    // 3. Setup test users with clean passwords and assigned locations
    const superAdmin = await prisma.adminUser.upsert({
      where: { email: 'test_super_admin@amoga.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        email: 'test_super_admin@amoga.com',
        name: 'Test Super Admin',
        passwordHash: hashPassword('SuperAdmin@2026!'),
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    const stallManager = await prisma.adminUser.upsert({
      where: { email: 'test_stall_manager@amoga.com' },
      update: {
        role: 'STALL_MANAGER',
        assignedLocationIds: [authorizedStallId],
        isActive: true,
      },
      create: {
        email: 'test_stall_manager@amoga.com',
        name: 'Test Stall Manager',
        passwordHash: hashPassword('StallManager@2026!'),
        role: 'STALL_MANAGER',
        assignedLocationIds: [authorizedStallId],
        isActive: true,
      },
    });

    const stallCashier = await prisma.adminUser.upsert({
      where: { email: 'test_stall_cashier@amoga.com' },
      update: {
        role: 'STALL_CASHIER',
        assignedLocationIds: [authorizedStallId],
        isActive: true,
      },
      create: {
        email: 'test_stall_cashier@amoga.com',
        name: 'Test Stall Cashier',
        passwordHash: hashPassword('StallCashier@2026!'),
        role: 'STALL_CASHIER',
        assignedLocationIds: [authorizedStallId],
        isActive: true,
      },
    });

    // Helper to generate sessions
    async function makeSession(userId) {
      const rawToken = generateAdminSessionToken();
      const tokenHash = hashSessionToken(rawToken);
      await prisma.adminSession.create({
        data: {
          adminId: userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return rawToken;
    }

    superAdminToken = await makeSession(superAdmin.id);
    stallManagerToken = await makeSession(stallManager.id);
    stallCashierToken = await makeSession(stallCashier.id);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Clean up test sessions
    await prisma.adminSession.deleteMany({
      where: {
        admin: {
          email: {
            in: [
              'test_super_admin@amoga.com',
              'test_stall_manager@amoga.com',
              'test_stall_cashier@amoga.com',
            ],
          },
        },
      },
    });
  });

  // Test 1: Unauthenticated requests to stall API return 401
  it('1. Unauthenticated requests to /api/stall/* return 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/stall/locations`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'UNAUTHORIZED');
  });

  // Test 2: Successful stall login issues token & profile
  it('2. POST /api/stall/auth/login authenticates valid stall staff and returns user profile', async () => {
    const res = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_stall_manager@amoga.com',
        password: 'StallManager@2026!',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, 'STALL_MANAGER');
    assert.deepEqual(data.user.assignedLocationIds, [authorizedStallId]);
  });

  // Test 3: Stall staff is blocked from all /api/admin/* endpoints with 403 FORBIDDEN
  it('3. Stall-only user cannot access privileged /api/admin endpoints (returns 403 FORBIDDEN)', async () => {
    // Attempt to access products list
    const res1 = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${stallManagerToken}` },
    });
    assert.equal(res1.status, 403);
    const data1 = await res1.json();
    assert.equal(data1.error, 'FORBIDDEN');

    // Attempt to access users administration
    const res2 = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${stallCashierToken}` },
    });
    assert.equal(res2.status, 403);
    const data2 = await res2.json();
    assert.equal(data2.error, 'FORBIDDEN');

    // Attempt to access admin dashboard stats
    const res3 = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${stallManagerToken}` },
    });
    assert.equal(res3.status, 403);
    const data3 = await res3.json();
    assert.equal(data3.error, 'FORBIDDEN');
  });

  // Test 4: Stall user attempting to log into /api/admin/auth/login is rejected
  it('4. Stall staff attempting to authenticate via admin login is rejected with clear message', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_stall_manager@amoga.com',
        password: 'StallManager@2026!',
      }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'STALL_STAFF_RESTRICTED');
  });

  // Test 5: Stall staff cannot access an unauthorized stall location
  it('5. Stall staff requesting an unauthorized stall location receives 403 FORBIDDEN_LOCATION', async () => {
    const res = await fetch(`${baseUrl}/api/stall/catalog?stockLocationId=${unauthorizedStallId}`, {
      headers: { Authorization: `Bearer ${stallManagerToken}` },
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'FORBIDDEN_LOCATION');
  });

  // Test 6: Stall staff can access their authorized stall location
  it('6. Stall staff can access their authorized stall catalog', async () => {
    const res = await fetch(`${baseUrl}/api/stall/catalog?stockLocationId=${authorizedStallId}`, {
      headers: { Authorization: `Bearer ${stallManagerToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.products));
  });

  // Test 7: Super Admin retains full global access to all stalls and admin endpoints
  it('7. Super Admin retains full access to any stall and admin endpoints', async () => {
    // Access stall catalog
    const resStall = await fetch(`${baseUrl}/api/stall/catalog?stockLocationId=${unauthorizedStallId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(resStall.status, 200);

    // Access admin products
    const resAdmin = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(resAdmin.status, 200);
  });

  // Test 8: Stall Cashier CANNOT initiate stock transfers (restricted to Stall Manager / Super Admin)
  it('8. Stall Cashier is forbidden from performing stock transfers (returns 403 FORBIDDEN)', async () => {
    const res = await fetch(`${baseUrl}/api/stall/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stallCashierToken}`,
      },
      body: JSON.stringify({
        sourceLocationId: authorizedStallId,
        destinationLocationId: authorizedStallId,
        items: [{ productId: 'dummy-prod', quantity: 5 }],
      }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'FORBIDDEN');
  });

  // Test 9: Expired session tokens are rejected with 401
  it('9. Expired session tokens are rejected with 401 SESSION_EXPIRED', async () => {
    const rawToken = generateAdminSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    // Expired 1 hour ago
    await prisma.adminSession.create({
      data: {
        adminId: (await prisma.adminUser.findUnique({ where: { email: 'test_stall_manager@amoga.com' } })).id,
        tokenHash,
        expiresAt: new Date(Date.now() - 3600000),
      },
    });

    const res = await fetch(`${baseUrl}/api/stall/locations`, {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'SESSION_EXPIRED');
  });

  // Test 10: Failed login does not reveal whether account exists
  it('10. Failed authentication returns generic INVALID_CREDENTIALS for nonexistent and wrong password', async () => {
    // Nonexistent account
    const res1 = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_account@amoga.com', password: 'AnyPassword123!' }),
    });
    assert.equal(res1.status, 401);
    const data1 = await res1.json();
    assert.equal(data1.message, 'Invalid email or password');

    // Wrong password for existing account
    const res2 = await fetch(`${baseUrl}/api/stall/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_stall_manager@amoga.com', password: 'WrongPassword123!' }),
    });
    assert.equal(res2.status, 401);
    const data2 = await res2.json();
    assert.equal(data2.message, 'Invalid email or password');

    // Messages must be identical
    assert.equal(data1.message, data2.message);
  });

  // Test 11: Sign-out invalidates session immediately
  it('11. Sign-out deletes session and subsequent requests fail with 401', async () => {
    // Create dedicated session for sign-out test
    const rawToken = generateAdminSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const user = await prisma.adminUser.findUnique({ where: { email: 'test_stall_manager@amoga.com' } });
    await prisma.adminSession.create({
      data: {
        adminId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Verify session works
    const resBefore = await fetch(`${baseUrl}/api/stall/auth/me`, {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    assert.equal(resBefore.status, 200);

    // Call logout
    const resLogout = await fetch(`${baseUrl}/api/stall/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    assert.equal(resLogout.status, 200);

    // Subsequent request fails
    const resAfter = await fetch(`${baseUrl}/api/stall/auth/me`, {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    assert.equal(resAfter.status, 401);
  });
});
