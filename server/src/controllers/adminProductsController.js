import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listProducts(req, res) {
  try {
    const {
      q,
      collectionId,
      inStock,
      category,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (collectionId && collectionId !== 'all') {
      where.collectionId = String(collectionId);
    }

    if (category) {
      where.category = { contains: String(category), mode: 'insensitive' };
    }

    if (inStock !== undefined && inStock !== '') {
      where.inStock = inStock === 'true';
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { sourceId: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const sortField = ['name', 'price', 'createdAt', 'stockQuantity'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          collection: { select: { id: true, name: true } },
          variants: { select: { id: true, name: true, price: true, inStock: true, stockQuantity: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: products.map((p) => ({
        ...p,
        price: p.price ? Number(p.price) : null,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        variants: p.variants.map((v) => ({
          ...v,
          price: v.price ? Number(v.price) : null,
        })),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST PRODUCTS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve products list',
    });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        collection: true,
        variants: true,
        inventoryLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        price: product.price ? Number(product.price) : null,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        variants: product.variants.map((v) => ({
          ...v,
          price: v.price ? Number(v.price) : null,
        })),
      },
    });
  } catch (err) {
    console.error('[ADMIN GET PRODUCT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve product details',
    });
  }
}

export async function createProduct(req, res) {
  try {
    const {
      name,
      slug,
      collectionId,
      description,
      category,
      categoryName,
      price,
      originalPrice,
      image,
      gallery = [],
      stockQuantity = 50,
      inStock = true,
      isFeatured = false,
      badge,
      packSize,
      specs = {},
      variants = [],
    } = req.body;

    if (!name || !collectionId || !description) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Name, collection, and description are required',
      });
    }

    // Verify valid collection
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) {
      return res.status(400).json({
        error: 'INVALID_COLLECTION',
        message: `Collection "${collectionId}" does not exist`,
      });
    }

    // Generate or sanitize slug
    const cleanSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check duplicate slug in same collection
    const existingSlug = await prisma.product.findUnique({
      where: {
        collectionId_slug: {
          collectionId,
          slug: cleanSlug,
        },
      },
    });
    if (existingSlug) {
      return res.status(409).json({
        error: 'DUPLICATE_SLUG',
        message: `A product with slug "${cleanSlug}" already exists in this collection`,
      });
    }

    const sourcePrefix =
      collectionId === 'food'
        ? 'f'
        : collectionId === 'tea'
        ? 'tea'
        : collectionId === 'sarees'
        ? 's'
        : 'j';
    const sourceId = `${sourcePrefix}-${cleanSlug}-${Date.now().toString(36)}`;

    // Create product and variants in transaction
    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sourceId,
          collectionId,
          slug: cleanSlug,
          name: name.trim(),
          description: description.trim(),
          category: category || collection.name,
          categoryName: categoryName || category || collection.name,
          price: price !== undefined && price !== null ? Number(price) : null,
          originalPrice: originalPrice ? Number(originalPrice) : null,
          image: image || '/placeholder-luxury.jpg',
          gallery: Array.isArray(gallery) ? gallery : [],
          packSize: packSize || null,
          stockQuantity: Math.max(0, parseInt(stockQuantity, 10) || 0),
          inStock: Boolean(inStock),
          isFeatured: Boolean(isFeatured),
          badge: badge || null,
          specs: specs || {},
          isActive: true,
          verified: true,
        },
      });

      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          if (v.name && v.name.trim()) {
            await tx.productVariant.create({
              data: {
                productId: product.id,
                name: v.name.trim(),
                sku: v.sku || null,
                price: v.price ? Number(v.price) : null,
                stockQuantity: Math.max(0, parseInt(v.stockQuantity, 10) || 25),
                inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
                attributes: v.attributes || {},
              },
            });
          }
        }
      }

      return product;
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: createdProduct.id,
      details: { name: createdProduct.name, collectionId, slug: cleanSlug },
    });

    return res.status(201).json({
      success: true,
      product: createdProduct,
    });
  } catch (err) {
    console.error('[ADMIN CREATE PRODUCT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create product',
    });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      collectionId,
      description,
      category,
      categoryName,
      price,
      originalPrice,
      image,
      gallery,
      stockQuantity,
      inStock,
      isFeatured,
      badge,
      packSize,
      specs,
      variants,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Product not found',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (category !== undefined) updateData.category = category;
      if (categoryName !== undefined) updateData.categoryName = categoryName;
      if (price !== undefined) updateData.price = price !== null ? Number(price) : null;
      if (originalPrice !== undefined) updateData.originalPrice = originalPrice !== null ? Number(originalPrice) : null;
      if (image !== undefined) updateData.image = image;
      if (gallery !== undefined) updateData.gallery = gallery;
      if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
      if (inStock !== undefined) updateData.inStock = Boolean(inStock);
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (badge !== undefined) updateData.badge = badge;
      if (packSize !== undefined) updateData.packSize = packSize;
      if (specs !== undefined) updateData.specs = specs;

      const p = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // Handle variant syncing if variants provided
      if (Array.isArray(variants)) {
        const keptIds = variants.filter((v) => v.id).map((v) => v.id);
        await tx.productVariant.deleteMany({
          where: {
            productId: id,
            id: { notIn: keptIds },
          },
        });

        for (const v of variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name?.trim(),
                sku: v.sku,
                price: v.price ? Number(v.price) : null,
                stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : undefined,
                inStock: v.inStock !== undefined ? Boolean(v.inStock) : undefined,
                attributes: v.attributes,
              },
            });
          } else if (v.name && v.name.trim()) {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name.trim(),
                sku: v.sku || null,
                price: v.price ? Number(v.price) : null,
                stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : 25,
                inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
                attributes: v.attributes || {},
              },
            });
          }
        }
      }

      return p;
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: id,
      details: { name: updated.name },
    });

    return res.status(200).json({
      success: true,
      product: updated,
    });
  } catch (err) {
    console.error('[ADMIN UPDATE PRODUCT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update product',
    });
  }
}

export async function archiveProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'PRODUCT_ARCHIVE',
      entityType: 'Product',
      entityId: id,
      details: { name: product.name },
    });

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" archived successfully`,
    });
  } catch (err) {
    console.error('[ADMIN ARCHIVE PRODUCT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to archive product',
    });
  }
}

export async function restoreProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'PRODUCT_RESTORE',
      entityType: 'Product',
      entityId: id,
      details: { name: product.name },
    });

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" restored successfully`,
    });
  } catch (err) {
    console.error('[ADMIN RESTORE PRODUCT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to restore product',
    });
  }
}
