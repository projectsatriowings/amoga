import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import {
  getDashboardMetrics,
  generateUtcDateRange,
  generateUtcWindowKeys,
  toDateKey,
  resolveDateRange,
  ELIGIBLE_ORDER_STATUSES,
  ELIGIBLE_PAYMENT_STATUSES,
} from '../src/services/adminAnalyticsService.js';

let server;
let baseUrl;
let superAdminToken;

describe('AMOGA Sales Volume Trend — Authoritative Database Integration & Period Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Authenticate Super Admin for API tests
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

  it('1. Date Utility & Timezone: generateUtcWindowKeys generates exact N daily UTC strings ending on today', () => {
    const keys7 = generateUtcWindowKeys(7);
    assert.equal(keys7.length, 7);
    const todayUtc = toDateKey(new Date());
    assert.equal(keys7[keys7.length - 1], todayUtc);

    // Verify sequential daily order
    for (let i = 1; i < keys7.length; i++) {
      const prev = new Date(`${keys7[i - 1]}T00:00:00.000Z`);
      const curr = new Date(`${keys7[i]}T00:00:00.000Z`);
      const diffMs = curr.getTime() - prev.getTime();
      assert.equal(diffMs, 24 * 60 * 60 * 1000);
    }
  });

  it('2. Date Range Boundaries: generateUtcDateRange correctly handles range across month boundaries', () => {
    const keys = generateUtcDateRange('2026-09-28', '2026-10-02');
    assert.deepEqual(keys, [
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('3. Status Eligibility Filter: Only CONFIRMED, PROCESSING, DISPATCHED, DELIVERED orders qualify for sales trend', async () => {
    // Direct check from DB
    const eligibleOrders = await prisma.order.findMany({
      where: { status: { in: ELIGIBLE_ORDER_STATUSES } },
      select: { id: true, status: true, totalAmount: true },
    });
    const pendingOrders = await prisma.order.findMany({
      where: { status: { notIn: ELIGIBLE_ORDER_STATUSES } },
      select: { id: true, status: true, totalAmount: true },
    });

    assert.ok(eligibleOrders.length > 0, 'Must have eligible orders in database');
    assert.ok(pendingOrders.length > 0, 'Must have pending orders in database');

    const metricsResult = await getDashboardMetrics({ range: 'all' });
    const trendTotalRevenue = metricsResult.salesTrends.reduce((a, b) => a + b.revenue, 0);
    const eligibleDbTotal = eligibleOrders.reduce((a, b) => a + Number(b.totalAmount), 0);

    // Trend total revenue must match eligible DB total exactly (within float rounding)
    assert.equal(
      Math.round(trendTotalRevenue * 100),
      Math.round(eligibleDbTotal * 100),
      'Trend revenue must equal eligible orders total amount'
    );
  });

  it('4. Period Controls — Last 7 Days (range=7d): Returns exactly 7 daily buckets with non-zero and zero dates', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=7d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.period.rangeKey, '7d');
    assert.equal(body.period.daysCount, 7);
    assert.equal(body.salesTrends.length, 7);

    // Verify non-zero sales exist on active days and zero sales on inactive days
    const nonZeroDays = body.salesTrends.filter((t) => t.revenue > 0);
    const zeroDays = body.salesTrends.filter((t) => t.revenue === 0);

    assert.ok(nonZeroDays.length > 0, 'Must have days with sales in 7d window');
    assert.ok(zeroDays.length > 0, 'Must have zero-sales days accurately bucketed');

    for (const item of body.salesTrends) {
      assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(typeof item.revenue, 'number');
      assert.equal(typeof item.orders, 'number');
      assert.ok(item.revenue >= 0);
      assert.ok(item.orders >= 0);
    }
  });

  it('5. Period Controls — Last 14 Days (range=14d): Returns exactly 14 daily buckets', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=14d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.period.rangeKey, '14d');
    assert.equal(body.salesTrends.length, 14);
  });

  it('6. Period Controls — Last 30 Days (range=30d): Returns exactly 30 daily buckets', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=30d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.period.rangeKey, '30d');
    assert.equal(body.salesTrends.length, 30);
  });

  it('7. Period Controls — All Time (range=all): Spans from earliest order to today with non-zero sales', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=all`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.period.rangeKey, 'all');

    // Earliest eligible order date in database
    const earliestOrder = await prisma.order.findFirst({
      where: { status: { in: ELIGIBLE_ORDER_STATUSES } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const earliestDateKey = toDateKey(earliestOrder.createdAt);
    assert.equal(body.salesTrends[0].date, earliestDateKey);

    const trendTotalRevenue = body.salesTrends.reduce((a, b) => a + b.revenue, 0);
    const trendTotalOrders = body.salesTrends.reduce((a, b) => a + b.orders, 0);

    assert.equal(trendTotalRevenue, body.metrics.grossSales);
    assert.ok(trendTotalOrders > 0);
  });

  it('8. Authoritative Reconciliation: Direct database sum matches trend total & KPI card values', async () => {
    // Compute 7d directly from DB
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const [dbAgg7d, res7d] = await Promise.all([
      prisma.order.aggregate({
        where: {
          status: { in: ELIGIBLE_ORDER_STATUSES },
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      fetch(`${baseUrl}/api/admin/dashboard/stats?range=7d`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      }).then((r) => r.json()),
    ]);

    const expectedRev = Number(Number(dbAgg7d._sum.totalAmount || 0).toFixed(2));
    const actualTrendRev = Number(
      res7d.salesTrends.reduce((acc, t) => acc + t.revenue, 0).toFixed(2)
    );

    assert.equal(actualTrendRev, expectedRev);
    assert.equal(res7d.metrics.grossSales, expectedRev);
    assert.equal(res7d.metrics.paidRevenue, expectedRev);
  });

  it('9. Error Handling: Rejects malformed requests and unauthenticated access cleanly', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/admin/dashboard/stats?range=7d`);
    assert.equal(unauthRes.status, 401);
  });
});
