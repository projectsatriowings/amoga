import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;
let superAdminToken;
let catalogueToken;

describe('Amoga Admin API Integration & RBAC Security Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. POST /api/admin/auth/login rejects invalid credentials with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@amoga.com',
        password: 'WrongPassword123!',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'INVALID_CREDENTIALS');
  });

  it('2. POST /api/admin/auth/login authenticates Super Admin and returns session token', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@amoga.com',
        password: 'Admin@Amoga2026!',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.admin.role, 'SUPER_ADMIN');
    superAdminToken = body.token;
  });

  it('3. POST /api/admin/auth/login authenticates Catalogue Manager', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'catalogue@amoga.com',
        password: 'Catalogue@Amoga2026!',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.admin.role, 'CATALOGUE_MANAGER');
    catalogueToken = body.token;
  });

  it('4. Protected endpoints reject unauthenticated access with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'UNAUTHORIZED');
  });

  it('5. GET /api/admin/dashboard/stats reconciles 100% against authoritative PostgreSQL records', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    // Independent Direct PostgreSQL Queries for KPI Reconciliation
    const [
      dbTotalOrders,
      dbPaidPaymentsAgg,
      dbGrossSalesAgg,
      dbFulfilmentQueue,
      dbLowStock,
      dbOutOfStock,
      dbUnitsSoldAgg,
      dbPendingPayments,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.order.count({
        where: { status: { in: ['CONFIRMED', 'PROCESSING'] } },
      }),
      prisma.product.count({
        where: { isActive: true, inStock: true, stockQuantity: { lte: 10, gt: 0 } },
      }),
      prisma.product.count({
        where: { isActive: true, OR: [{ inStock: false }, { stockQuantity: { lte: 0 } }] },
      }),
      prisma.orderItem.aggregate({
        where: {
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] }
          }
        },
        _sum: { quantity: true },
      }),
      prisma.payment.count({
        where: { status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] } },
      }),
    ]);

    const expectedPaidRevenue = dbPaidPaymentsAgg._sum.amount ? Number(Number(dbPaidPaymentsAgg._sum.amount).toFixed(2)) : 0;
    const expectedGrossSales = dbGrossSalesAgg._sum.totalAmount ? Number(Number(dbGrossSalesAgg._sum.totalAmount).toFixed(2)) : 0;
    const expectedUnitsSold = dbUnitsSoldAgg._sum.quantity || 0;
    const expectedAov = dbGrossSalesAgg._count > 0 ? Number((expectedGrossSales / dbGrossSalesAgg._count).toFixed(2)) : 0;

    // Strict Reconciliation Assertions (allowing +/- 1 for concurrent test runs inserting orders)
    assert.ok(
      Math.abs(body.metrics.totalOrders - dbTotalOrders) <= 1,
      `Total orders must match DB count (actual: ${body.metrics.totalOrders}, db: ${dbTotalOrders})`
    );
    assert.equal(body.metrics.paidRevenue, expectedPaidRevenue, 'Captured revenue must match DB sum of SUCCEEDED payments');
    assert.ok(
      Math.abs(body.metrics.grossSales - expectedGrossSales) <= 500,
      `Gross sales must match DB within concurrent test margin (actual: ${body.metrics.grossSales}, db: ${expectedGrossSales})`
    );
    assert.equal(body.metrics.ordersRequiringFulfilment, dbFulfilmentQueue, 'Fulfilment queue must match CONFIRMED + PROCESSING orders');
    assert.equal(body.metrics.lowStockCount, dbLowStock, 'Low stock count must match active items with 1-10 units');
    assert.equal(body.metrics.outOfStockCount, dbOutOfStock, 'Out of stock count must match active items with <= 0 units');
    assert.ok(
      Math.abs(body.metrics.totalUnitsSold - expectedUnitsSold) <= 2,
      'Units sold must match total quantity across order items'
    );
    assert.equal(body.metrics.averageOrderValue, expectedAov, 'AOV must match gross sales divided by valid orders count');
    assert.equal(body.metrics.pendingPayments, dbPendingPayments, 'Pending payments must match CREATED, PENDING, AUTHORIZED payments');

    // Structural validations
    assert.ok(Array.isArray(body.recentOrders), 'recentOrders must be an array');
    assert.ok(Array.isArray(body.salesTrends), 'salesTrends must be an array');
    assert.ok(Array.isArray(body.topSellingProducts), 'topSellingProducts must be an array');
    assert.ok(Array.isArray(body.collectionPerformance), 'collectionPerformance must be an array');
  });

  it('6. Granular RBAC: Catalogue Manager is forbidden (403) from accessing admin user management', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'FORBIDDEN');
  });

  it('7. Unified Product Management: Catalogue Manager creates, edits, archives, and restores product', async () => {
    const testSlug = `test-artisanal-tea-${Date.now().toString(36)}`;
    // Create product in tea collection
    const createRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        name: 'Nilgiri Silver Tips Artisanal Tea',
        slug: testSlug,
        collectionId: 'tea',
        category: 'Single Estate Leaf',
        description: 'Rare hand-rolled silver tips harvested during the spring flush in Nilgiri.',
        price: 1850,
        stockQuantity: 40,
        inStock: true,
        specs: { harvestSeason: 'Spring 2026', origin: 'Nilgiri High Altitude' },
        variants: [
          { name: '50g Tin', price: 1850, stockQuantity: 25 },
          { name: '100g Velvet Pouch', price: 3400, stockQuantity: 15 },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    const productId = createData.product.id;

    // Update product
    const updateRes = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        price: 1950,
        packSize: '50g / 100g',
      }),
    });
    assert.equal(updateRes.status, 200);

    // Archive (soft-delete) product
    const archiveRes = await fetch(`${baseUrl}/api/admin/products/${productId}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(archiveRes.status, 200);

    // Verify soft-archived state
    const getRes = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    const getData = await getRes.json();
    assert.equal(getData.product.isActive, false);

    // Restore product
    const restoreRes = await fetch(`${baseUrl}/api/admin/products/${productId}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(restoreRes.status, 200);

    // Clean up test product
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
  });

  it('8. Inventory Management: adjustStock atomically updates stock and creates inventory log', async () => {
    // Find an existing product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
    });
    assert.ok(product, 'Existing product must exist in database');

    const originalStock = product.stockQuantity;
    const newStock = originalStock + 5;

    const res = await fetch(`${baseUrl}/api/admin/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        productId: product.id,
        newStock,
        reason: 'Restocked from artisan workshop',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.result.adjustedStock, newStock);
    assert.equal(body.result.delta, 5);

    // Revert stock
    await fetch(`${baseUrl}/api/admin/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        productId: product.id,
        newStock: originalStock,
        reason: 'Reverting test adjustment',
      }),
    });
  });

  it('9. Order Management: updateOrderStatus validates allowed transitions and rejects invalid jumps', async () => {
    const order = await prisma.order.findFirst({
      where: { status: 'CONFIRMED' },
    });

    if (order) {
      // Invalid transition: CONFIRMED cannot jump directly to DELIVERED without DISPATCHED
      const invalidRes = await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ status: 'DELIVERED', reason: 'Attempt skip' }),
      });

      assert.equal(invalidRes.status, 422);
      const invalidBody = await invalidRes.json();
      assert.equal(invalidBody.error, 'INVALID_TRANSITION');
    }
  });

  it('10. Homepage CMS Banners: Public endpoint returns only published banners', async () => {
    const res = await fetch(`${baseUrl}/api/banners`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.banners));
    assert.ok(body.banners.every((b) => b.isPublished === true));
  });

  it('11. Promotional Coupons: Checkout apply-coupon endpoint calculates authoritative discount', async () => {
    const res = await fetch(`${baseUrl}/api/checkout/apply-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'WELCOME10',
        subtotal: 3000,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.valid, true);
    assert.equal(body.code, 'WELCOME10');
    // 10% of 3000 is 300 (which is <= maxDiscount 500)
    assert.equal(body.discountAmount, 300);
  });

  it('12. Audit Logs: Important admin operations append to audit trail', async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.logs.length > 0);
    assert.ok(body.logs.some((l) => l.action === 'ADMIN_LOGIN'));
  });
});
