import { prisma } from '../src/config/prisma.js';

async function main() {
  const activeFood = await prisma.product.findMany({
    where: { collectionId: 'food', isActive: true },
    select: { id: true, name: true, sku: true, slug: true, sourceId: true }
  });
  console.log(`Active food count: ${activeFood.length}`);
  const nonSeed = activeFood.filter(p => !p.sourceId?.startsWith('f-') && !p.sourceId?.startsWith('soup-') && !p.sourceId?.startsWith('millet-') && !p.sourceId?.startsWith('podi-'));
  console.log('Non-seed active food count:', nonSeed.length);
  console.log('Non-seed active food products:', JSON.stringify(nonSeed, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
