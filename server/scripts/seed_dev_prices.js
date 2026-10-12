import { prisma } from '../src/config/prisma.js';

/**
 * Deterministic Development Pricing Update for Amoga E-Commerce Catalogue
 * Updates only products with missing or unconfirmed prices.
 * Preserves all existing valid prices and database primary keys/slugs.
 */

// Suggested ranges:
// Soups: ₹99 - ₹249
const SOUP_PRICES = {
  'soup-01': { price: 129, packSize: '50 g' }, // Lemon Coriander Leaves
  'soup-02': { price: 139, packSize: '50 g' }, // Moringa
  'soup-03': { price: 119, packSize: '50 g' }, // Bitter Gourd
  'soup-04': { price: 119, packSize: '50 g' }, // Tomato
  'soup-05': { price: 149, packSize: '50 g' }, // Mudakathan
  'soup-06': { price: 139, packSize: '50 g' }, // Karpuravalli
  'soup-07': { price: 139, packSize: '50 g' }, // Betel Leaf
  'soup-08': { price: 139, packSize: '50 g' }, // Manathakkali
  'soup-09': { price: 149, packSize: '50 g' }, // Thippili
  'soup-10': { price: 119, packSize: '50 g' }, // Vegetable Clear
  'soup-11': { price: 129, packSize: '50 g' }, // Hot & Sour
  'soup-12': { price: 129, packSize: '50 g' }, // Poondu (Garlic)
  'soup-13': { price: 159, packSize: '50 g' }, // Creamy Garlic Mushroom
  'soup-14': { price: 129, packSize: '50 g' }, // Garlic Spinach
  'soup-15': { price: 139, packSize: '50 g' }, // Creamy Tomato
  'soup-16': { price: 149, packSize: '50 g' }, // Arugampul
  'soup-17': { price: 149, packSize: '50 g' }, // Vallarai Keerai
  'soup-18': { price: 169, packSize: '50 g' }, // Mudavattukal
  'soup-19': { price: 129, packSize: '50 g' }, // Sweet Corn
  'soup-20': { price: 139, packSize: '50 g' }, // Masoor Dal
};

// Millets: ₹149 - ₹349
const MILLET_PRICES = {
  'millet-01': { price: 189, packSize: '200 g' }, // Ven Pongal
  'millet-02': { price: 179, packSize: '200 g' }, // Adai Dosai
  'millet-03': { price: 199, packSize: '200 g' }, // Sambar Rice
  'millet-04': { price: 179, packSize: '200 g' }, // Paniyaram
  'millet-05': { price: 249, packSize: '250 g' }, // Health Mix
  'millet-06': { price: 229, packSize: '250 g' }, // Millet Biryani
  'millet-07': { price: 169, packSize: '200 g' }, // Idly Mix
  'millet-08': { price: 169, packSize: '200 g' }, // Dosai Mix
  'millet-09': { price: 179, packSize: '200 g' }, // Poori Mix
  'millet-10': { price: 189, packSize: '200 g' }, // Pancake Mix
};

// Rice Podis: ₹99 - ₹249
const PODI_PRICES = {
  'podi-01': { price: 139, packSize: '100 g' }, // Moringa Podi
  'podi-02': { price: 129, packSize: '100 g' }, // Coriander Leaves Podi
  'podi-03': { price: 139, packSize: '100 g' }, // Groundnut Podi
  'podi-04': { price: 139, packSize: '100 g' }, // Coconut Podi
  'podi-05': { price: 149, packSize: '100 g' }, // Manathakkali Podi
  'podi-06': { price: 149, packSize: '100 g' }, // Thuthuvalai Podi
  'podi-07': { price: 129, packSize: '100 g' }, // Bitter Gourd Podi
  'podi-08': { price: 139, packSize: '100 g' }, // Senanguni Podi
  'podi-09': { price: 129, packSize: '100 g' }, // Kollu Podi
  'podi-10': { price: 149, packSize: '100 g' }, // Vallarai Podi
  'podi-11': { price: 149, packSize: '100 g' }, // Sundakkai Podi
  'podi-12': { price: 139, packSize: '100 g' }, // Ellu Podi
  'podi-13': { price: 149, packSize: '100 g' }, // Pirandai Podi
  'podi-14': { price: 159, packSize: '100 g' }, // Avarampoo Podi
  'podi-15': { price: 159, packSize: '100 g' }, // Mudakathan Podi
  'podi-16': { price: 149, packSize: '100 g' }, // Betel Leaf Podi
  'podi-17': { price: 169, packSize: '100 g' }, // Angaya Podi (5 Herbs)
  'podi-18': { price: 139, packSize: '100 g' }, // Chammanthi Podi
  'podi-19': { price: 149, packSize: '100 g' }, // Andhra Nalla Karam Podi
  'podi-20': { price: 149, packSize: '100 g' }, // Flax Seed Podi
  'podi-21': { price: 139, packSize: '100 g' }, // Nellikai Podi
  'podi-22': { price: 139, packSize: '100 g' }, // Andhra Spicy Paruppu Podi
  'podi-23': { price: 129, packSize: '100 g' }, // Fried Gram Podi
  'podi-24': { price: 139, packSize: '100 g' }, // Poondu Podi
  'podi-25': { price: 179, packSize: '100 g' }, // Poppy Seed Podi
};

// Sarees: ₹1,499 - ₹25,000
const SAREE_PRICES = {
  's-chanderi-01': { price: 6499, packSize: '6.3 Metres' },
  's-tussar-01': { price: 5850, packSize: '6.3 Metres' },
  's-mysore-01': { price: 8900, packSize: '6.3 Metres' },
  's-patola-01': { price: 11500, packSize: '6.3 Metres' },
  's-paithani-01': { price: 15800, packSize: '6.3 Metres' },
  's-gadwal-01': { price: 7200, packSize: '6.3 Metres' },
  's-organza-01': { price: 4950, packSize: '6.3 Metres' },
  's-korvai-01': { price: 21500, packSize: '6.3 Metres' },
};

// Jewellery: ₹299 - ₹7,999
const JEWELLERY_PRICES = {
  'j-celeste-hoop-01': { price: 1499, packSize: 'Standard Pair' },
  'j-heritage-kasu-01': { price: 4299, packSize: 'Size 2.6' },
};

async function main() {
  console.log('=== APPLYING DETERMINISTIC DEVELOPMENT PRICES IN POSTGRESQL ===');

  const allUpdates = {
    ...SOUP_PRICES,
    ...MILLET_PRICES,
    ...PODI_PRICES,
    ...SAREE_PRICES,
    ...JEWELLERY_PRICES,
  };

  let updatedCount = 0;

  for (const [sourceId, data] of Object.entries(allUpdates)) {
    const existing = await prisma.product.findFirst({
      where: { sourceId },
    });

    if (!existing) {
      console.warn(`[SKIP] Product with sourceId "${sourceId}" not found in DB.`);
      continue;
    }

    // Only update if price is missing or 0 to preserve existing valid prices
    if (existing.price !== null && Number(existing.price) > 0) {
      console.log(`[PRESERVED] Product "${existing.name}" already has valid price ₹${existing.price}`);
      continue;
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: {
        price: data.price,
        packSize: data.packSize,
        inStock: true,
        isActive: true,
      },
    });

    console.log(`[UPDATED] "${existing.name}" (${sourceId}) -> ₹${data.price} (${data.packSize})`);
    updatedCount++;
  }

  console.log(`\nSuccessfully applied development prices to ${updatedCount} products.`);

  // Verify all products in database
  const totalInDb = await prisma.product.count();
  const nullInDb = await prisma.product.count({
    where: {
      OR: [{ price: null }, { price: { lte: 0 } }],
    },
  });

  console.log(`\nVerification Summary:`);
  console.log(`Total products in database: ${totalInDb}`);
  console.log(`Products without valid price: ${nullInDb} (Must be 0)`);

  if (nullInDb === 0) {
    console.log('>>> ALL PRODUCTS NOW HAVE VALID POSITIVE DEVELOPMENT PRICES! <<<');
  } else {
    console.warn(`>>> ATTENTION: ${nullInDb} products still have null/zero price.`);
  }
}

main()
  .catch((err) => {
    console.error('Migration script failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
