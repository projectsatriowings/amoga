import { prisma } from '../config/prisma.js';

/**
 * AMOGA E-COMMERCE — SKU GENERATION SERVICE
 * Provides atomic, database-backed sequence generation per category prefix.
 * Complies with Indian e-commerce SKU standards and prevents race conditions/duplicates.
 */

export const CATEGORY_PREFIX_MAP = {
  // Heritage Sarees
  sarees: 'AMOGA-SAR',
  silk: 'AMOGA-SAR',
  traditional: 'AMOGA-SAR',
  festive: 'AMOGA-SAR',
  wedding: 'AMOGA-SAR',
  contemporary: 'AMOGA-SAR',

  // Wellness Tea
  tea: 'AMOGA-TEA',
  flower: 'AMOGA-TEA',
  leaf: 'AMOGA-TEA',
  herbal: 'AMOGA-TEA',

  // Masala & Spices
  masala: 'AMOGA-MAS',
  masalas: 'AMOGA-MAS',
  spices: 'AMOGA-MAS',
  spice: 'AMOGA-MAS',

  // Soup Mix
  soup: 'AMOGA-SOUP',
  soups: 'AMOGA-SOUP',
  'soup-mix': 'AMOGA-SOUP',
  'soup mix': 'AMOGA-SOUP',

  // Millet Mix
  millet: 'AMOGA-MIL',
  millets: 'AMOGA-MIL',
  'millet-mix': 'AMOGA-MIL',
  'millet mix': 'AMOGA-MIL',

  // Rice Podi
  podi: 'AMOGA-POD',
  podis: 'AMOGA-POD',
  'rice-podi': 'AMOGA-POD',
  'rice podi': 'AMOGA-POD',

  // Sterling Silver Jewellery
  jewellery: 'AMOGA-SIL',
  rings: 'AMOGA-SIL',
  necklaces: 'AMOGA-SIL',
  earrings: 'AMOGA-SIL',
  bracelets: 'AMOGA-SIL',
  silver: 'AMOGA-SIL',

  // Other Pantry categories
  oils: 'AMOGA-OIL',
  oil: 'AMOGA-OIL',
  snacks: 'AMOGA-SNK',
  snack: 'AMOGA-SNK',
  superfoods: 'AMOGA-SPF',
  superfood: 'AMOGA-SPF',
  honey: 'AMOGA-HNY',
};

export const DEFAULT_PREFIX = 'AMOGA-PRD';

/**
 * Resolves the official SKU prefix for a given collection and category
 */
export function resolveSkuPrefix(collectionId, category) {
  const normCategory = String(category || '').trim().toLowerCase();
  const normCollection = String(collectionId || '').trim().toLowerCase();

  // 1. Check direct category mapping
  if (normCategory && CATEGORY_PREFIX_MAP[normCategory]) {
    return CATEGORY_PREFIX_MAP[normCategory];
  }

  // 2. Check category partial matches
  if (normCategory.includes('masala') || normCategory.includes('spice')) {
    return 'AMOGA-MAS';
  }
  if (normCategory.includes('soup')) {
    return 'AMOGA-SOUP';
  }
  if (normCategory.includes('millet')) {
    return 'AMOGA-MIL';
  }
  if (normCategory.includes('podi')) {
    return 'AMOGA-POD';
  }
  if (normCategory.includes('tea')) {
    return 'AMOGA-TEA';
  }
  if (normCategory.includes('saree') || normCategory.includes('silk')) {
    return 'AMOGA-SAR';
  }
  if (normCategory.includes('silver') || normCategory.includes('jewel') || normCategory.includes('ring')) {
    return 'AMOGA-SIL';
  }

  // 3. Fallback to collectionId mapping
  if (normCollection && CATEGORY_PREFIX_MAP[normCollection]) {
    return CATEGORY_PREFIX_MAP[normCollection];
  }

  return DEFAULT_PREFIX;
}

/**
 * Atomically allocates the next sequential number for a given prefix using PostgreSQL row upsert.
 * Guaranteed atomic across concurrent processes.
 */
export async function getNextSequenceNumber(prefix, tx = prisma) {
  const cleanPrefix = String(prefix || DEFAULT_PREFIX).trim().toUpperCase();

  // Atomic PostgreSQL upsert returning the updated sequence number
  const result = await tx.$queryRaw`
    INSERT INTO sku_sequences (prefix, "lastNumber", "updatedAt")
    VALUES (${cleanPrefix}, 1, NOW())
    ON CONFLICT (prefix)
    DO UPDATE SET "lastNumber" = sku_sequences."lastNumber" + 1, "updatedAt" = NOW()
    RETURNING "lastNumber";
  `;

  if (!result || result.length === 0) {
    throw new Error(`Failed to generate sequence number for prefix ${cleanPrefix}`);
  }

  return Number(result[0].lastNumber);
}

/**
 * Generates the next unique product SKU based on collection and category
 */
export async function generateProductSku(collectionId, category, tx = prisma) {
  const prefix = resolveSkuPrefix(collectionId, category);
  
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    const seq = await getNextSequenceNumber(prefix, tx);
    const candidateSku = `${prefix}${String(seq).padStart(3, '0')}`;

    // Verify candidate SKU is not already taken by a manually entered product
    const existing = await tx.product.findUnique({
      where: { sku: candidateSku },
      select: { id: true },
    });

    if (!existing) {
      return candidateSku;
    }
  }

  throw new Error(`Could not generate unique SKU for prefix ${prefix} after ${maxAttempts} attempts`);
}

/**
 * Generates a variant-level SKU derived from the parent product SKU
 * Example: AMOGA-SAR001 -> AMOGA-SAR001-V01
 */
export function generateVariantSku(parentSku, variantIndex = 1) {
  if (!parentSku) {
    throw new Error('Parent SKU is required to generate variant SKU');
  }
  const cleanParent = String(parentSku).trim().toUpperCase();
  const indexStr = String(variantIndex).padStart(2, '0');
  return `${cleanParent}-V${indexStr}`;
}

/**
 * Validates custom SKU format:
 * Alphanumeric, uppercase, dashes and underscores, 3 to 40 characters
 */
export function isValidSkuFormat(sku) {
  if (!sku || typeof sku !== 'string') return false;
  const clean = sku.trim();
  const skuRegex = /^[A-Z0-9_-]{3,40}$/i;
  return skuRegex.test(clean);
}

/**
 * Validates whether a custom SKU is unique across Products and ProductVariants
 */
export async function validateCustomSku(sku, options = {}, tx = prisma) {
  const { excludeProductId = null, excludeVariantId = null } = options;

  if (!sku || typeof sku !== 'string') {
    return { isValid: false, message: 'SKU cannot be empty' };
  }

  const cleanSku = sku.trim().toUpperCase();

  if (!isValidSkuFormat(cleanSku)) {
    return {
      isValid: false,
      message: 'Invalid SKU format. SKU must be 3-40 characters consisting of letters, numbers, hyphens, or underscores.',
    };
  }

  // Check Product table uniqueness
  const existingProduct = await tx.product.findUnique({
    where: { sku: cleanSku },
    select: { id: true, name: true },
  });

  if (existingProduct && existingProduct.id !== excludeProductId) {
    return {
      isValid: false,
      message: `SKU "${cleanSku}" is already in use by product "${existingProduct.name}".`,
    };
  }

  // Check ProductVariant table uniqueness
  const existingVariant = await tx.productVariant.findUnique({
    where: { sku: cleanSku },
    select: { id: true, name: true, product: { select: { name: true } } },
  });

  if (existingVariant && existingVariant.id !== excludeVariantId) {
    return {
      isValid: false,
      message: `SKU "${cleanSku}" is already in use by variant "${existingVariant.name}" (${existingVariant.product?.name}).`,
    };
  }

  return { isValid: true, cleanSku };
}
