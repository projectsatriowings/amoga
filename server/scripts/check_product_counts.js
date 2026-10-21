import { prisma } from '../src/config/prisma.js';

async function main() {
  const total = await prisma.product.count();
  const byCollection = await prisma.product.groupBy({
    by: ['collectionId'],
    _count: { id: true },
  });
  const collections = await prisma.collection.findMany({
    select: { id: true, name: true, slug: true },
  });
  const products = await prisma.product.findMany();
  console.log('--- DATABASE PRODUCT AUDIT ---');
  console.log('Total Products in DB:', total);
  console.log('Products grouped by collection:', byCollection);
  console.log('Products:', products);
  console.log('Collections in DB:', collections);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
