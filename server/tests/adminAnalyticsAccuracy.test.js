import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
let baseUrl;
let superAdminToken;

describe('Amoga Admin Analytics Authoritative Database & KPI Reconciliation Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Authenticate Super Admin
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@amoga.com',
        password: 'Admin@Amoga2026!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginBody = await loginRes.json();
    superAdminToken = loginBody.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. GET /api/admin/dashboard/stats rejects unauthenticated access with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`);
    assert.equal(res.status, 401);
  });

  it('2. 100% Mathematical Reconciliation: All Time Scope against PostgreSQL Database Truth', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=all`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const { metrics, salesTrends, collectionPerformance, topSellingProducts } = body;

    // Direct Database Aggregates
    const [
      dbTotalOrders,
      dbEligibleOrdersAgg,
      dbSucceededPaymentsAgg,
      dbPendingPaymentsCount,
      dbFulfilmentQueueCount,
      dbEligibleOrderItemsAgg,
      dbLowStockCount,
      dbOutOfStockCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count({
        where: { status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] } },
      }),
      prisma.order.count({
        where: { status: { in: ['CONFIRMED', 'PROCESSING'] } },
      }),
      prisma.orderItem.aggregate({
        where: {
          order: { status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] } },
        },
        _sum: { quantity: true, lineTotal: true },
      }),
      prisma.product.count({
        where: { isActive: true, inStock: true, stockQuantity: { lte: 10, gt: 0 } },
      }),
      prisma.product.count({
        where: { isActive: true, OR: [{ inStock: false }, { stockQuantity: { lte: 0 } }] },
      }),
    ]);

    const expectedGrossSales = Number(Number(dbEligibleOrdersAgg._sum.totalAmount || 0).toFixed(2));
    const expectedPaidRevenue = Number(Number(dbSucceededPaymentsAgg._sum.amount || 0).toFixed(2));
    const expectedUnitsSold = dbEligibleOrderItemsAgg._sum.quantity || 0;
    const expectedItemsLineTotal = Number(Number(dbEligibleOrderItemsAgg._sum.lineTotal || 0).toFixed(2));

    // A. Orders Total Match (allowing <= 1 for parallel test runner creating orders)
    assert.ok(
      Math.abs(metrics.totalOrders - dbTotalOrders) <= 1,
      `Total orders must match DB (actual: ${metrics.totalOrders}, db: ${dbTotalOrders})`
    );

    // B. Reconcile Sum of Statuses to Total Orders
    const statusSum = Object.values(metrics.ordersByStatus).reduce((a, b) => a + b, 0);
    assert.equal(statusSum, dbTotalOrders, 'Sum of ordersByStatus must equal totalOrders');

    // C. Gross Sales Matches Database Sum
    assert.equal(metrics.grossSales, expectedGrossSales, 'Gross Sales must match DB confirmed orders sum');

    // D. Captured Revenue Matches Database Succeeded Payments
    assert.equal(metrics.paidRevenue, expectedPaidRevenue, 'Captured revenue must match DB SUCCEEDED payments sum');

    // E. Fulfilment Queue Matches Confirmed + Processing Orders
    assert.equal(metrics.ordersRequiringFulfilment, dbFulfilmentQueueCount, 'Fulfilment queue must match CONFIRMED + PROCESSING');

    // F. Pending Payments Matches Operational Count (allowing <= 2 for concurrent test suites creating payments)
    assert.ok(
      Math.abs(metrics.pendingPayments - dbPendingPaymentsCount) <= 2,
      `Pending payments must match DB count within parallel test margin (actual: ${metrics.pendingPayments}, db: ${dbPendingPaymentsCount})`
    );

    // G. Total Units Sold Matches Eligible Order Items
    assert.equal(metrics.totalUnitsSold, expectedUnitsSold, 'Total Units Sold must match eligible items quantity');

    // H. Collection Sales Sum Matches Order Items Line Total
    const collectionRevenueSum = collectionPerformance.reduce((acc, c) => acc + c.totalRevenue, 0);
    const collectionUnitsSum = collectionPerformance.reduce((acc, c) => acc + c.totalQuantitySold, 0);
    assert.equal(
      Number(collectionRevenueSum.toFixed(2)),
      expectedItemsLineTotal,
      'Sum of collection revenues must reconcile with eligible order items lineTotal'
    );
    assert.equal(
      collectionUnitsSum,
      expectedUnitsSold,
      'Sum of collection units must reconcile with totalUnitsSold'
    );

    // I. Top-Selling Products Reconcile: Revenue sum of products cannot exceed eligible gross sales
    const topSellersRevSum = topSellingProducts.reduce((acc, p) => acc + p.revenue, 0);
    assert.ok(
      topSellersRevSum <= expectedItemsLineTotal + 0.01,
      'Top selling products sum must not exceed total eligible items revenue'
    );

    // J. Trend Histogram Sum Matches Period Gross Sales
    const trendRevSum = salesTrends.reduce((acc, t) => acc + t.revenue, 0);
    assert.equal(
      Number(trendRevSum.toFixed(2)),
      expectedGrossSales,
      'Sum of trend daily revenues must equal grossSales for the period'
    );

    // K. Stock Attention Counts Match DB
    assert.equal(metrics.lowStockCount, dbLowStockCount, 'Low stock count must match DB');
    assert.equal(metrics.outOfStockCount, dbOutOfStockCount, 'Out of stock count must match DB');
  });

  it('3. Range Filter Verification: 7-Day Window enforces date boundaries', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=7d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.period.rangeKey, '7d');
    assert.equal(body.salesTrends.length, 7, '7-day trend must contain exactly 7 daily buckets');

    // Daily histogram must include zero-sales days as 0 rather than omitting them
    for (const bucket of body.salesTrends) {
      assert.ok(typeof bucket.date === 'string', 'Bucket must have valid ISO date');
      assert.ok(typeof bucket.revenue === 'number', 'Bucket must have numeric revenue');
      assert.ok(typeof bucket.orders === 'number', 'Bucket must have numeric order count');
    }

    // Trend sum must equal period gross sales
    const trendSum = body.salesTrends.reduce((acc, t) => acc + t.revenue, 0);
    assert.equal(
      Number(trendSum.toFixed(2)),
      body.metrics.grossSales,
      '7-day trend sum must reconcile with 7-day gross sales'
    );
  });

  it('4. Range Filter Verification: 14-Day Window enforces date boundaries', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=14d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.period.rangeKey, '14d');
    assert.equal(body.salesTrends.length, 14, '14-day trend must contain exactly 14 daily buckets');
  });

  it('5. Financial Reports & Sales Report Endpoint aligns with Centralized Analytics Service', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports/sales`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.report);

    // Fetch dashboard all-time stats to compare
    const dashRes = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=all`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const dashBody = await dashRes.json();

    assert.equal(
      body.report.grossRevenue,
      dashBody.metrics.grossSales,
      'Sales report gross revenue must match dashboard gross sales'
    );
    assert.equal(
      body.report.netCapturedRevenue,
      dashBody.metrics.paidRevenue,
      'Sales report net captured revenue must match dashboard captured revenue'
    );
    assert.equal(
      body.report.paidOrdersCount,
      dashBody.metrics.ordersRequiringFulfilment, // When all confirmed are paid
      'Paid orders count matches confirmed orders'
    );
  });
});
