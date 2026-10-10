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
        take: 8,
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
    });

    const paidRevenue = paidPaymentsAgg._sum.amount ? Number(paidPaymentsAgg._sum.amount) : 0;
    const grossSales = validOrdersAgg._sum.totalAmount ? Number(validOrdersAgg._sum.totalAmount) : 0;

    // Build last 14 days trend data
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentTrendOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fourteenDaysAgo },
        status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date YYYY-MM-DD
    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
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
    });
  } catch (err) {
    console.error('[ADMIN DASHBOARD STATS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to compute dashboard metrics',
    });
  }
}
