import { prisma } from '../config/prisma.js';
import { getSalesReportMetrics, ELIGIBLE_ORDER_STATUSES } from '../services/adminAnalyticsService.js';

export async function getSalesReport(req, res) {
  try {
    const { startDate, endDate } = req.query;
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

    const [metrics, orders, orderItems, coupons, collections] = await Promise.all([
      getSalesReportMetrics({ startDate, endDate }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          discountAmount: true,
          createdAt: true,
        },
      }),
      prisma.orderItem.findMany({
        where: {
          order: where,
        },
        include: {
          order: { select: { status: true } },
          product: {
            select: {
              id: true,
              name: true,
              collectionId: true,
              collection: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.coupon.findMany({
        orderBy: { usedCount: 'desc' },
      }),
      prisma.collection.findMany({
        include: { _count: { select: { products: true } } },
      }),
    ]);

    // Orders by Lifecycle Status
    const ordersByStatus = {
      PENDING_PAYMENT: 0,
      PENDING_CONFIRMATION: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (ordersByStatus[o.status] !== undefined) {
        ordersByStatus[o.status]++;
      }
    });

    // Real Sales by Collection Aggregation
    const collectionSalesMap = {};
    collections.forEach((col) => {
      collectionSalesMap[col.id] = {
        collectionId: col.id,
        name: col.name,
        productCount: col._count.products,
        orderCount: 0,
        totalUnits: 0,
        grossSales: 0,
      };
    });

    const uniqueOrderCollectionPairs = new Set();

    orderItems.forEach((item) => {
      const isEligible = ELIGIBLE_ORDER_STATUSES.includes(item.order.status);
      const colId = item.product?.collectionId || item.collectionId;

      if (!collectionSalesMap[colId]) {
        collectionSalesMap[colId] = {
          collectionId: colId,
          name: item.product?.collection?.name || colId,
          productCount: 0,
          orderCount: 0,
          totalUnits: 0,
          grossSales: 0,
        };
      }

      if (isEligible) {
        collectionSalesMap[colId].totalUnits += item.quantity;
        collectionSalesMap[colId].grossSales += Number(item.lineTotal);

        const pairKey = `${item.orderId || ''}_${colId}`;
        if (!uniqueOrderCollectionPairs.has(pairKey)) {
          uniqueOrderCollectionPairs.add(pairKey);
          collectionSalesMap[colId].orderCount++;
        }
      }
    });

    const salesByCollection = Object.values(collectionSalesMap).map((c) => ({
      ...c,
      grossSales: Number(c.grossSales.toFixed(2)),
    }));

    // Promotion Usage stats
    const promotionUsage = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name || c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      usedCount: c.usedCount,
      usageLimit: c.usageLimit,
      isActive: c.isActive,
      expiresAt: c.expiresAt,
    }));

    return res.status(200).json({
      success: true,
      report: {
        ...metrics,
        summary: metrics,
        ordersByStatus,
        salesByCollection,
        promotionUsage,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (err) {
    console.error('[ADMIN SALES REPORT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate comprehensive sales report',
    });
  }
}

/**
 * Escapes CSV field with RFC 4180 quotes and spreadsheet formula injection protection
 */
function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');

  // Prevent spreadsheet formula execution injection (=, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

export async function exportCsv(req, res) {
  try {
    const { type = 'orders', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = e;
      }
    }

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where: dateFilter,
        take: 2000,
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'Order Reference',
        'Date (ISO)',
        'Customer Name',
        'Customer Email',
        'Phone',
        'City',
        'State',
        'Pincode',
        'Status',
        'Payment Status',
        'Subtotal (INR)',
        'Discount (INR)',
        'Shipping (INR)',
        'Total (INR)',
      ];

      const rows = orders.map((o) => [
        escapeCsvField(o.orderReference),
        escapeCsvField(o.createdAt.toISOString()),
        escapeCsvField(o.customerName),
        escapeCsvField(o.customerEmail),
        escapeCsvField(o.customerPhone),
        escapeCsvField(o.city),
        escapeCsvField(o.state),
        escapeCsvField(o.pincode),
        escapeCsvField(o.status),
        escapeCsvField(o.paymentStatus),
        escapeCsvField(Number(o.subtotal).toFixed(2)),
        escapeCsvField(Number(o.discountAmount).toFixed(2)),
        escapeCsvField(Number(o.shippingAmount).toFixed(2)),
        escapeCsvField(Number(o.totalAmount).toFixed(2)),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="amoga-orders-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvContent);
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: { collection: true },
      });

      const headers = [
        'Product Name',
        'Collection',
        'Slug',
        'Price (INR)',
        'Stock Quantity',
        'In Stock Status',
        'Active on Storefront',
        'Pack Size',
      ];

      const rows = products.map((p) => [
        escapeCsvField(p.name),
        escapeCsvField(p.collection?.name || p.collectionId),
        escapeCsvField(p.slug),
        escapeCsvField(p.price ? Number(p.price).toFixed(2) : 'N/A'),
        escapeCsvField(p.stockQuantity),
        escapeCsvField(p.inStock ? 'YES' : 'NO'),
        escapeCsvField(p.isActive ? 'ACTIVE' : 'HIDDEN'),
        escapeCsvField(p.packSize || 'N/A'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="amoga-inventory-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvContent);
    }

    if (type === 'collections') {
      const collections = await prisma.collection.findMany({
        include: { _count: { select: { products: true } } },
      });

      const headers = [
        'Collection ID',
        'Collection Name',
        'Slug',
        'Tagline',
        'Hero Heading',
        'Hero Subheading',
        'Active Status',
        'Registered Products',
      ];

      const rows = collections.map((c) => [
        escapeCsvField(c.id),
        escapeCsvField(c.name),
        escapeCsvField(c.slug),
        escapeCsvField(c.tagline || ''),
        escapeCsvField(c.heroHeading || ''),
        escapeCsvField(c.heroSubheading || ''),
        escapeCsvField(c.isActive ? 'ACTIVE' : 'INACTIVE'),
        escapeCsvField(c._count.products),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="amoga-collections-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvContent);
    }

    if (type === 'promotions' || type === 'coupons') {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'Coupon Code',
        'Promotion Name',
        'Discount Type',
        'Discount Value',
        'Min Order (INR)',
        'Max Discount (INR)',
        'Usage Count',
        'Usage Limit',
        'Active Status',
        'Expires At',
      ];

      const rows = coupons.map((c) => [
        escapeCsvField(c.code),
        escapeCsvField(c.name || ''),
        escapeCsvField(c.discountType),
        escapeCsvField(Number(c.discountValue)),
        escapeCsvField(c.minOrderAmount ? Number(c.minOrderAmount) : 'None'),
        escapeCsvField(c.maxDiscountAmount ? Number(c.maxDiscountAmount) : 'None'),
        escapeCsvField(c.usedCount),
        escapeCsvField(c.usageLimit || 'Unlimited'),
        escapeCsvField(c.isActive ? 'ACTIVE' : 'INACTIVE'),
        escapeCsvField(c.expiresAt ? c.expiresAt.toISOString().split('T')[0] : 'None'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="amoga-promotions-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvContent);
    }

    return res.status(400).json({
      error: 'INVALID_TYPE',
      message: 'Supported export types: orders, inventory, collections, promotions',
    });
  } catch (err) {
    console.error('[ADMIN EXPORT CSV ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to export CSV report',
    });
  }
}
