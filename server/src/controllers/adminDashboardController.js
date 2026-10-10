import { prisma } from '../config/prisma.js';

export async function getDashboardStats(req, res) {
  try {
    const [
      totalOrders,
      ordersByStatusGroup,
      paidPaymentsAgg,
      pendingPaymentsCount,
      failedPaymentsCount,
      confirmedOrdersCount,
      processingOrdersCount,
      lowStockProducts,
      outOfStockProducts,
      recentOrders,
      orderItemsByCollection,
      totalUnitsSoldAgg,
      orderItemsByProduct,
      allActiveProducts,
      lowStockList,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true, amountPaise: true },
        _count: true,
      }),
      prisma.payment.count({
        where: { status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] } },
      }),
      prisma.payment.count({
        where: { status: 'FAILED' },
      }),
      prisma.order.count({
        where: { status: 'CONFIRMED' },
      }),
      prisma.order.count({
        where: { status: 'PROCESSING' },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          inStock: true,
          stockQuantity: { lte: 10, gt: 0 },
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          OR: [{ inStock: false }, { stockQuantity: { lte: 0 } }],
        },
      }),
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
      prisma.orderItem.groupBy({
        by: ['collectionId'],
        _sum: { quantity: true, lineTotal: true },
        _count: true,
      }),
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
      }),
      prisma.orderItem.groupBy({
        by: ['productId', 'productName', 'collectionId'],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: 15,
      }),
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
        take: 30,
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { lte: 10 },
        },
        orderBy: { stockQuantity: 'asc' },
        take: 5,
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

    // Format orders by status map
    const ordersByStatus = {
      PENDING_PAYMENT: 0,
      PENDING_CONFIRMATION: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const item of ordersByStatusGroup) {
      if (item.status) {
        ordersByStatus[item.status] = item._count;
      }
    }

    // Calculate gross sales (orders not cancelled or pending payment)
    const validOrdersAgg = await prisma.order.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const paidRevenue = paidPaymentsAgg._sum.amount ? Number(paidPaymentsAgg._sum.amount) : 0;
    const grossSales = validOrdersAgg._sum.totalAmount ? Number(validOrdersAgg._sum.totalAmount) : 0;
    const validOrdersCount = validOrdersAgg._count || 0;
    const averageOrderValue = validOrdersCount > 0 ? Number((grossSales / validOrdersCount).toFixed(2)) : 0;

    const totalPaidAttempts = (paidPaymentsAgg._count || 0) + failedPaymentsCount;
    const paymentSuccessRate = totalPaidAttempts > 0
      ? Math.round(((paidPaymentsAgg._count || 0) / totalPaidAttempts) * 100)
      : 100;

    // Build last 30 days trend data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrendOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date YYYY-MM-DD
    const trendMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
    }

    for (const ord of recentTrendOrders) {
      const dateKey = ord.createdAt.toISOString().split('T')[0];
      if (trendMap[dateKey]) {
        trendMap[dateKey].revenue += Number(ord.totalAmount);
        trendMap[dateKey].orders += 1;
      }
    }

    const salesTrends = Object.values(trendMap);

    // Build enriched top selling products list
    const productLookup = new Map();
    for (const p of allActiveProducts) {
      productLookup.set(p.id, p);
    }

    const topSellingMap = new Map();
    for (const item of orderItemsByProduct) {
      const p = item.productId ? productLookup.get(item.productId) : null;
      const key = item.productId || item.productName;
      topSellingMap.set(key, {
        id: item.productId || `order-item-${key}`,
        name: p?.name || item.productName,
        slug: p?.slug || '',
        image: p?.image || '',
        collectionId: p?.collectionId || item.collectionId,
        price: p?.price !== null && p?.price !== undefined ? Number(p.price) : 0,
        unitsSold: item._sum.quantity || 0,
        revenue: Number(item._sum.lineTotal || 0),
        stockQuantity: p?.stockQuantity ?? 50,
        inStock: p?.inStock ?? true,
      });
    }

    // Pad with active catalogue products if sales records are sparse
    for (const p of allActiveProducts) {
      if (!topSellingMap.has(p.id) && topSellingMap.size < 15) {
        topSellingMap.set(p.id, {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image || '',
          collectionId: p.collectionId,
          price: p.price !== null ? Number(p.price) : 0,
          unitsSold: 0,
          revenue: 0,
          stockQuantity: p.stockQuantity ?? 50,
          inStock: p.inStock ?? true,
        });
      }
    }

    const topSellingProducts = Array.from(topSellingMap.values());

    return res.status(200).json({
      success: true,
      metrics: {
        totalOrders,
        ordersByStatus,
        ordersRequiringFulfilment: confirmedOrdersCount + processingOrdersCount,
        paidRevenue: Number(paidRevenue.toFixed(2)),
        grossSales: Number(grossSales.toFixed(2)),
        pendingPayments: pendingPaymentsCount,
        failedPayments: failedPaymentsCount,
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts,
        totalUnitsSold: totalUnitsSoldAgg._sum.quantity || 0,
        averageOrderValue,
        paymentSuccessRate,
      },
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
      salesTrends,
      collectionPerformance: orderItemsByCollection.map((c) => ({
        collectionId: c.collectionId,
        totalQuantitySold: c._sum.quantity || 0,
        totalRevenue: Number(c._sum.lineTotal || 0),
        itemsCount: c._count,
      })),
      topSellingProducts,
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
    });
  } catch (err) {
    console.error('[ADMIN DASHBOARD STATS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to compute dashboard metrics',
    });
  }
}
