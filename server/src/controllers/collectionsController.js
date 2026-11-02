import { prisma } from '../config/prisma.js';
import { registerCatalogueInvalidation } from './productsController.js';

let collectionsCache = null;
let collectionsCacheTime = 0;
const COLLECTIONS_CACHE_TTL_MS = 60 * 1000; // 60s TTL

export function invalidateCollectionsCache() {
  collectionsCache = null;
  collectionsCacheTime = 0;
}
registerCatalogueInvalidation(invalidateCollectionsCache);

export async function getCollections(req, res, next) {
  try {
    const now = Date.now();
    if (collectionsCache && (now - collectionsCacheTime < COLLECTIONS_CACHE_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.status(200).json(collectionsCache);
    }

    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const orderMap = { tea: 1, sarees: 2, jewellery: 3, food: 4 };
    collections.sort((a, b) => {
      const rankA = orderMap[a.slug] || orderMap[a.id] || 99;
      const rankB = orderMap[b.slug] || orderMap[b.id] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

    const payload = {
      success: true,
      data: collections.map((c) => ({
        ...c,
        productCount: c._count?.products || 0,
      })),
    };

    collectionsCache = payload;
    collectionsCacheTime = now;

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

export async function getCollectionBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Collection slug is required' });
    }

    const clean = slug.toLowerCase().trim();
    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ id: clean }, { slug: clean }],
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Collection '${slug}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...collection,
        productCount: collection._count?.products || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}
