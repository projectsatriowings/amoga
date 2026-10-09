import { prisma } from '../config/prisma.js';

export async function getCollections(req, res, next) {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
    });

    const orderMap = { food: 1, tea: 2, sarees: 3, jewellery: 4 };
    collections.sort((a, b) => (orderMap[a.id] || 99) - (orderMap[b.id] || 99));

    return res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    next(error);
  }
}
