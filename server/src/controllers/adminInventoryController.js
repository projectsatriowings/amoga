import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import { adjustStock as serviceAdjustStock } from '../services/inventoryService.js';

/**
 * List inventory with on-hand, reserved, and available quantities,
 * plus high-level KPI counts (total tracked, low-stock, out-of-stock, restock subscriptions).
 */
export async function listInventory(req, res) {
  try {
    const { collectionId, status, q, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const where = { isActive: true };

    if (collectionId && collectionId !== 'all') {
      where.collectionId = String(collectionId);
    }

    if (status === 'low') {
      where.inStock = true;
      where.stockQuantity = { lte: 10, gt: 0 };
    } else if (status === 'out') {
      where.OR = [{ inStock: false }, { stockQuantity: { lte: 0 } }];
    } else if (status === 'in') {
      where.inStock = true;
      where.stockQuantity = { gt: 10 };
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { sourceId: { contains: searchTerm, mode: 'insensitive' } },
        {
          variants: {
            some: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { sku: { contains: searchTerm, mode: 'insensitive' } },
                { sourceId: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // High-level KPI aggregations across active catalogue
    const [
      total,
      products,
      totalVariants,
      lowStockProducts,
      outOfStockProducts,
      pendingSubscriptionsCount,
    ] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ inStock: 'asc' }, { stockQuantity: 'asc' }],
        include: {
          collection: { select: { id: true, name: true } },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              sourceId: true,
              stockQuantity: true,
              reservedQuantity: true,
              lowStockThreshold: true,
              inStock: true,
            },
          },
        },
      }),
      prisma.productVariant.count(),
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
      prisma.restockSubscription.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const formattedInventory = products.map((p) => {
      const pOnHand = Math.max(0, p.stockQuantity || 0);
      const pReserved = Math.max(0, p.reservedQuantity || 0);
      const pAvailable = Math.max(0, pOnHand - pReserved);
      const pThreshold = p.lowStockThreshold || 5;

      const formattedVariants = (p.variants || []).map((v) => {
        const vOnHand = Math.max(0, v.stockQuantity || 0);
        const vReserved = Math.max(0, v.reservedQuantity || 0);
        const vAvailable = Math.max(0, vOnHand - vReserved);
        const vThreshold = v.lowStockThreshold || 5;

        return {
          id: v.id,
          name: v.name,
          sku: v.sku || v.sourceId || v.id,
          stockQuantity: vOnHand, // on-hand
          onHandQuantity: vOnHand,
          reservedQuantity: vReserved,
          availableQuantity: vAvailable,
          lowStockThreshold: vThreshold,
          inStock: v.inStock && vAvailable > 0,
          status: vAvailable <= 0 ? 'OUT_OF_STOCK' : (vAvailable <= vThreshold ? 'LOW_STOCK' : 'IN_STOCK'),
        };
      });

      return {
        id: p.id,
        sourceId: p.sourceId,
        sku: p.sourceId,
        name: p.name,
        slug: p.slug,
        collectionId: p.collectionId,
        collectionName: p.collection.name,
        stockQuantity: pOnHand, // backwards compatibility
        onHandQuantity: pOnHand,
        reservedQuantity: pReserved,
        availableQuantity: pAvailable,
        lowStockThreshold: pThreshold,
        inStock: p.inStock && pAvailable > 0,
        status: pAvailable <= 0 ? 'OUT_OF_STOCK' : (pAvailable <= pThreshold ? 'LOW_STOCK' : 'IN_STOCK'),
        variantsCount: p.variants.length,
        variants: formattedVariants,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalTrackedProducts: total,
        totalTrackedSkus: total + totalVariants,
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts,
        pendingSubscriptionsCount,
      },
      inventory: formattedInventory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST INVENTORY ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve inventory data',
    });
  }
}

/**
 * Adjust stock through the centralized inventory service
 */
export async function adjustStock(req, res) {
  try {
    const { productId, variantId, newStock, lowStockThreshold, reason } = req.body;

    if (!productId || newStock === undefined || !reason) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Product ID, new stock quantity, and adjustment reason are required',
      });
    }

    const result = await serviceAdjustStock({
      admin: req.admin,
      productId,
      variantId: variantId || null,
      newStock,
      lowStockThreshold,
      reason,
    });

    return res.status(200).json({
      success: true,
      message: `Stock updated for ${result.targetName}`,
      result,
    });
  } catch (err) {
    if (err.message === 'PRODUCT_NOT_FOUND' || err.message === 'VARIANT_NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    }
    console.error('[ADMIN ADJUST STOCK ERROR]:', err);
    return res.status(err.status || 500).json({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Failed to adjust stock',
    });
  }
}

/**
 * Update low-stock threshold for a product or variant
 */
export async function updateThreshold(req, res) {
  try {
    const { productId, variantId, lowStockThreshold } = req.body;

    if (!productId || lowStockThreshold === undefined) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Product ID and lowStockThreshold are required',
      });
    }

    const thresholdNum = Math.max(0, parseInt(lowStockThreshold, 10));

    if (variantId) {
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { lowStockThreshold: thresholdNum },
      });
      return res.status(200).json({ success: true, variant });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { lowStockThreshold: thresholdNum },
    });

    return res.status(200).json({ success: true, product });
  } catch (err) {
    console.error('[ADMIN UPDATE THRESHOLD ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update threshold',
    });
  }
}

/**
 * Retrieve inventory movement logs with order references and actor tracking
 */
export async function getInventoryLogs(req, res) {
  try {
    const { productId, limit = 50 } = req.query;
    const where = {};
    if (productId) where.productId = String(productId);

    const logs = await prisma.inventoryLog.findMany({
      where,
      take: Math.min(100, parseInt(limit, 10) || 50),
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true, sourceId: true } },
        variant: { select: { name: true, sku: true } },
      },
    });

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error('[ADMIN INVENTORY LOGS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve inventory logs',
    });
  }
}

/**
 * Retrieve active customer restock subscriptions
 */
export async function listRestockSubscriptions(req, res) {
  try {
    const { status = 'ACTIVE', limit = 50 } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;

    const subscriptions = await prisma.restockSubscription.findMany({
      where,
      take: Math.min(100, parseInt(limit, 10) || 50),
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true, sourceId: true } },
        variant: { select: { name: true, sku: true } },
      },
    });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (err) {
    console.error('[ADMIN RESTOCK SUBSCRIPTIONS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve restock subscriptions',
    });
  }
}

/**
 * Retrieve active inventory threshold alerts and notification logs
 */
export async function getInventoryAlerts(req, res) {
  try {
    const [alerts, notificationJobs] = await Promise.all([
      prisma.inventoryAlert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          product: { select: { name: true, slug: true } },
          variant: { select: { name: true } },
        },
      }),
      prisma.restockNotificationJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      alerts,
      notificationJobs,
    });
  } catch (err) {
    console.error('[ADMIN INVENTORY ALERTS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve inventory alerts',
    });
  }
}
