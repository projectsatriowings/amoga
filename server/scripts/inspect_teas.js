import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const collections = await prisma.collection.findMany();
  console.log('COLLECTIONS:', JSON.stringify(collections, null, 2));

  const teaProducts = await prisma.product.findMany({
    where: {
      OR: [
        { id: { startsWith: 'tea' } },
        { slug: { contains: 'tea' } },
        { name: { contains: 'tea', mode: 'insensitive' } },
        { category: 'teas' }
      ]
    },
    select: { id: true, slug: true, name: true, category: true, collectionId: true }
  });
  console.log('TEA PRODUCTS IN DB:', JSON.stringify(teaProducts, null, 2));

  const allCategories = await prisma.product.groupBy({
    by: ['collectionId', 'category'],
    _count: true,
  });
  console.log('ALL CATEGORIES BY COLLECTION:', JSON.stringify(allCategories, null, 2));
}

main().finally(() => prisma.$disconnect());
