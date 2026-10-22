import { prisma } from '../config/prisma.js';
import { registerCatalogueInvalidation } from '../controllers/productsController.js';

/**
 * AMOGA EXECUTIVE ADMIN ANALYTICS SERVICE
 * 
 * Centralized, authoritative calculation engine for admin KPIs, financial reconciliation,
 * collection performance, top-selling products, and time-series trends.
 * 
 * All figures derive directly from PostgreSQL/Neon records.
 */

// Canonical eligible order statuses for completed gross commercial sales
export const ELIGIBLE_ORDER_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
];

// Canonical payment statuses for successfully settled revenue
export const ELIGIBLE_PAYMENT_STATUSES = ['SUCCEEDED'];

// Canonical lifecycle states
export const ALL_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
];

export const CANONICAL_COLLECTIONS = ['food', 'tea', 'sarees', 'jewellery'];

// High-speed in-memory cache for executive dashboard metrics
const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 25 * 1000; // 25 seconds TTL

export function invalidateDashboardCache() {
  dashboardCache.clear();
}
registerCatalogueInvalidation(invalidateDashboardCache);

/**
 * Format a Date object as YYYY-MM-DD in UTC
 */
export function toDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate inclusive daily UTC date keys between two YYYY-MM-DD strings
 */
export function generateUtcDateRange(startDateKey, endDateKey) {
  const keys = [];
  const [sy, sm, sd] = startDateKey.split('-').map(Number);
  const [ey, em, ed] = endDateKey.split('-').map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur <= end) {
    keys.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return keys;
}

/**
 * Generate N trailing daily UTC date keys ending on today
 */
export function generateUtcWindowKeys(daysCount) {
  const keys = [];
  const now = new Date();
  const endKey = toDateKey(now);
  const [ey, em, ed] = endKey.split('-').map(Number);

  for (let i = daysCount - 1; i >= 0; i--) {
    const cur = new Date(Date.UTC(ey, em - 1, ed));
    cur.setUTCDate(cur.getUTCDate() - i);
    keys.push(cur.toISOString().split('T')[0]);
  }
  return keys;
}

/**
 * Resolve start and end Date boundaries for a specified time range or custom dates.
 * @param {Object} options
 * @param {string} [options.range] - 'today' | '7d' | '14d' | '30d' | 'all'
 * @param {string} [options.startDate] - ISO or YYYY-MM-DD
 * @param {string} [options.endDate] - ISO or YYYY-MM-DD
 * @returns {{ start: Date | null, end: Date | null, rangeKey: string, daysCount: number }}
 */
export function resolveDateRange({ range = '30d', startDate, endDate } = {}) {
  const now = new Date();

  if (startDate || endDate) {
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setUTCHours(23, 59, 59, 999);
    }
    const daysCount = start && end
      ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      : 30;
    return { start, end, rangeKey: 'custom', daysCount };
  }

  const normalized = String(range).toLowerCase();

  if (normalized === 'today') {
    const todayKey = toDateKey(now);
    const [y, m, d] = todayKey.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    return { start, end: now, rangeKey: 'today', daysCount: 1 };
  }

  if (normalized === '7d') {
    const keys = generateUtcWindowKeys(7);
    const [y, m, d] = keys[0].split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    return { start, end: now, rangeKey: '7d', daysCount: 7 };
  }

  if (normalized === '14d') {
    const keys = generateUtcWindowKeys(14);
    const [y, m, d] = keys[0].split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    return { start, end: now, rangeKey: '14d', daysCount: 14 };
  }

  if (normalized === 'all') {
    return { start: null, end: null, rangeKey: 'all', daysCount: 30 };
  }

  // Default: '30d'
  const keys = generateUtcWindowKeys(30);
  const [y, m, d] = keys[0].split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  return { start, end: now, rangeKey: '30d', daysCount: 30 };
}

/**
 * Compute executive dashboard analytics and telemetry
 */
export async function getDashboardMetrics(queryOptions = {}) {
  const { start, end, rangeKey, daysCount } = resolveDateRange(queryOptions);
  const cacheKey = [rangeKey, start ? toDateKey(start) : 'none', end ? toDateKey(end) : 'none'].join(':');
  const now = Date.now();
  const cached = dashboardCache.get(cacheKey);
  if (cached && (now - cached.timestamp < DASHBOARD_CACHE_TTL_MS)) {
    return cached.data;
  }

  // Date filter objects for Prisma
  const orderDateFilter = {};
  if (start) orderDateFilter.gte = start;
  if (end) orderDateFilter.lte = end;
  const hasDateFilter = start !== null || end !== null;

  const orderWherePeriod = hasDateFilter ? { createdAt: orderDateFilter } : {};
  const paymentWherePeriod = hasDateFilter ? { createdAt: orderDateFilter } : {};

  // 1. Fetch store settings for configurable stock threshold if available
  const storeSetting = await prisma.storeSetting.findUnique({
    where: { id: 'default' },
  }).catch(() => null);
  const lowStockThreshold = 10; // Canonical baseline for Amoga luxury catalogue

  // 2. Parallel queries for authoritative aggregates
  const [
    // Lifetime and Period Order Counts
    totalOrdersPeriod,
    lifetimeOrdersCount,
    ordersByStatusGroup,

    // Captured Payments (SUCCEEDED)
    paidPaymentsPeriodAgg,
    lifetimePaidPaymentsAgg,

    // Pending and Failed Payments
    pendingPaymentsCount,
    failedPaymentsCount,

    // Gross Sales on Valid / Completed Orders
    validOrdersPeriodAgg,
    lifetimeValidOrdersAgg,

    // Fulfilment Queue (Operational Snapshot: CONFIRMED + PROCESSING)
    confirmedOrdersCount,
    processingOrdersCount,

    // Current Inventory Snapshot (Products & Variants)
    lowStockProductCount,
    outOfStockProductCount,
    lowStockList,

    // Eligible Order Items by Collection (Period)
    orderItemsByCollection,

    // Eligible Order Items by Product for Top Sellers (Period)
    orderItemsByProduct,

    // Total units sold across eligible orders (Period)
    totalUnitsSoldAgg,

    // Time-series Orders for Trend (matching range)
    trendOrders,

    // Recent 10 Orders Stream (Always latest live orders)
    recentOrders,

    // Unique Customer Insights (Period)
    customerEmailsGroup,

    // All active catalogue products (for product lookup & metadata enrichment)
    allActiveProducts,
  ] = await Promise.all([
    // Total orders in period
    prisma.order.count({ where: orderWherePeriod }),

    // Lifetime orders count
    prisma.order.count(),

    // Orders grouped by status (Period)
    prisma.order.groupBy({
      by: ['status'],
      where: orderWherePeriod,
      _count: true,
    }),

    // Captured revenue in period (SUCCEEDED payments)
    prisma.payment.aggregate({
      where: {
        status: { in: ELIGIBLE_PAYMENT_STATUSES },
        ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
      },
      _sum: { amount: true, amountPaise: true },
      _count: true,
    }),

    // Lifetime captured revenue
    prisma.payment.aggregate({
      where: { status: { in: ELIGIBLE_PAYMENT_STATUSES } },
      _sum: { amount: true },
      _count: true,
    }),

    // Pending payments count (Current operational snapshot)
    prisma.payment.count({
      where: { status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] } },
    }),

    // Failed payments count
    prisma.payment.count({
      where: { status: 'FAILED' },
    }),

    // Gross sales in period (CONFIRMED, PROCESSING, DISPATCHED, DELIVERED)
    prisma.order.aggregate({
      where: {
        status: { in: ELIGIBLE_ORDER_STATUSES },
        ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
      },
      _sum: { totalAmount: true, subtotal: true, discountAmount: true, shippingAmount: true },
      _count: true,
    }),

    // Lifetime gross sales
    prisma.order.aggregate({
      where: { status: { in: ELIGIBLE_ORDER_STATUSES } },
      _sum: { totalAmount: true },
      _count: true,
    }),

    // Confirmed orders (Fulfilment queue)
    prisma.order.count({
      where: { status: 'CONFIRMED' },
    }),

    // Processing orders (Fulfilment queue)
    prisma.order.count({
      where: { status: 'PROCESSING' },
    }),

    // Low stock products (0 < stockQuantity <= 10)
    prisma.product.count({
      where: {
        isActive: true,
        inStock: true,
        stockQuantity: { lte: lowStockThreshold, gt: 0 },
      },
    }),

    // Out of stock products (inStock = false OR stockQuantity <= 0)
    prisma.product.count({
      where: {
        isActive: true,
        OR: [{ inStock: false }, { stockQuantity: { lte: 0 } }],
      },
    }),

    // Low stock items preview
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { inStock: false },
          { stockQuantity: { lte: lowStockThreshold } },
        ],
      },
      orderBy: [{ inStock: 'asc' }, { stockQuantity: 'asc' }],
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
        collectionId: true,
        stockQuantity: true,
        inStock: true,
      },
    }),

    // Order items grouped by collection for ELIGIBLE orders in period
    prisma.orderItem.groupBy({
      by: ['collectionId'],
      where: {
        order: {
          status: { in: ELIGIBLE_ORDER_STATUSES },
          ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
        },
      },
      _sum: { quantity: true, lineTotal: true },
      _count: true,
    }),

    // Top selling products from ELIGIBLE orders in period
    prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'collectionId'],
      where: {
        order: {
          status: { in: ELIGIBLE_ORDER_STATUSES },
          ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 20,
    }),

    // Total units sold across eligible orders in period
    prisma.orderItem.aggregate({
      where: {
        order: {
          status: { in: ELIGIBLE_ORDER_STATUSES },
          ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
        },
      },
      _sum: { quantity: true },
    }),

    // Trend orders within date range for daily histogram
    prisma.order.findMany({
      where: {
        status: { in: ELIGIBLE_ORDER_STATUSES },
        ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    }),

    // Recent 10 orders stream
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderReference: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),

    // Customers with confirmed orders in period
    prisma.order.groupBy({
      by: ['customerEmail'],
      where: {
        status: { in: ELIGIBLE_ORDER_STATUSES },
        ...(hasDateFilter ? { createdAt: orderDateFilter } : {}),
      },
      _count: true,
      _sum: { totalAmount: true },
    }),

    // All active products for metadata lookup
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
        collectionId: true,
        stockQuantity: true,
        inStock: true,
      },
    }),
  ]);

  // 3. Format Orders by Status (Full canonical map)
  const ordersByStatus = {};
  for (const status of ALL_ORDER_STATUSES) {
    ordersByStatus[status] = 0;
  }
  for (const item of ordersByStatusGroup) {
    if (item.status && ordersByStatus.hasOwnProperty(item.status)) {
      ordersByStatus[item.status] = item._count;
    }
  }

  // 4. Calculate Authoritative Financial Metrics
  const paidRevenue = paidPaymentsPeriodAgg._sum.amount ? Number(paidPaymentsPeriodAgg._sum.amount) : 0;
  const grossSales = trendOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const validOrdersCount = trendOrders.length;
  const averageOrderValue = validOrdersCount > 0 ? Number((grossSales / validOrdersCount).toFixed(2)) : 0;

  const totalPaidAttempts = (paidPaymentsPeriodAgg._count || 0) + failedPaymentsCount;
  const paymentSuccessRate = totalPaidAttempts > 0
    ? Math.round(((paidPaymentsPeriodAgg._count || 0) / totalPaidAttempts) * 100)
    : 100;

  const totalUnitsSold = totalUnitsSoldAgg._sum.quantity || 0;

  // 5. Build Time-Series Trend Histogram
  // Generate daily date buckets for the exact requested range window
  const trendMap = new Map();

  let bucketKeys = [];
  const currentDate = new Date();
  if (rangeKey === 'all') {
    if (trendOrders.length > 0) {
      const firstDateKey = toDateKey(trendOrders[0].createdAt);
      const todayKey = toDateKey(currentDate);
      const lastOrderKey = toDateKey(trendOrders[trendOrders.length - 1].createdAt);
      const lastDateKey = todayKey > lastOrderKey ? todayKey : lastOrderKey;
      bucketKeys = generateUtcDateRange(firstDateKey, lastDateKey);
    } else {
      bucketKeys = generateUtcWindowKeys(30);
    }
  } else if (rangeKey === 'custom' && start && end) {
    bucketKeys = generateUtcDateRange(toDateKey(start), toDateKey(end));
  } else {
    bucketKeys = generateUtcWindowKeys(daysCount || 30);
  }

  for (const k of bucketKeys) {
    trendMap.set(k, { date: k, revenue: 0, orders: 0 });
  }

  // Populate trend buckets with eligible orders
  for (const ord of trendOrders) {
    const k = toDateKey(ord.createdAt);
    if (trendMap.has(k)) {
      const item = trendMap.get(k);
      item.revenue += Number(ord.totalAmount);
      item.orders += 1;
    }
  }

  const salesTrends = Array.from(trendMap.values()).map((t) => ({
    date: t.date,
    revenue: Number(t.revenue.toFixed(2)),
    orders: t.orders,
  }));

  // 6. Build Collection Performance
  // Ensure all 4 canonical collections are represented
  const collectionPerformanceMap = new Map();
  for (const colId of CANONICAL_COLLECTIONS) {
    collectionPerformanceMap.set(colId, {
      collectionId: colId,
      totalQuantitySold: 0,
      totalRevenue: 0,
      itemsCount: 0,
    });
  }

  for (const c of orderItemsByCollection) {
    collectionPerformanceMap.set(c.collectionId, {
      collectionId: c.collectionId,
      totalQuantitySold: c._sum.quantity || 0,
      totalRevenue: Number((c._sum.lineTotal || 0).toFixed(2)),
      itemsCount: c._count,
    });
  }

  const collectionPerformance = Array.from(collectionPerformanceMap.values());

  // 7. Build Top Selling Products
  const productLookup = new Map();
  for (const p of allActiveProducts) {
    productLookup.set(p.id, p);
  }

  const topSellingProducts = orderItemsByProduct.map((item) => {
    const p = item.productId ? productLookup.get(item.productId) : null;
    return {
      id: item.productId || `item-${item.productName}`,
      name: p?.name || item.productName,
      slug: p?.slug || '',
      image: p?.image || '',
      collectionId: p?.collectionId || item.collectionId,
      price: p?.price !== null && p?.price !== undefined ? Number(p.price) : 0,
      unitsSold: item._sum.quantity || 0,
      revenue: Number((item._sum.lineTotal || 0).toFixed(2)),
      stockQuantity: p?.stockQuantity ?? 50,
      inStock: p?.inStock ?? true,
    };
  });

  // If top selling list has products, keep it strictly to products with real sales
  // If zero products have sales in period, provide up to 5 catalogue items clearly marked 0 sales
  if (topSellingProducts.length === 0) {
    for (const p of allActiveProducts.slice(0, 5)) {
      topSellingProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image || '',
        collectionId: p.collectionId,
        price: p.price ? Number(p.price) : 0,
        unitsSold: 0,
        revenue: 0,
        stockQuantity: p.stockQuantity ?? 50,
        inStock: p.inStock ?? true,
      });
    }
  }

  // 8. Customer Analytics
  const uniqueCustomersCount = customerEmailsGroup.length;
  const repeatCustomersCount = customerEmailsGroup.filter((c) => c._count > 1).length;

  return {
    success: true,
    period: {
      rangeKey,
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      daysCount,
    },
    metrics: {
      // Primary Revenue & Sales KPIs
      paidRevenue: Number(paidRevenue.toFixed(2)),
      grossSales: Number(grossSales.toFixed(2)),
      lifetimePaidRevenue: Number(Number(lifetimePaidPaymentsAgg._sum.amount || 0).toFixed(2)),
      lifetimeGrossSales: Number(Number(lifetimeValidOrdersAgg._sum.totalAmount || 0).toFixed(2)),

      // Operational Fulfilment Queue
      ordersRequiringFulfilment: confirmedOrdersCount + processingOrdersCount,
      confirmedOrdersCount,
      processingOrdersCount,

      // Inventory Attention Snapshot
      lowStockCount: lowStockProductCount,
      outOfStockCount: outOfStockProductCount,
      stockAttentionTotal: lowStockProductCount + outOfStockProductCount,

      // Order Volume & Pipeline
      totalOrders: totalOrdersPeriod,
      lifetimeTotalOrders: lifetimeOrdersCount,
      ordersByStatus,

      // Commercial Performance & Efficiency
      totalUnitsSold,
      averageOrderValue,
      paymentSuccessRate,
      pendingPayments: pendingPaymentsCount,
      failedPayments: failedPaymentsCount,

      // Customer Reach
      uniqueCustomersCount,
      repeatCustomersCount,
    },
    salesTrends,
    collectionPerformance,
    topSellingProducts,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderReference: o.orderReference,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    })),
    lowStockList: lowStockList.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price ? Number(p.price) : 0,
      collectionId: p.collectionId,
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
    })),
  };

  dashboardCache.set(cacheKey, {
    timestamp: Date.now(),
    data: result,
  });

  return result;
}

/**
 * Generate reconciled financial sales report for export or reporting view
 */
export async function getSalesReportMetrics({ startDate, endDate } = {}) {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.createdAt.lte = e;
    }
  }

  const [orders, payments] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        status: true,
        amount: true,
        provider: true,
        createdAt: true,
      },
    }),
  ]);

  const totalOrdersPlaced = orders.length;
  const eligibleOrders = orders.filter((o) => ELIGIBLE_ORDER_STATUSES.includes(o.status));
  const grossRevenue = eligibleOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const capturedPayments = payments.filter((p) => p.status === 'SUCCEEDED');
  const netCapturedRevenue = capturedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const aov = eligibleOrders.length > 0 ? grossRevenue / eligibleOrders.length : 0;

  return {
    totalOrdersPlaced,
    paidOrdersCount: eligibleOrders.length,
    grossRevenue: Number(grossRevenue.toFixed(2)),
    netCapturedRevenue: Number(netCapturedRevenue.toFixed(2)),
    averageOrderValue: Number(aov.toFixed(2)),
    paymentsCapturedCount: capturedPayments.length,
    failedPaymentsCount: payments.filter((p) => p.status === 'FAILED').length,
    pendingPaymentsCount: payments.filter((p) => ['CREATED', 'PENDING', 'AUTHORIZED'].includes(p.status)).length,
  };
}
