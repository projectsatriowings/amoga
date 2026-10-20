import { prisma } from '../src/config/prisma.js';
import { searchPosCatalog } from '../src/services/posService.js';

async function main() {
  const stall = await prisma.stockLocation.findFirst({ where: { type: 'STALL' } });
  console.log('Stall found:', stall?.id, stall?.name);

  // Search with stall ID
  const withStall = await searchPosCatalog({ stockLocationId: stall?.id });
  console.log('With stall stockLocationId, count =', withStall.length);
  const byCol = {};
  for (const p of withStall) {
    byCol[p.collectionId] = (byCol[p.collectionId] || 0) + 1;
  }
  console.log('By collection:', byCol);

  // Search with no stockLocationId
  const withoutStall = await searchPosCatalog({});
  console.log('Without stockLocationId, count =', withoutStall.length);

  // Check how many have stall stock > 0
  const inStockAtStall = withStall.filter(p => p.availableQuantity > 0 || p.variants.some(v => v.availableQuantity > 0));
  console.log('In stock at stall count =', inStockAtStall.length);
  for (const p of inStockAtStall) {
    console.log(`- ${p.name} (${p.collectionId}): avail=${p.availableQuantity}, variants=${p.variants.map(v => v.availableQuantity).join(',')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
