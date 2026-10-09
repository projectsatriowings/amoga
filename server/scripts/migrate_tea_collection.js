import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- AMOGA DATABASE MIGRATION: SEPARATE TEA COLLECTION ---\n');

  // 1. Idempotently create or update the dedicated 'tea' collection
  const teaCollection = await prisma.collection.upsert({
    where: { id: 'tea' },
    update: {
      name: 'Tea',
      slug: 'tea',
      tagline: 'Pure Botanical Infusions',
      description: 'Discover hand-plucked botanical teas, ancient herbal brews, and single-origin flower infusions.',
      theme: 'tea',
      accentColor: '#B88E38',
      isActive: true,
    },
    create: {
      id: 'tea',
      name: 'Tea',
      slug: 'tea',
      tagline: 'Pure Botanical Infusions',
      description: 'Discover hand-plucked botanical teas, ancient herbal brews, and single-origin flower infusions.',
      theme: 'tea',
      accentColor: '#B88E38',
      isActive: true,
    },
  });
  console.log('✓ Dedicated Tea Collection ensured:', teaCollection.id, `(${teaCollection.name})`);

  // 2. Identify the 5 exact tea products
  const teaProductSlugs = [
    'butterfly-blue-pea-tea',
    'moringa-leaf-tea',
    'cinnamon-tea',
    'sarsaparilla-tea',
    'hibiscus-tea',
  ];
  const teaProductSourceIds = ['tea-01', 'tea-02', 'tea-03', 'tea-04', 'tea-05'];

  const existingTeas = await prisma.product.findMany({
    where: {
      OR: [
        { sourceId: { in: teaProductSourceIds } },
        { slug: { in: teaProductSlugs } },
      ],
    },
    select: {
      id: true,
      sourceId: true,
      slug: true,
      name: true,
      collectionId: true,
      category: true,
    },
  });

  console.log(`\nFound ${existingTeas.length} tea products to associate with 'tea' collection:`);
  existingTeas.forEach((p) => {
    console.log(`  - [${p.sourceId}] ${p.name} (slug: ${p.slug}, current collectionId: ${p.collectionId})`);
  });

  // 3. Move tea products to 'tea' collection while preserving all other fields and relationships
  const updateResult = await prisma.product.updateMany({
    where: {
      OR: [
        { sourceId: { in: teaProductSourceIds } },
        { slug: { in: teaProductSlugs } },
      ],
    },
    data: {
      collectionId: 'tea',
    },
  });
  console.log(`\n✓ Updated ${updateResult.count} products to collectionId: 'tea'`);

  // 4. Verify post-migration state across all collections
  const collectionsSummary = await prisma.collection.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log('\n--- COLLECTION PRODUCT COUNTS POST-MIGRATION ---');
  collectionsSummary.forEach((c) => {
    console.log(`  - Collection '${c.id}' (${c.name}): ${c._count.products} products`);
  });

  // Verify non-tea categories in food
  const foodCategories = await prisma.product.groupBy({
    by: ['category'],
    where: { collectionId: 'food' },
    _count: true,
  });
  console.log('\n--- GOURMET FOOD CATEGORIES (NON-TEA) ---');
  foodCategories.forEach((fc) => {
    console.log(`  - ${fc.category}: ${fc._count} products`);
  });

  // Verify tea collection categories
  const teaCategories = await prisma.product.groupBy({
    by: ['category'],
    where: { collectionId: 'tea' },
    _count: true,
  });
  console.log('\n--- TEA COLLECTION CATEGORIES ---');
  teaCategories.forEach((tc) => {
    console.log(`  - ${tc.category}: ${tc._count} products`);
  });
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
