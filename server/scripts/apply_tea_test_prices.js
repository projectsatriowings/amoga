import { prisma } from '../src/config/prisma.js';

/**
 * Non-destructive development test pricing for existing Amoga Tea products.
 * These are temporary development/test prices enabling complete end-to-end checkout testing.
 * Authoritative financial calculations remain in integer paise.
 */
const TEA_TEST_PRICING = [
  {
    id: 'cca187c0-4776-4ae3-9803-d477e63482e1',
    sourceId: 'tea-01',
    slug: 'butterfly-blue-pea-tea',
    name: 'Butterfly Blue Pea Tea',
    packSize: '50 g',
    testPriceRupees: 199.00,
  },
  {
    id: '21688ed5-f36e-4b48-997a-2af718b3f05b',
    sourceId: 'tea-02',
    slug: 'moringa-leaf-tea',
    name: 'Moringa Leaf Tea',
    packSize: '50 g',
    testPriceRupees: 199.00,
  },
  {
    id: '9a9c1015-f865-445f-8871-f156a56e5797',
    sourceId: 'tea-03',
    slug: 'cinnamon-tea',
    name: 'Cinnamon Tea',
    packSize: '100 g',
    testPriceRupees: 219.00,
  },
  {
    id: '4bab5dee-5b23-4793-a067-3bc3d207fb60',
    sourceId: 'tea-04',
    slug: 'sarsaparilla-tea',
    name: 'Sarsaparilla Tea',
    packSize: '100 g',
    testPriceRupees: 229.00,
  },
  {
    id: 'f720d204-9d57-4440-a25d-e198735209d4',
    sourceId: 'tea-05',
    slug: 'hibiscus-tea',
    name: 'Hibiscus Tea',
    packSize: '100 g',
    testPriceRupees: 249.00,
  },
];

async function main() {
  console.log('=== UPDATING TEA DEVELOPMENT TEST PRICING ===');
  console.log(`Targeting ${TEA_TEST_PRICING.length} verified Tea products in PostgreSQL...`);

  for (const item of TEA_TEST_PRICING) {
    const updated = await prisma.product.update({
      where: { id: item.id },
      data: {
        price: item.testPriceRupees,
        packSize: item.packSize,
        inStock: true,
        isActive: true,
      },
    });

    console.log(`Updated [${updated.sourceId}] "${updated.name}" (${updated.packSize}) -> ₹${updated.price}`);
  }

  // Verification query
  const count = await prisma.product.count({
    where: {
      collectionId: 'tea',
      price: { not: null },
    },
  });

  console.log(`Verification: ${count}/5 Tea products now have active development/test prices in database.`);
}

main()
  .catch((err) => {
    console.error('Failed to update tea pricing:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
