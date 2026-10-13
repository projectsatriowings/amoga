import { prisma } from '../config/prisma.js';

export async function getCollections(req, res, next) {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const orderMap = { food: 1, tea: 2, sarees: 3, jewellery: 4 };
    collections.sort((a, b) => {
      const rankA = orderMap[a.slug] || orderMap[a.id] || 99;
      const rankB = orderMap[b.slug] || orderMap[b.id] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      success: true,
      data: collections.map((c) => ({
        ...c,
        productCount: c._count?.products || 0,
      })),
    });
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
