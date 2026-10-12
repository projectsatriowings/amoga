import { prisma } from '../src/config/prisma.js';

async function main() {
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      sourceId: true,
      collectionId: true,
      category: true,
      name: true,
      slug: true,
      packSize: true,
      price: true,
    },
    orderBy: [
      { collectionId: 'asc' },
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  const nullPriceProds = allProducts.filter(p => p.price === null || Number(p.price) <= 0);
  const validPriceProds = allProducts.filter(p => p.price !== null && Number(p.price) > 0);

  console.log(`Total products: ${allProducts.length}`);
  console.log(`Products with valid price: ${validPriceProds.length}`);
  console.log(`Products with NULL / <= 0 price: ${nullPriceProds.length}`);

  console.log('\n--- NULL PRICE BREAKDOWN BY COLLECTION & CATEGORY ---');
  const breakdown = {};
  for (const p of nullPriceProds) {
    const key = `${p.collectionId} -> ${p.category}`;
    if (!breakdown[key]) breakdown[key] = [];
    breakdown[key].push({ id: p.id, sourceId: p.sourceId, slug: p.slug, name: p.name, packSize: p.packSize });
  }

  for (const [key, items] of Object.entries(breakdown)) {
    console.log(`\n[${key}] (${items.length} products):`);
    items.forEach(i => console.log(`  - [${i.slug}] "${i.name}" (sourceId: ${i.sourceId}, pack: ${i.packSize || 'N/A'})`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
