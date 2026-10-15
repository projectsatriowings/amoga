import { prisma } from '../config/prisma.js';
import { getAvailability } from '../services/inventoryService.js';

export async function getProducts(req, res, next) {
  try {
    const { collection, category, q, sort = 'default', page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      isActive: true,
    };

    if (collection) {
      where.collectionId = collection.toLowerCase();
    }

    if (category && category !== 'all') {
      where.category = category.toLowerCase();
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    let orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'price_asc') {
      orderBy = [{ price: 'asc' }];
    } else if (sort === 'price_desc') {
      orderBy = [{ price: 'desc' }];
    } else if (sort === 'name_asc') {
      orderBy = [{ name: 'asc' }];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          collection: { select: { id: true, name: true, slug: true } },
          variants: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const formattedProducts = products.map((p) => {
      const pOnHand = Math.max(0, p.stockQuantity || 0);
      const pReserved = Math.max(0, p.reservedQuantity || 0);
      const pAvailable = Math.max(0, pOnHand - pReserved);
      const pThreshold = p.lowStockThreshold || 5;

      const pInStock = p.inStock && pAvailable > 0;
      const pIsLowStock = pAvailable > 0 && pAvailable <= pThreshold;
      const pIsOutOfStock = pAvailable <= 0;

      const formattedVariants = p.variants.map((v) => {
        const vOnHand = Math.max(0, v.stockQuantity || 0);
        const vReserved = Math.max(0, v.reservedQuantity || 0);
        const vAvailable = Math.max(0, vOnHand - vReserved);
        const vThreshold = v.lowStockThreshold || 5;

        const vInStock = v.inStock && vAvailable > 0;
        const vIsLowStock = vAvailable > 0 && vAvailable <= vThreshold;
        const vIsOutOfStock = vAvailable <= 0;

        return {
          id: v.sourceId || v.id,
          variantId: v.id,
          name: v.name,
          sku: v.sku || v.sourceId || v.id,
          price: v.price ? parseFloat(v.price.toString()) : null,
          inStock: vInStock,
          stockQuantity: vOnHand,
          onHandQuantity: vOnHand,
          reservedQuantity: vReserved,
          availableQuantity: vAvailable,
          lowStockThreshold: vThreshold,
          isLowStock: vIsLowStock,
          isOutOfStock: vIsOutOfStock,
          ...(typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {}),
        };
      });

      return {
        id: p.sourceId, // Keep stable source ID as primary identity for existing frontend
        dbId: p.id,
        collection: p.collectionId,
        collectionName: p.collection.name,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        categoryName: p.categoryName,
        price: p.price ? parseFloat(p.price.toString()) : null,
        originalPrice: p.originalPrice ? parseFloat(p.originalPrice.toString()) : null,
        discount: p.discount,
        currency: p.currency,
        image: p.image,
        gallery: p.gallery,
        packSize: p.packSize,
        inStock: pInStock,
        stockQuantity: pOnHand,
        onHandQuantity: pOnHand,
        reservedQuantity: pReserved,
        availableQuantity: pAvailable,
        lowStockThreshold: pThreshold,
        isLowStock: pIsLowStock,
        isOutOfStock: pIsOutOfStock,
        isFeatured: p.isFeatured,
        badge: p.badge,
        rating: p.rating,
        reviewCount: p.reviewCount,
        specs: p.specs,
        verified: p.verified,
        variants: formattedVariants,
        sizes: p.variants.filter((v) => v.attributes?.size).map((v) => v.attributes.size),
      };
    });

    return res.status(200).json({
      success: true,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(req, res, next) {
  try {
    const { collection, slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        collectionId: collection.toLowerCase(),
        slug: slug.toLowerCase(),
        isActive: true,
      },
      include: {
        collection: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product not found for collection "${collection}" and slug "${slug}".`,
      });
    }

    const pOnHand = Math.max(0, product.stockQuantity || 0);
    const pReserved = Math.max(0, product.reservedQuantity || 0);
    const pAvailable = Math.max(0, pOnHand - pReserved);
    const pThreshold = product.lowStockThreshold || 5;

    const pInStock = product.inStock && pAvailable > 0;
    const pIsLowStock = pAvailable > 0 && pAvailable <= pThreshold;
    const pIsOutOfStock = pAvailable <= 0;

    const formattedVariants = product.variants.map((v) => {
      const vOnHand = Math.max(0, v.stockQuantity || 0);
      const vReserved = Math.max(0, v.reservedQuantity || 0);
      const vAvailable = Math.max(0, vOnHand - vReserved);
      const vThreshold = v.lowStockThreshold || 5;

      const vInStock = v.inStock && vAvailable > 0;
      const vIsLowStock = vAvailable > 0 && vAvailable <= vThreshold;
      const vIsOutOfStock = vAvailable <= 0;

      return {
        id: v.sourceId || v.id,
        variantId: v.id,
        name: v.name,
        sku: v.sku || v.sourceId || v.id,
        price: v.price ? parseFloat(v.price.toString()) : null,
        inStock: vInStock,
        stockQuantity: vOnHand,
        onHandQuantity: vOnHand,
        reservedQuantity: vReserved,
        availableQuantity: vAvailable,
        lowStockThreshold: vThreshold,
        isLowStock: vIsLowStock,
        isOutOfStock: vIsOutOfStock,
        ...(typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {}),
      };
    });

    const formattedProduct = {
      id: product.sourceId,
      dbId: product.id,
      collection: product.collectionId,
      collectionName: product.collection.name,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      category: product.category,
      categoryName: product.categoryName,
      price: product.price ? parseFloat(product.price.toString()) : null,
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      discount: product.discount,
      currency: product.currency,
      image: product.image,
      gallery: product.gallery,
      packSize: product.packSize,
      inStock: pInStock,
      stockQuantity: pOnHand,
      onHandQuantity: pOnHand,
      reservedQuantity: pReserved,
      availableQuantity: pAvailable,
      lowStockThreshold: pThreshold,
      isLowStock: pIsLowStock,
      isOutOfStock: pIsOutOfStock,
      isFeatured: product.isFeatured,
      badge: product.badge,
      rating: product.rating,
      reviewCount: product.reviewCount,
      specs: product.specs,
      verified: product.verified,
      variants: formattedVariants,
      sizes: product.variants.filter((v) => v.attributes?.size).map((v) => v.attributes.size),
    };

    return res.status(200).json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Real-time public stock availability endpoint
 * Exposes public availability safely without exposing customer details or internal logs.
 */
export async function getProductAvailability(req, res) {
  try {
    const { productId, variantId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId query parameter is required',
      });
    }

    // Resolve product by sourceId or db id
    const resolvedProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { sourceId: productId }],
        isActive: true,
      },
    });

    if (!resolvedProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let resolvedVariantId = null;
    if (variantId) {
      const cleanVarId = String(variantId).trim();
      const strippedSize = cleanVarId.replace(/^size[-_ ]*/i, '').trim().toLowerCase();
      const variantSlug = strippedSize.replace(/\s+/g, '-');
      const v = await prisma.productVariant.findFirst({
        where: {
          productId: resolvedProduct.id,
          OR: [
            { id: cleanVarId },
            { sourceId: cleanVarId },
            { sourceId: variantSlug },
            { name: { equals: cleanVarId, mode: 'insensitive' } },
            { name: { equals: strippedSize, mode: 'insensitive' } },
          ],
        },
      });
      if (v) resolvedVariantId = v.id;
    }

    const availability = await getAvailability({
      productId: resolvedProduct.id,
      variantId: resolvedVariantId,
    });

    return res.status(200).json({
      success: true,
      data: {
        productId: resolvedProduct.sourceId,
        dbId: resolvedProduct.id,
        variantId: resolvedVariantId,
        onHandQuantity: availability.onHandQuantity,
        availableQuantity: availability.availableQuantity,
        lowStockThreshold: availability.lowStockThreshold,
        inStock: availability.inStock,
        isLowStock: availability.isLowStock,
        isOutOfStock: availability.isOutOfStock,
        purchasable: availability.purchasable,
      },
    });
  } catch (error) {
    console.error('[GET PRODUCT AVAILABILITY ERROR]:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve availability' });
  }
}

/**
 * Customer Restock Subscription (Email or SMS)
 * Validates destination, requires consent, prevents duplicate active subscriptions,
 * supports guest and authenticated customer profiles.
 */
export async function subscribeRestock(req, res) {
  try {
    const {
      productId,
      variantId = null,
      destination,
      channel = 'EMAIL',
      consent = true,
    } = req.body;

    if (!productId || !destination || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Product identifier and valid contact destination (email or phone) are required.',
      });
    }

    if (consent !== true) {
      return res.status(400).json({
        success: false,
        error: 'Consent to receive back-in-stock notification is required.',
      });
    }

    const cleanChannel = String(channel).trim().toUpperCase();
    if (!['EMAIL', 'SMS'].includes(cleanChannel)) {
      return res.status(400).json({
        success: false,
        error: 'Channel must be either EMAIL or SMS.',
      });
    }

    let normalizedDestination = destination.trim();
    if (cleanChannel === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedDestination)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address.',
        });
      }
      normalizedDestination = normalizedDestination.toLowerCase();
    } else {
      // SMS phone normalization: digits only
      const phoneDigits = normalizedDestination.replace(/[\s\-\(\)\+]/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid mobile number.',
        });
      }
      normalizedDestination = phoneDigits;
    }

    // Resolve product
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { sourceId: productId }],
        isActive: true,
      },
      include: { variants: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
    }

    let resolvedVariantId = null;
    if (variantId) {
      const cleanVarId = String(variantId).trim();
      const strippedSize = cleanVarId.replace(/^size[-_ ]*/i, '').trim().toLowerCase();
      const variantSlug = strippedSize.replace(/\s+/g, '-');
      const v = product.variants.find((v) => {
        if (!v) return false;
        if (v.id === cleanVarId || v.sourceId === cleanVarId) return true;
        if (v.sourceId && (v.sourceId.toLowerCase() === variantSlug || v.sourceId.toLowerCase() === cleanVarId.toLowerCase())) return true;
        if (v.name && (v.name.toLowerCase() === strippedSize || v.name.toLowerCase() === cleanVarId.toLowerCase())) return true;
        return false;
      });
      if (v) resolvedVariantId = v.id;
    }

    // Check customer account if authenticated
    let customerId = null;
    if (req.customer?.id) {
      customerId = req.customer.id;
    } else if (cleanChannel === 'EMAIL') {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: normalizedDestination },
      });
      if (existingCustomer) customerId = existingCustomer.id;
    }

    // Check duplicate active subscription
    const existingSub = await prisma.restockSubscription.findFirst({
      where: {
        productId: product.id,
        variantId: resolvedVariantId,
        destination: normalizedDestination,
        channel: cleanChannel,
        status: 'ACTIVE',
      },
    });

    if (existingSub) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already registered to be notified as soon as this item is back in stock.',
        subscription: existingSub,
        subscriptionId: existingSub.id,
      });
    }

    // Create subscription
    const subscription = await prisma.restockSubscription.create({
      data: {
        productId: product.id,
        variantId: resolvedVariantId,
        customerId,
        channel: cleanChannel,
        destination: normalizedDestination,
        consentGiven: true,
        consentAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you. We will notify you immediately once this item arrives back in our atelier.',
      subscriptionId: subscription.id,
      subscription,
    });
  } catch (error) {
    console.error('[SUBSCRIBE RESTOCK ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register restock subscription. Please try again.',
    });
  }
}

/**
 * Customer Opt-out / Cancellation of Restock Subscription
 */
export async function unsubscribeRestock(req, res) {
  try {
    const { destination, productId, variantId } = req.body;

    if (!destination || typeof destination !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Contact destination (email or phone) is required to unsubscribe.',
      });
    }

    const normalizedDestination = destination.trim().toLowerCase();
    const where = {
      destination: normalizedDestination,
      status: { not: 'CANCELLED' },
    };

    if (productId) {
      const p = await prisma.product.findFirst({
        where: { OR: [{ id: productId }, { sourceId: productId }] },
      });
      if (p) where.productId = p.id;
    }

    if (variantId) {
      const v = await prisma.productVariant.findFirst({
        where: { OR: [{ id: variantId }, { sourceId: variantId }] },
      });
      if (v) where.variantId = v.id;
    }

    const updated = await prisma.restockSubscription.updateMany({
      where,
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Your restock notification subscription has been successfully cancelled.',
      cancelledCount: updated.count,
    });
  } catch (error) {
    console.error('[UNSUBSCRIBE RESTOCK ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription.',
    });
  }
}
