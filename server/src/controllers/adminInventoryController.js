import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

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
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { sourceId: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
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
              stockQuantity: true,
              inStock: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      inventory: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        collectionId: p.collectionId,
        collectionName: p.collection.name,
        stockQuantity: p.stockQuantity,
        inStock: p.inStock,
        variantsCount: p.variants.length,
        variants: p.variants,
      })),
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

export async function adjustStock(req, res) {
  try {
    const { productId, variantId, newStock, reason } = req.body;

    if (!productId || newStock === undefined || !reason) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Product ID, new stock quantity, and adjustment reason are required',
      });
    }

    const targetStock = Math.max(0, parseInt(newStock, 10));

    const result = await prisma.$transaction(async (tx) => {
      let previousStock = 0;
      let targetName = '';

      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });

        if (!variant || variant.productId !== productId) {
          throw new Error('VARIANT_NOT_FOUND');
        }

        previousStock = variant.stockQuantity;
        targetName = `${variant.product.name} (${variant.name})`;

        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockQuantity: targetStock,
            inStock: targetStock > 0,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error('PRODUCT_NOT_FOUND');
        }

        previousStock = product.stockQuantity;
        targetName = product.name;

        await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: targetStock,
            inStock: targetStock > 0,
          },
        });
      }

      const delta = targetStock - previousStock;

      const log = await tx.inventoryLog.create({
        data: {
          productId,
          variantId: variantId || null,
          previousStock,
          adjustedStock: targetStock,
          delta,
          reason: reason.trim(),
          adminEmail: req.admin.email,
          adminId: req.admin.id,
        },
      });

      return { previousStock, adjustedStock: targetStock, delta, targetName, logId: log.id };
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'STOCK_ADJUST',
      entityType: variantId ? 'ProductVariant' : 'Product',
      entityId: variantId || productId,
      details: {
        product: result.targetName,
        from: result.previousStock,
        to: result.adjustedStock,
        reason: reason.trim(),
      },
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
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to adjust stock',
    });
  }
}

export async function getInventoryLogs(req, res) {
  try {
    const { productId, limit = 20 } = req.query;
    const where = {};
    if (productId) where.productId = String(productId);

    const logs = await prisma.inventoryLog.findMany({
      where,
      take: Math.min(100, parseInt(limit, 10) || 20),
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true } },
        variant: { select: { name: true } },
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
