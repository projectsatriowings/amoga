import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('--- DB INSPECTION ---');

  // Check QA-TEST
  const qaProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'QA-TEST', mode: 'insensitive' } },
        { slug: { contains: 'qa-test', mode: 'insensitive' } },
        { sku: { contains: 'QA-TEST', mode: 'insensitive' } },
      ],
    },
    include: {
      collection: true,
      variants: true,
    },
  });
  console.log('QA Products found in DB:', qaProducts.length);
  for (const p of qaProducts) {
    console.log({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      collectionId: p.collectionId,
      isActive: p.isActive,
      price: p.price,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
      taxVerificationStatus: p.taxVerificationStatus,
      createdAt: p.createdAt,
    });
  }

  // Check Jasmine Rice
  const jasmineProducts = await prisma.product.findMany({
    where: {
      name: { contains: 'Jasmine', mode: 'insensitive' },
    },
    include: {
      collection: true,
      variants: true,
      orderItems: true,
      locationInventories: true,
    },
  });
  console.log('\nJasmine Rice products found in DB:', jasmineProducts.length);
  for (const p of jasmineProducts) {
    console.log({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      collectionId: p.collectionId,
      isActive: p.isActive,
      price: p.price,
      originalPrice: p.originalPrice,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
      stockQuantity: p.stockQuantity,
      orderItemsCount: p.orderItems.length,
      locationInventoriesCount: p.locationInventories.length,
      variantsCount: p.variants.length,
      variants: p.variants.map(v => ({ id: v.id, name: v.name, price: v.price, sku: v.sku })),
      createdAt: p.createdAt,
    });
  }

  // Check Pure S1lk
  const silkSarees = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'S1lk', mode: 'insensitive' } },
        { description: { contains: 'S1lk', mode: 'insensitive' } },
      ],
    },
  });
  console.log('\nS1lk products found in DB:', silkSarees.length);
  for (const p of silkSarees) {
    console.log({ id: p.id, name: p.name, slug: p.slug, description: p.description });
  }

  // Check Store Settings
  const storeSettings = await prisma.storeSetting.findUnique({ where: { id: 'default' } });
  console.log('\nStore Settings:', {
    freeShippingThreshold: storeSettings?.freeShippingThreshold,
    shippingThresholdOperator: storeSettings?.shippingThresholdOperator,
    shippingStandardRate: storeSettings?.shippingStandardRate,
    shippingRulesEnabled: storeSettings?.shippingRulesEnabled,
  });

  // Check Stall / Stock locations
  const locations = await prisma.stockLocation.findMany({
    include: {
      inventories: {
        include: {
          product: { select: { id: true, name: true, sku: true } }
        }
      }
    }
  });
  console.log('\nStock Locations count:', locations.length);
  for (const loc of locations) {
    console.log(`- ${loc.name} (${loc.id}, code=${loc.code}, type=${loc.type}, isActive=${loc.isActive}, inventories=${loc.inventories.length})`);
    for (const inv of loc.inventories) {
      console.log(`    Item: ${inv.product.name} (qty=${inv.onHandQuantity})`);
    }
  }

  // Check POS settings
  const posSettings = await prisma.posSetting.findFirst();
  console.log('\nPOS Settings:', posSettings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
