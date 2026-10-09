import { prisma } from '../config/prisma.js';

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

    const formattedProducts = products.map((p) => ({
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
      inStock: p.inStock,
      isFeatured: p.isFeatured,
      badge: p.badge,
      rating: p.rating,
      reviewCount: p.reviewCount,
      specs: p.specs,
      verified: p.verified,
      variants: p.variants.map((v) => ({
        id: v.sourceId || v.id,
        variantId: v.id,
        name: v.name,
        price: v.price ? parseFloat(v.price.toString()) : null,
        inStock: v.inStock,
        ...(typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {}),
      })),
      sizes: p.variants.filter((v) => v.attributes?.size).map((v) => v.attributes.size),
    }));

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
      inStock: product.inStock,
      isFeatured: product.isFeatured,
      badge: product.badge,
      rating: product.rating,
      reviewCount: product.reviewCount,
      specs: product.specs,
      verified: product.verified,
      variants: product.variants.map((v) => ({
        id: v.sourceId || v.id,
        variantId: v.id,
        name: v.name,
        price: v.price ? parseFloat(v.price.toString()) : null,
        inStock: v.inStock,
        ...(typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {}),
      })),
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
