import { prisma } from '../src/config/prisma.js';

async function main() {
  const prods = await prisma.product.findMany({
    where: { collectionId: 'food', price: { not: null } },
    select: { id: true, sourceId: true, slug: true, name: true, category: true, price: true, packSize: true }
  });
  console.log('Food products with price in DB:', JSON.stringify(prods, null, 2));
}

main().finally(() => prisma.$disconnect());
