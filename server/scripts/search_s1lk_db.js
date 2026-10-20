import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('Searching database for s1lk...');
  
  // Search collections
  const collections = await prisma.collection.findMany();
  for (const c of collections) {
    const str = JSON.stringify(c);
    if (str.toLowerCase().includes('s1lk')) {
      console.log('Found in collection:', c.id, str);
    }
  }

  // Search products
  const products = await prisma.product.findMany();
  for (const p of products) {
    const str = JSON.stringify(p);
    if (str.toLowerCase().includes('s1lk')) {
      console.log('Found in product:', p.id, p.name);
    }
  }

  // Search variants
  const variants = await prisma.productVariant.findMany();
  for (const v of variants) {
    const str = JSON.stringify(v);
    if (str.toLowerCase().includes('s1lk')) {
      console.log('Found in variant:', v.id, v.name);
    }
  }

  // Search storeSettings
  const storeSettings = await prisma.storeSetting.findMany();
  for (const s of storeSettings) {
    const str = JSON.stringify(s);
    if (str.toLowerCase().includes('s1lk')) {
      console.log('Found in storeSettings:', str);
    }
  }

  console.log('Done searching database for s1lk.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
