import { prisma } from '../src/config/prisma.js';

async function main() {
  // 1. Unpublish orphan duplicate record
  const dup = await prisma.product.update({
    where: { id: 'ad2847fe-6dd3-4661-84bd-45f7b6714a28' },
    data: {
      isActive: false,
    },
  });
  console.log('Unpublished duplicate:', dup.id, dup.name, 'isActive:', dup.isActive);

  // 2. Update canonical record with canonical slug and unconfirmed price policy
  const canonical = await prisma.product.update({
    where: { id: '108eb4eb-4634-4f84-8821-8571c2a6863f' },
    data: {
      slug: 'handcrafted-heritage-jasmine-rice',
      category: 'podis',
      categoryName: 'Traditional Rice',
      price: null, // Price unconfirmed by business
      originalPrice: null,
      verified: false,
      isActive: true,
      tagline: 'Fragrant traditional organic rice from Tamil Nadu fields',
    },
  });
  console.log('Updated canonical:', canonical.id, canonical.slug, 'price:', canonical.price, 'isActive:', canonical.isActive);

  // Also update variant price to null
  await prisma.productVariant.updateMany({
    where: { productId: canonical.id },
    data: { price: null }
  });
  console.log('Canonical variant prices set to null for unconfirmed price safety.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
