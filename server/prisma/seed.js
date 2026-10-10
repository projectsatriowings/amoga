import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { loadFrontendCatalogue } from './catalogueLoader.js';

const prisma = new PrismaClient();

const COLLECTIONS_DATA = [
  {
    id: 'food',
    name: 'Wholesome Pantry',
    slug: 'food',
    tagline: 'Traditional Blends & Mixes',
    description: 'Discover traditional Indian blends made for everyday cooking, from comforting soup mixes to nourishing millet blends and flavourful rice podis.',
    theme: 'food',
    accentColor: '#3F7B43',
  },
  {
    id: 'tea',
    name: 'Wellness Tea',
    slug: 'tea',
    tagline: 'Botanical Teas & Herbal Infusions',
    description: 'Discover thoughtfully selected botanical teas and herbal infusions for your everyday tea ritual.',
    theme: 'tea',
    accentColor: '#65815A',
  },
  {
    id: 'sarees',
    name: 'Heritage Sarees',
    slug: 'sarees',
    tagline: 'Timeless Weaves',
    description: 'Discover the beauty of traditional textiles and timeless craftsmanship.',
    theme: 'sarees',
    accentColor: '#C5A46D',
  },
  {
    id: 'jewellery',
    name: 'Silver Jewellery',
    slug: 'jewellery',
    tagline: 'Modern Heirlooms',
    description: 'Explore refined silver jewellery with a timeless, contemporary character.',
    theme: 'jewellery',
    accentColor: '#B9B8B5',
  },
];

async function seed() {
  console.log('--- AMOGA REPEATABLE DATABASE SEEDING ---\n');

  // 1. Seed Collections (upsert)
  console.log('Seeding Collections...');
  for (const col of COLLECTIONS_DATA) {
    await prisma.collection.upsert({
      where: { id: col.id },
      update: {
        name: col.name,
        slug: col.slug,
        tagline: col.tagline,
        description: col.description,
        theme: col.theme,
        accentColor: col.accentColor,
        isActive: true,
      },
      create: {
        id: col.id,
        name: col.name,
        slug: col.slug,
        tagline: col.tagline,
        description: col.description,
        theme: col.theme,
        accentColor: col.accentColor,
        isActive: true,
      },
    });
  }
  console.log('✓ Collections seeded: food, sarees, jewellery\n');

  // Load catalogues from existing frontend source datasets
  const foodTemp = loadFrontendCatalogue('src/features/food/data/products.js', 'FOOD_PRODUCTS');
  const sareeTemp = loadFrontendCatalogue('src/features/sarees/data/products.js', 'SAREE_PRODUCTS');
  const jewelleryTemp = loadFrontendCatalogue('src/features/jewellery/data/products.js', 'JEWELLERY_PRODUCTS');

  let foodProducts = [];
  let sareeProducts = [];
  let jewelleryProducts = [];

  try {
    const foodMod = await import(`file://${foodTemp.tempFile.replace(/\\/g, '/')}`);
    foodProducts = foodMod.default || [];

    const sareeMod = await import(`file://${sareeTemp.tempFile.replace(/\\/g, '/')}`);
    sareeProducts = sareeMod.default || [];

    const jewelleryMod = await import(`file://${jewelleryTemp.tempFile.replace(/\\/g, '/')}`);
    jewelleryProducts = jewelleryMod.default || [];
  } finally {
    // Clean up temp loader files
    [foodTemp.tempFile, sareeTemp.tempFile, jewelleryTemp.tempFile].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }

  // Reconciliation Trackers
  const report = {
    food: { total: foodProducts.length, seeded: 0, priced: 0, unpriced: 0, variants: 0 },
    sarees: { total: sareeProducts.length, seeded: 0, priced: 0, unpriced: 0, variants: 0 },
    jewellery: { total: jewelleryProducts.length, seeded: 0, priced: 0, unpriced: 0, variants: 0 },
  };

  // 2. Seed Food Products
  console.log(`Seeding ${foodProducts.length} Gourmet Food products...`);
  for (const item of foodProducts) {
    const hasPrice = item.price !== null && item.price !== undefined && typeof item.price === 'number';
    if (hasPrice) report.food.priced++;
    else report.food.unpriced++;

    await prisma.product.upsert({
      where: { sourceId: item.id },
      update: {
        collectionId: 'food',
        slug: item.slug,
        name: item.name,
        description: item.description || '',
        category: item.category || 'general',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        originalPrice: item.originalPrice ? item.originalPrice : null,
        discount: item.discount || null,
        currency: 'INR',
        image: item.image || '/src/assets/images/gatekeeper-food.jpg',
        gallery: item.gallery || null,
        packSize: item.packSize || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        rating: item.rating ? parseFloat(item.rating) : null,
        reviewCount: item.reviewCount ? parseInt(item.reviewCount, 10) : null,
        sourceCatalogue: item.sourceCatalogue || 'Amoga Gourmet Food Catalogue',
        verified: hasPrice,
        isActive: true,
      },
      create: {
        sourceId: item.id,
        collectionId: 'food',
        slug: item.slug,
        name: item.name,
        description: item.description || '',
        category: item.category || 'general',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        originalPrice: item.originalPrice ? item.originalPrice : null,
        discount: item.discount || null,
        currency: 'INR',
        image: item.image || '/src/assets/images/gatekeeper-food.jpg',
        gallery: item.gallery || null,
        packSize: item.packSize || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        rating: item.rating ? parseFloat(item.rating) : null,
        reviewCount: item.reviewCount ? parseInt(item.reviewCount, 10) : null,
        sourceCatalogue: item.sourceCatalogue || 'Amoga Gourmet Food Catalogue',
        verified: hasPrice,
        isActive: true,
      },
    });
    report.food.seeded++;
  }
  console.log(`✓ Food products seeded (${report.food.seeded}/${report.food.total})\n`);

  // 3. Seed Sarees Products & Variants
  console.log(`Seeding ${sareeProducts.length} Heritage Sarees products...`);
  for (const item of sareeProducts) {
    const hasPrice = item.price !== null && item.price !== undefined && typeof item.price === 'number';
    if (hasPrice) report.sarees.priced++;
    else report.sarees.unpriced++;

    const productRecord = await prisma.product.upsert({
      where: { sourceId: item.id },
      update: {
        collectionId: 'sarees',
        slug: item.slug,
        name: item.name,
        tagline: item.tagline || null,
        description: item.description || '',
        category: item.category || 'silk',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        currency: 'INR',
        image: item.image || '/src/assets/images/saree-kanchipuram.jpg',
        gallery: item.gallery || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        specs: item.specs || null,
        verified: Boolean(item.verified),
        isActive: true,
      },
      create: {
        sourceId: item.id,
        collectionId: 'sarees',
        slug: item.slug,
        name: item.name,
        tagline: item.tagline || null,
        description: item.description || '',
        category: item.category || 'silk',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        currency: 'INR',
        image: item.image || '/src/assets/images/saree-kanchipuram.jpg',
        gallery: item.gallery || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        specs: item.specs || null,
        verified: Boolean(item.verified),
        isActive: true,
      },
    });
    report.sarees.seeded++;

    // Seed Variants for Saree
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const v of item.variants) {
        // Clean upsert or create for variants
        const existingVariant = await prisma.productVariant.findFirst({
          where: { productId: productRecord.id, sourceId: v.id },
        });

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              name: v.name,
              inStock: v.inStock !== false,
              attributes: { hex: v.hex || null },
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: productRecord.id,
              sourceId: v.id,
              name: v.name,
              inStock: v.inStock !== false,
              attributes: { hex: v.hex || null },
            },
          });
        }
        report.sarees.variants++;
      }
    }
  }
  console.log(`✓ Saree products seeded (${report.sarees.seeded}/${report.sarees.total}, ${report.sarees.variants} variants)\n`);

  // 4. Seed Jewellery Products & Variants
  console.log(`Seeding ${jewelleryProducts.length} Silver Jewellery products...`);
  for (const item of jewelleryProducts) {
    const hasPrice = item.price !== null && item.price !== undefined && typeof item.price === 'number';
    if (hasPrice) report.jewellery.priced++;
    else report.jewellery.unpriced++;

    const productRecord = await prisma.product.upsert({
      where: { sourceId: item.id },
      update: {
        collectionId: 'jewellery',
        slug: item.slug,
        name: item.name,
        tagline: item.tagline || null,
        description: item.description || '',
        category: item.category || 'rings',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        currency: 'INR',
        image: item.image || '/src/assets/images/jewellery-aurora-ring.jpg',
        gallery: item.gallery || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        specs: item.specs || null,
        verified: Boolean(item.verified),
        isActive: true,
      },
      create: {
        sourceId: item.id,
        collectionId: 'jewellery',
        slug: item.slug,
        name: item.name,
        tagline: item.tagline || null,
        description: item.description || '',
        category: item.category || 'rings',
        categoryName: item.categoryName || null,
        price: hasPrice ? item.price : null,
        currency: 'INR',
        image: item.image || '/src/assets/images/jewellery-aurora-ring.jpg',
        gallery: item.gallery || null,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        badge: item.badge || null,
        specs: item.specs || null,
        verified: Boolean(item.verified),
        isActive: true,
      },
    });
    report.jewellery.seeded++;

    // Seed Ring Sizes as Variants if present
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      for (const sizeName of item.sizes) {
        const sizeSlug = sizeName.toLowerCase().replace(/\s+/g, '-');
        const existingVariant = await prisma.productVariant.findFirst({
          where: { productId: productRecord.id, sourceId: sizeSlug },
        });

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              name: sizeName,
              inStock: true,
              attributes: { size: sizeName },
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: productRecord.id,
              sourceId: sizeSlug,
              name: sizeName,
              inStock: true,
              attributes: { size: sizeName },
            },
          });
        }
        report.jewellery.variants++;
      }
    }
  }
  console.log(`✓ Jewellery products seeded (${report.jewellery.seeded}/${report.jewellery.total}, ${report.jewellery.variants} variants)\n`);

  // Final Reconciliation Summary
  console.log('========================================================');
  console.log('         DATABASE SEED RECONCILIATION REPORT           ');
  console.log('========================================================');
  console.log(`Food Collection:      ${report.food.seeded}/${report.food.total} products (${report.food.priced} priced, ${report.food.unpriced} unpriced)`);
  console.log(`Sarees Collection:    ${report.sarees.seeded}/${report.sarees.total} products (${report.sarees.priced} priced, ${report.sarees.unpriced} unpriced, ${report.sarees.variants} variants)`);
  console.log(`Jewellery Collection: ${report.jewellery.seeded}/${report.jewellery.total} products (${report.jewellery.priced} priced, ${report.jewellery.unpriced} unpriced, ${report.jewellery.variants} variants)`);
  const totalSeeded = report.food.seeded + report.sarees.seeded + report.jewellery.seeded;
  const totalPrice = report.food.priced + report.sarees.priced + report.jewellery.priced;
  const totalUnpriced = report.food.unpriced + report.sarees.unpriced + report.jewellery.unpriced;
  const totalVariants = report.food.variants + report.sarees.variants + report.jewellery.variants;
  console.log('--------------------------------------------------------');
  console.log(`TOTALS:               ${totalSeeded} products (${totalPrice} priced, ${totalUnpriced} unconfirmed, ${totalVariants} variants)`);
  console.log('========================================================\n');
}

seed()
  .catch((e) => {
    console.error('Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
