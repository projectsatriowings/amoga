import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import { broadcastProductUpdate } from './productsController.js';
import {
  generateProductSku,
  generateVariantSku,
  validateCustomSku,
  resolveSkuPrefix,
} from '../services/skuService.js';
import {
  validateHsnCode,
  validateGstRate,
  validateProductTaxCompliance,
} from '../services/taxService.js';

export async function listProducts(req, res) {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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
      lowStockThreshold = 5,
      inStock = true,
      isFeatured = false,
      badge,
      packSize,
      specs = {},
      variants = [],
      sku,
      hsnCode,
      gstRate,
      isTaxInclusive = true,
      cessRate = 0,
      taxClassification = 'GOODS',
      isActive = true,
      status,
    } = req.body;

    if (!name || !collectionId) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Product name and collection are required',
      });
    }

    const cleanDescription = (description || '').trim();

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

    // Validate tax compliance before live publication
    const cleanHsn = hsnCode ? String(hsnCode).trim() : null;
    const numGstRate = gstRate !== undefined && gstRate !== null ? Number(gstRate) : null;
    const numPrice = price !== undefined && price !== null ? Number(price) : null;

    if (cleanHsn) {
      const hsnCheck = validateHsnCode(cleanHsn);
      if (!hsnCheck.isValid) {
        return res.status(400).json({ error: 'INVALID_HSN', message: hsnCheck.message });
      }
    }

    if (numGstRate !== null) {
      const gstCheck = validateGstRate(numGstRate);
      if (!gstCheck.isValid) {
        return res.status(400).json({ error: 'INVALID_GST_RATE', message: gstCheck.message });
      }
    }

    const explicitlyRequestedActive = status === 'active' || req.body.isActive === true;
    let finalIsActive = false;
    const compliance = validateProductTaxCompliance({
      price: numPrice,
      hsnCode: cleanHsn,
      gstRate: numGstRate,
    });
    if (compliance.isCompliant) {
      finalIsActive = req.body.isActive !== false && status !== 'draft';
    } else {
      finalIsActive = false;
      if (explicitlyRequestedActive) {
        return res.status(400).json({
          error: 'TAX_COMPLIANCE_REQUIRED',
          message: `Cannot publish product for live sale: ${compliance.errors.join(' ')} Products with missing required tax details must remain draft or be blocked from live sale.`,
        });
      }
    }

    // SKU Generation & Validation
    let finalSku = null;
    if (sku && String(sku).trim()) {
      const skuCheck = await validateCustomSku(sku);
      if (!skuCheck.isValid) {
        return res.status(400).json({ error: 'INVALID_SKU', message: skuCheck.message });
      }
      finalSku = skuCheck.cleanSku;
    } else {
      finalSku = await generateProductSku(collectionId, category || collection.name);
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
          description: cleanDescription,
          category: category || collection.name,
          categoryName: categoryName || category || collection.name,
          price: numPrice,
          originalPrice: originalPrice ? Number(originalPrice) : null,
          image: image || '/placeholder-luxury.jpg',
          gallery: Array.isArray(gallery) ? gallery : [],
          packSize: packSize || null,
          stockQuantity: Math.max(0, parseInt(stockQuantity, 10) || 0),
          lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10) || 5),
          inStock: Boolean(inStock),
          isFeatured: Boolean(isFeatured),
          badge: badge || null,
          specs: specs || {},
          isActive: finalIsActive,
          verified: true,
          sku: finalSku,
          hsnCode: cleanHsn,
          gstRate: numGstRate,
          isTaxInclusive: Boolean(isTaxInclusive),
          cessRate: Number(cessRate || 0),
          taxClassification: String(taxClassification || 'GOODS').trim(),
          taxTreatment: req.body.taxTreatment || 'TAXABLE',
          taxVerificationStatus: req.body.taxVerificationStatus || 'PENDING_VERIFICATION',
          taxConfirmedBy: (req.body.taxVerificationStatus === 'VERIFIED') ? (req.admin?.email || 'admin@amoga.com') : null,
          taxConfirmedAt: (req.body.taxVerificationStatus === 'VERIFIED') ? new Date() : null,
          taxNotes: req.body.taxNotes ? String(req.body.taxNotes).trim() : null,
        },
      });

      if (Array.isArray(variants) && variants.length > 0) {
        let variantIndex = 1;
        for (const v of variants) {
          if (v.name && v.name.trim()) {
            let variantSku = null;
            if (v.sku && String(v.sku).trim()) {
              const vCheck = await validateCustomSku(v.sku, {}, tx);
              if (!vCheck.isValid) {
                throw new Error(vCheck.message);
              }
              variantSku = vCheck.cleanSku;
            } else {
              variantSku = generateVariantSku(finalSku, variantIndex);
            }
            variantIndex++;

            await tx.productVariant.create({
              data: {
                productId: product.id,
                name: v.name.trim(),
                sku: variantSku,
                price: v.price ? Number(v.price) : null,
                hsnCode: v.hsnCode ? String(v.hsnCode).trim() : cleanHsn,
                gstRate: v.gstRate !== undefined && v.gstRate !== null ? Number(v.gstRate) : numGstRate,
                isTaxInclusive: v.isTaxInclusive !== undefined ? Boolean(v.isTaxInclusive) : Boolean(isTaxInclusive),
                cessRate: v.cessRate !== undefined ? Number(v.cessRate) : Number(cessRate || 0),
                taxTreatment: v.taxTreatment || req.body.taxTreatment || 'TAXABLE',
                taxVerificationStatus: v.taxVerificationStatus || req.body.taxVerificationStatus || 'PENDING_VERIFICATION',
                taxConfirmedBy: (v.taxVerificationStatus === 'VERIFIED' || req.body.taxVerificationStatus === 'VERIFIED') ? (req.admin?.email || 'admin@amoga.com') : null,
                taxConfirmedAt: (v.taxVerificationStatus === 'VERIFIED' || req.body.taxVerificationStatus === 'VERIFIED') ? new Date() : null,
                taxNotes: v.taxNotes ? String(v.taxNotes).trim() : null,
                stockQuantity: Math.max(0, parseInt(v.stockQuantity, 10) || 25),
                lowStockThreshold: Math.max(0, parseInt(v.lowStockThreshold, 10) || 5),
                inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
                attributes: v.attributes || {},
              },
            });
          }
        }
      }

      return product;
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        collection: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: createdProduct.id,
      details: { name: createdProduct.name, collectionId, slug: cleanSlug },
    });

    // Notify all open storefront sessions across browsers immediately
    broadcastProductUpdate(collectionId);

    return res.status(201).json({
      success: true,
      product: {
        ...(fullProduct || createdProduct),
        price: (fullProduct || createdProduct).price ? Number((fullProduct || createdProduct).price) : null,
        originalPrice: (fullProduct || createdProduct).originalPrice ? Number((fullProduct || createdProduct).originalPrice) : null,
      },
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
      lowStockThreshold,
      inStock,
      isFeatured,
      badge,
      packSize,
      specs,
      variants,
      sku,
      hsnCode,
      gstRate,
      isTaxInclusive,
      cessRate,
      taxClassification,
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

    // Validate SKU uniqueness if updated
    let updatedSku = undefined;
    if (sku !== undefined && sku !== null) {
      const cleanSku = String(sku).trim();
      if (cleanSku && cleanSku !== existingProduct.sku) {
        const skuCheck = await validateCustomSku(cleanSku, { excludeProductId: id });
        if (!skuCheck.isValid) {
          return res.status(400).json({ error: 'INVALID_SKU', message: skuCheck.message });
        }
        updatedSku = skuCheck.cleanSku;
      } else if (!cleanSku && !existingProduct.sku) {
        // Auto-generate if was missing
        updatedSku = await generateProductSku(existingProduct.collectionId, existingProduct.category);
      }
    }

    // Validate tax fields
    let updatedHsn = undefined;
    if (hsnCode !== undefined) {
      if (hsnCode && String(hsnCode).trim()) {
        const hsnCheck = validateHsnCode(String(hsnCode).trim());
        if (!hsnCheck.isValid) {
          return res.status(400).json({ error: 'INVALID_HSN', message: hsnCheck.message });
        }
        updatedHsn = hsnCheck.cleanHsn;
      } else {
        updatedHsn = null;
      }
    }

    let updatedGstRate = undefined;
    if (gstRate !== undefined) {
      if (gstRate !== null && gstRate !== '') {
        const gstCheck = validateGstRate(gstRate);
        if (!gstCheck.isValid) {
          return res.status(400).json({ error: 'INVALID_GST_RATE', message: gstCheck.message });
        }
        updatedGstRate = gstCheck.rate;
      } else {
        updatedGstRate = null;
      }
    }

    const { status } = req.body;
    const requestedActive = status
      ? status === 'active'
      : (req.body.isActive !== undefined ? Boolean(req.body.isActive) : existingProduct.isActive);

    let finalIsActive = existingProduct.isActive;
    const finalPrice = price !== undefined ? (price !== null ? Number(price) : null) : (existingProduct.price ? Number(existingProduct.price) : null);
    const finalHsn = updatedHsn !== undefined ? updatedHsn : existingProduct.hsnCode;
    const finalGst = updatedGstRate !== undefined ? updatedGstRate : (existingProduct.gstRate !== null ? Number(existingProduct.gstRate) : null);

    const compliance = validateProductTaxCompliance({
      price: finalPrice,
      hsnCode: finalHsn,
      gstRate: finalGst,
    });

    if (status !== undefined || req.body.isActive !== undefined) {
      if (requestedActive) {
        if (!compliance.isCompliant) {
          return res.status(400).json({
            error: 'TAX_COMPLIANCE_REQUIRED',
            message: `Cannot publish product for live sale: ${compliance.errors.join(' ')} Save as inactive draft instead.`,
          });
        }
        finalIsActive = true;
      } else {
        finalIsActive = false;
      }
    } else if (!compliance.isCompliant && finalIsActive) {
      finalIsActive = false;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = (description || '').trim();
      if (category !== undefined) updateData.category = category;
      if (categoryName !== undefined) updateData.categoryName = categoryName;
      if (price !== undefined) updateData.price = price !== null ? Number(price) : null;
      if (originalPrice !== undefined) updateData.originalPrice = originalPrice !== null ? Number(originalPrice) : null;
      if (image !== undefined) updateData.image = image;
      if (gallery !== undefined) updateData.gallery = gallery;
      if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
      if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 5);
      if (inStock !== undefined) updateData.inStock = Boolean(inStock);
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (badge !== undefined) updateData.badge = badge;
      if (packSize !== undefined) updateData.packSize = packSize;
      if (specs !== undefined) updateData.specs = specs;
      if (status !== undefined || req.body.isActive !== undefined) updateData.isActive = finalIsActive;
      if (updatedSku !== undefined) updateData.sku = updatedSku;
      if (updatedHsn !== undefined) updateData.hsnCode = updatedHsn;
      if (updatedGstRate !== undefined) updateData.gstRate = updatedGstRate;
      if (isTaxInclusive !== undefined) updateData.isTaxInclusive = Boolean(isTaxInclusive);
      if (cessRate !== undefined) updateData.cessRate = Number(cessRate || 0);
      if (taxClassification !== undefined) updateData.taxClassification = String(taxClassification).trim();
      if (req.body.taxTreatment !== undefined) updateData.taxTreatment = req.body.taxTreatment;
      if (req.body.taxVerificationStatus !== undefined) {
        updateData.taxVerificationStatus = req.body.taxVerificationStatus;
        if (req.body.taxVerificationStatus === 'VERIFIED') {
          updateData.taxConfirmedBy = req.admin?.email || 'admin@amoga.com';
          updateData.taxConfirmedAt = new Date();
        } else if (req.body.taxVerificationStatus === 'PENDING_VERIFICATION') {
          updateData.taxConfirmedBy = null;
          updateData.taxConfirmedAt = null;
        }
      }
      if (req.body.taxNotes !== undefined) updateData.taxNotes = req.body.taxNotes ? String(req.body.taxNotes).trim() : null;

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

        const effectiveParentSku = updatedSku || existingProduct.sku || 'AMOGA-PRD';
        let vIndex = 1;
        for (const v of variants) {
          if (v.id) {
            let vSku = v.sku;
            if (vSku && vSku.trim()) {
              const vCheck = await validateCustomSku(vSku, { excludeVariantId: v.id }, tx);
              if (!vCheck.isValid) throw new Error(vCheck.message);
              vSku = vCheck.cleanSku;
            }
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name?.trim(),
                sku: vSku,
                price: v.price ? Number(v.price) : null,
                hsnCode: v.hsnCode ? String(v.hsnCode).trim() : undefined,
                gstRate: v.gstRate !== undefined && v.gstRate !== null ? Number(v.gstRate) : undefined,
                isTaxInclusive: v.isTaxInclusive !== undefined ? Boolean(v.isTaxInclusive) : undefined,
                cessRate: v.cessRate !== undefined ? Number(v.cessRate) : undefined,
                taxTreatment: v.taxTreatment !== undefined ? v.taxTreatment : undefined,
                taxVerificationStatus: v.taxVerificationStatus !== undefined ? v.taxVerificationStatus : undefined,
                taxConfirmedBy: v.taxVerificationStatus === 'VERIFIED' ? (req.admin?.email || 'admin@amoga.com') : undefined,
                taxConfirmedAt: v.taxVerificationStatus === 'VERIFIED' ? new Date() : undefined,
                taxNotes: v.taxNotes !== undefined ? v.taxNotes : undefined,
                stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : undefined,
                lowStockThreshold: v.lowStockThreshold !== undefined ? Number(v.lowStockThreshold) : undefined,
                inStock: v.inStock !== undefined ? Boolean(v.inStock) : undefined,
                attributes: v.attributes,
              },
            });
          } else if (v.name && v.name.trim()) {
            let newVariantSku = null;
            if (v.sku && v.sku.trim()) {
              const vCheck = await validateCustomSku(v.sku, {}, tx);
              if (!vCheck.isValid) throw new Error(vCheck.message);
              newVariantSku = vCheck.cleanSku;
            } else {
              newVariantSku = generateVariantSku(effectiveParentSku, vIndex);
            }
            vIndex++;

            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name.trim(),
                sku: newVariantSku,
                price: v.price ? Number(v.price) : null,
                hsnCode: v.hsnCode ? String(v.hsnCode).trim() : (finalHsn || null),
                gstRate: v.gstRate !== undefined && v.gstRate !== null ? Number(v.gstRate) : finalGst,
                isTaxInclusive: v.isTaxInclusive !== undefined ? Boolean(v.isTaxInclusive) : Boolean(isTaxInclusive),
                cessRate: v.cessRate !== undefined ? Number(v.cessRate) : Number(cessRate || 0),
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

    broadcastProductUpdate(existingProduct.collectionId);

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

    broadcastProductUpdate(product.collectionId);

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

    broadcastProductUpdate(product.collectionId);

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

export async function getNextSkuPreview(req, res) {
  try {
    const { collectionId, category } = req.query;
    const prefix = resolveSkuPrefix(collectionId, category);
    const seqRecord = await prisma.skuSequence.findUnique({
      where: { prefix },
    });
    const nextNum = (seqRecord?.lastNumber || 0) + 1;
    const preview = `${prefix}${String(nextNum).padStart(3, '0')}`;
    return res.status(200).json({
      success: true,
      prefix,
      preview,
      nextNumber: nextNum,
    });
  } catch (err) {
    return res.status(500).json({ error: 'FAILED', message: err.message });
  }
}

export async function validateSkuEndpoint(req, res) {
  try {
    const { sku, productId, variantId } = req.body;
    const result = await validateCustomSku(sku, {
      excludeProductId: productId || null,
      excludeVariantId: variantId || null,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: 'FAILED', message: err.message });
  }
}

