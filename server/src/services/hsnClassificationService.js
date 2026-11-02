import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../config/prisma.js';
import { validateHsnCode, validateGstRate } from './taxService.js';
import { logAdminAction } from '../utils/adminAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache of reference dataset for instantaneous autocomplete
let cachedReferenceData = null;

export function getCachedReferenceData() {
  if (cachedReferenceData) return cachedReferenceData;
  try {
    const jsonPath = path.resolve(__dirname, '../../data/hsn_reference_dataset.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      cachedReferenceData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[HSN] Could not load in-memory dataset, falling back to DB:', err.message);
  }
  return cachedReferenceData;
}

// In-memory cache for Rate Master listing queries
const rateMasterCache = new Map();
const RATE_MASTER_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function invalidateRateMasterCache() {
  rateMasterCache.clear();
}

/**
 * Searches HSN reference candidates from HSN_SAC.pdf and cross-references with verified rate master
 * 
 * @param {Object} params
 * @param {String} params.query - Search term (product name, keyword, or HSN code)
 * @param {Number} params.limit - Max candidates to return (default 20)
 * @param {String} params.collectionId - Optional collection context
 */
export async function searchHsnCandidates({ query = '', limit = 20, collectionId = null }) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  const isNumericQuery = /^[0-9]+$/.test(cleanQuery);
  const terms = cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);

  // Fetch all active verified rate master mappings once to decorate results
  const activeRateMappings = await prisma.gstRateMaster.findMany({
    where: { status: 'APPROVED' },
  });
  const rateMap = new Map();
  for (const rm of activeRateMappings) {
    rateMap.set(rm.hsnCode, rm);
  }

  let collectionKeywords = [];
  if (collectionId) {
    try {
      const col = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { title: true, slug: true },
      });
      if (col) {
        if (col.title) collectionKeywords.push(col.title.toLowerCase());
        if (col.slug) collectionKeywords.push(col.slug.toLowerCase().replace(/[-_]/g, ' '));
      }
    } catch {
      // Ignore collection lookup failure
    }
  }

  const TRADE_SYNONYMS = {
    silk: ['5007', '50', 'fabrics', 'woven', 'silk'],
    saree: ['5007', '5208', '5407', '5806', '5810', 'woven', 'fabrics', 'saree'],
    sarees: ['5007', '5208', '5407', '5806', '5810', 'woven', 'fabrics', 'saree'],
    zari: ['5806', '5803', '5810', 'narrow', 'embroidery'],
    cotton: ['5208', '5209', '5210', '52', 'cotton', 'fabrics'],
    artsilk: ['5407', '54', 'synthetic', 'fabrics', 'woven'],
    pendant: ['7113', 'jewellery'],
    pendants: ['7113', 'jewellery'],
    ring: ['7113', 'jewellery'],
    rings: ['7113', 'jewellery'],
    jewellery: ['7113', 'jewellery'],
    silver: ['7113', '7106', 'silver'],
    gold: ['7113', '7108', 'gold'],
    podi: ['2103', 'sauces', 'condiments', 'seasonings', 'powder'],
    soup: ['2104', 'soups', 'broths'],
    soups: ['2104', 'soups', 'broths'],
    millet: ['1008', 'millet', 'cereals'],
    millets: ['1008', 'millet', 'cereals'],
    mix: ['2106', 'preparations', 'composite'],
    mixes: ['2106', 'preparations', 'composite'],
    tea: ['0902', 'tea'],
    coffee: ['0901', 'coffee'],
    spice: ['0910', '0904', 'spices'],
    spices: ['0910', '0904', 'spices'],
  };

  // Helper to find matching rate in rateMap (exact -> 4-digit heading -> 2-digit chapter)
  const findRateForCode = (codeStr) => {
    const exact = rateMap.get(codeStr);
    if (exact) return { rate: exact, isExact: true };
    if (codeStr.length > 4) {
      const parent4 = rateMap.get(codeStr.substring(0, 4));
      if (parent4) return { rate: parent4, isExact: false, parentCode: codeStr.substring(0, 4) };
    }
    if (codeStr.length > 2) {
      const parent2 = rateMap.get(codeStr.substring(0, 2));
      if (parent2) return { rate: parent2, isExact: false, parentCode: codeStr.substring(0, 2) };
    }
    return null;
  };

  // Load from memory cache for sub-millisecond response, or DB fallback
  const dataset = getCachedReferenceData();
  let matchedEntries = [];

  if (dataset && Array.isArray(dataset)) {
    for (const item of dataset) {
      let score = 0;
      let reasons = [];

      const itemCode = String(item.hsnCode);
      const itemDesc = (item.description || '').toLowerCase();

      if (isNumericQuery) {
        if (itemCode === cleanQuery) {
          score += 100;
          reasons.push(`Exact HSN code match (${itemCode})`);
        } else if (itemCode.startsWith(cleanQuery)) {
          score += 75;
          reasons.push(`Starts with HSN prefix (${cleanQuery})`);
        } else if (itemCode.includes(cleanQuery)) {
          score += 40;
          reasons.push(`Contains digits (${cleanQuery})`);
        }
      } else {
        let allTermsMatched = true;
        let anyTermMatched = false;

        for (let i = 0; i < terms.length; i++) {
          const term = terms[i];
          const isPrimaryTerm = i === 0;
          const termWeight = isPrimaryTerm ? 50 : 25;
          const termRegex = new RegExp(`\\b${term}`, 'i');

          if (termRegex.test(itemDesc)) {
            anyTermMatched = true;
            score += termWeight;
          } else if (itemDesc.includes(term)) {
            anyTermMatched = true;
            score += Math.round(termWeight * 0.6);
          } else {
            // Check trade synonyms
            const syns = TRADE_SYNONYMS[term] || [];
            let synMatched = false;
            for (const syn of syns) {
              if (itemCode.startsWith(syn)) {
                synMatched = true;
                anyTermMatched = true;
                score += (isPrimaryTerm ? 60 : 35);
                break;
              } else if (itemDesc.includes(syn)) {
                synMatched = true;
                anyTermMatched = true;
                score += (isPrimaryTerm ? 40 : 20);
                break;
              }
            }
            if (!synMatched) {
              allTermsMatched = false;
            }
          }
        }

        if (allTermsMatched && terms.length > 1) {
          score += 35;
          reasons.push(`Contains all keywords: "${cleanQuery}"`);
        } else if (anyTermMatched) {
          reasons.push(`Matches keyword in description`);
        }

        // Check collection context boost
        if (collectionKeywords.length > 0) {
          for (const ck of collectionKeywords) {
            if (itemDesc.includes(ck)) {
              score += 45;
              reasons.push(`Matches product category`);
              break;
            }
          }
        }
      }

      // Priority boost for items with approved rate in Rate Master
      const rateMatch = findRateForCode(itemCode);
      if (rateMatch) {
        if (rateMatch.isExact) {
          score += 100;
          reasons.unshift(`Pre-approved GST rate (${rateMatch.rate.gstRate}%)`);
        } else {
          score += 60;
          reasons.unshift(`Inherits ${rateMatch.rate.gstRate}% rate from HSN ${rateMatch.parentCode}`);
        }
      }

      if (score > 0) {
        matchedEntries.push({
          item,
          score,
          rateMatch,
          reason: reasons.join('; ') || 'Text match',
        });
      }
    }
  } else {
    // Database search fallback
    const dbResults = await prisma.hsnReference.findMany({
      where: isNumericQuery
        ? { hsnCode: { startsWith: cleanQuery } }
        : { description: { contains: cleanQuery, mode: 'insensitive' } },
      take: 50,
    });

    matchedEntries = dbResults.map((r) => {
      const itemCode = String(r.hsnCode);
      const rateMatch = findRateForCode(itemCode);
      let baseScore = r.hsnCode === cleanQuery ? 100 : 50;
      if (rateMatch) {
        baseScore += rateMatch.isExact ? 100 : 60;
      }
      return {
        item: r,
        score: baseScore,
        rateMatch,
        reason: isNumericQuery ? `HSN Code prefix ${cleanQuery}` : `Description matches "${cleanQuery}"`,
      };
    });
  }

  // Sort by score descending, prefer items with verified rates, prefer 4-digit Heading or Chapter on ties
  matchedEntries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aLen = a.item.codeLength || a.item.hsnCode.length;
    const bLen = b.item.codeLength || b.item.hsnCode.length;
    const aIsHeading = (aLen === 4);
    const bIsHeading = (bLen === 4);
    if (aIsHeading && !bIsHeading) return -1;
    if (!aIsHeading && bIsHeading) return 1;
    return aLen - bLen;
  });

  const topCandidates = matchedEntries.slice(0, Math.min(limit, 50));

  return topCandidates.map(({ item, score, reason, rateMatch }) => {
    const code = String(item.hsnCode);
    const resolvedRate = rateMatch || findRateForCode(code);
    const matchedRate = resolvedRate ? resolvedRate.rate : null;

    return {
      hsnCode: code,
      description: item.description,
      level: item.level || (code.length === 2 ? 'CHAPTER' : code.length === 4 ? 'HEADING' : code.length === 6 ? 'SUBHEADING' : 'TARIFF_ITEM'),
      codeLength: code.length,
      matchReason: isNumericQuery && code === cleanQuery ? 'Exact HSN Code Match' : reason,
      confidence: score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW',
      confidenceScore: isNumericQuery && code === cleanQuery ? 1.0 : Math.min(1.0, score / 100),
      hasVerifiedRate: Boolean(matchedRate),
      verifiedGstRate: matchedRate ? Number(matchedRate.gstRate) : null,
      score,
      sourceFileName: item.sourceFileName || 'HSN_SAC.pdf',
      importDate: item.importDate || new Date().toISOString(),
      sourcePage: item.sourcePage || null,
      verifiedRateMapping: matchedRate
        ? {
            id: matchedRate.id,
            hsnCode: matchedRate.hsnCode,
            isExactMatch: Boolean(resolvedRate && resolvedRate.isExact),
            gstRate: Number(matchedRate.gstRate),
            taxTreatment: matchedRate.taxTreatment,
            cessRate: Number(matchedRate.cessRate || 0),
            officialSource: matchedRate.officialSource,
            verifiedBy: matchedRate.verifiedBy,
            verifiedAt: matchedRate.verifiedAt,
            effectiveFrom: matchedRate.effectiveFrom,
            status: matchedRate.status,
          }
        : null,
    };
  });
}

/**
 * Checks if there is an active conflicting rate master mapping for the given HSN code
 */
export async function checkConflictingRateMapping({ hsnCode, excludeId = null, effectiveFrom = null, effectiveTo = null }) {
  const existingActive = await prisma.gstRateMaster.findMany({
    where: {
      hsnCode: String(hsnCode).trim(),
      status: 'APPROVED',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  for (const existing of existingActive) {
    // Check overlap of effective periods
    const existingFrom = existing.effectiveFrom ? new Date(existing.effectiveFrom).getTime() : 0;
    const existingTo = existing.effectiveTo ? new Date(existing.effectiveTo).getTime() : Infinity;

    const newFrom = effectiveFrom ? new Date(effectiveFrom).getTime() : 0;
    const newTo = effectiveTo ? new Date(effectiveTo).getTime() : Infinity;

    // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
    if (newFrom <= existingTo && newTo >= existingFrom) {
      return {
        hasConflict: true,
        conflictingRecord: existing,
        message: `Conflicting active mapping exists for HSN ${hsnCode} with rate ${existing.gstRate}% (Effective: ${existing.effectiveFrom ? existing.effectiveFrom.toISOString().split('T')[0] : 'Indefinite'} to ${existing.effectiveTo ? existing.effectiveTo.toISOString().split('T')[0] : 'Current'}). Deactivate or update the existing mapping first.`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Creates a verified GST Rate Master entry
 */
export async function createRateMasterEntry({
  hsnCode,
  description,
  gstRate,
  taxTreatment = 'TAXABLE',
  cessRate = 0,
  effectiveFrom = null,
  effectiveTo = null,
  officialSource = '',
  sourceReference = '',
  status = 'APPROVED',
  notes = '',
  adminEmail = 'tax-admin@amoga.com',
}) {
  const hsnVal = validateHsnCode(hsnCode);
  if (!hsnVal.isValid) {
    throw new Error(hsnVal.message);
  }

  const rateVal = validateGstRate(gstRate);
  if (!rateVal.isValid) {
    throw new Error(rateVal.message);
  }

  const normStatus = (status === 'ACTIVE' || status === 'APPROVED') ? 'APPROVED' : (status || 'APPROVED');

  if (normStatus === 'APPROVED') {
    const conflict = await checkConflictingRateMapping({
      hsnCode: hsnVal.cleanHsn,
      effectiveFrom,
      effectiveTo,
    });
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }
  }
  const record = await prisma.gstRateMaster.create({
    data: {
      hsnCode: hsnVal.cleanHsn,
      description: String(description || '').trim(),
      gstRate: rateVal.rate,
      taxTreatment: ['TAXABLE', 'NIL_RATED', 'EXEMPT', 'NON_GST'].includes(taxTreatment) ? taxTreatment : 'TAXABLE',
      cessRate: Number(cessRate) || 0,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      officialSource: String(officialSource || sourceReference || '').trim() || null,
      status: ['APPROVED', 'PENDING_REVIEW', 'INACTIVE'].includes(normStatus) ? normStatus : 'APPROVED',
      verifiedBy: adminEmail,
      verifiedAt: normStatus === 'APPROVED' ? new Date() : null,
      notes: notes ? String(notes).trim() : null,
    },
  });

  await logAdminAction({
    adminEmail,
    action: 'GST_RATE_MASTER_CREATE',
    entityType: 'GstRateMaster',
    entityId: record.id,
    details: { hsnCode: record.hsnCode, gstRate: record.gstRate, taxTreatment: record.taxTreatment },
  });

  invalidateRateMasterCache();

  return record;
}

/**
 * Updates an existing GST Rate Master entry
 */
export async function updateRateMasterEntry(id, updates = {}, adminEmail = 'tax-admin@amoga.com') {
  const existing = await prisma.gstRateMaster.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`GST Rate Master entry "${id}" not found.`);
  }

  const newHsn = updates.hsnCode !== undefined ? String(updates.hsnCode).trim() : existing.hsnCode;
  const rawStatus = updates.status !== undefined ? updates.status : existing.status;
  const newStatus = (rawStatus === 'ACTIVE' || rawStatus === 'APPROVED') ? 'APPROVED' : rawStatus;
  const newEffectiveFrom = updates.effectiveFrom !== undefined ? updates.effectiveFrom : existing.effectiveFrom;
  const newEffectiveTo = updates.effectiveTo !== undefined ? updates.effectiveTo : existing.effectiveTo;

  if (newStatus === 'APPROVED') {
    const conflict = await checkConflictingRateMapping({
      hsnCode: newHsn,
      excludeId: id,
      effectiveFrom: newEffectiveFrom,
      effectiveTo: newEffectiveTo,
    });
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }
  }

  let newGstRate = existing.gstRate;
  if (updates.gstRate !== undefined) {
    const rateVal = validateGstRate(updates.gstRate);
    if (!rateVal.isValid) throw new Error(rateVal.message);
    newGstRate = rateVal.rate;
  }

  const updated = await prisma.gstRateMaster.update({
    where: { id },
    data: {
      hsnCode: newHsn,
      description: updates.description !== undefined ? String(updates.description).trim() : existing.description,
      gstRate: newGstRate,
      taxTreatment: updates.taxTreatment !== undefined ? updates.taxTreatment : existing.taxTreatment,
      cessRate: updates.cessRate !== undefined ? Number(updates.cessRate) : existing.cessRate,
      effectiveFrom: newEffectiveFrom ? new Date(newEffectiveFrom) : null,
      effectiveTo: newEffectiveTo ? new Date(newEffectiveTo) : null,
      officialSource: updates.officialSource !== undefined ? String(updates.officialSource).trim() : existing.officialSource,
      status: newStatus,
      verifiedBy: adminEmail,
      verifiedAt: newStatus === 'APPROVED' ? new Date() : existing.verifiedAt,
      notes: updates.notes !== undefined ? String(updates.notes).trim() : existing.notes,
    },
  });

  await logAdminAction({
    adminEmail,
    action: 'GST_RATE_MASTER_UPDATE',
    entityType: 'GstRateMaster',
    entityId: updated.id,
    details: { changes: updates },
  });

  invalidateRateMasterCache();

  return updated;
}

/**
 * Lists GST rate master entries with optional search and filters
 */
export async function listRateMasterEntries({ search = '', status = null, page = 1, limit = 50 }) {
  const cacheKey = JSON.stringify({ search, status, page, limit });
  const now = Date.now();
  const cached = rateMasterCache.get(cacheKey);
  if (cached && (now - cached.timestamp < RATE_MASTER_CACHE_TTL_MS)) {
    return cached.data;
  }

  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    const clean = search.trim();
    where.OR = [
      { hsnCode: { contains: clean, mode: 'insensitive' } },
      { description: { contains: clean, mode: 'insensitive' } },
      { officialSource: { contains: clean, mode: 'insensitive' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [total, items] = await Promise.all([
    prisma.gstRateMaster.count({ where }),
    prisma.gstRateMaster.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ hsnCode: 'asc' }, { effectiveFrom: 'desc' }],
    }),
  ]);

  const result = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: items.map((item) => ({
      ...item,
      gstRate: Number(item.gstRate),
      cessRate: Number(item.cessRate),
    })),
  };

  rateMasterCache.set(cacheKey, { timestamp: now, data: result });
  return result;
}

/**
 * Authoritatively confirms product or variant tax classification
 */
export async function confirmProductTaxClassification({
  productId,
  variantId = null,
  hsnCode,
  gstRate,
  taxTreatment = 'TAXABLE',
  isTaxInclusive = true,
  cessRate = 0,
  taxNotes = '',
  adminEmail,
  adminRole,
}) {
  // Authorization check: Only SUPER_ADMIN and CATALOGUE_MANAGER can confirm tax classifications
  if (!['SUPER_ADMIN', 'CATALOGUE_MANAGER'].includes(adminRole)) {
    throw new Error('Unauthorized: Only authorized catalogue administrators or super admins can approve GST/HSN classifications.');
  }

  const hsnVal = validateHsnCode(hsnCode);
  if (!hsnVal.isValid) throw new Error(hsnVal.message);

  const rateVal = validateGstRate(gstRate);
  if (!rateVal.isValid) throw new Error(rateVal.message);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product) throw new Error(`Product "${productId}" not found.`);

  const now = new Date();

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant "${variantId}" not found for product.`);

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        hsnCode: hsnVal.cleanHsn,
        gstRate: rateVal.rate,
        taxTreatment,
        isTaxInclusive: Boolean(isTaxInclusive),
        cessRate: Number(cessRate) || 0,
        taxVerificationStatus: 'VERIFIED',
        taxConfirmedBy: adminEmail,
        taxConfirmedAt: now,
        taxNotes: taxNotes ? String(taxNotes).trim() : null,
      },
    });

    await logAdminAction({
      adminEmail,
      action: 'VARIANT_TAX_CLASSIFICATION_CONFIRM',
      entityType: 'ProductVariant',
      entityId: variantId,
      details: { productId, hsnCode: hsnVal.cleanHsn, gstRate: rateVal.rate },
    });

    return { success: true, variant: updatedVariant };
  }

  // Update base product
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      hsnCode: hsnVal.cleanHsn,
      gstRate: rateVal.rate,
      taxTreatment,
      isTaxInclusive: Boolean(isTaxInclusive),
      cessRate: Number(cessRate) || 0,
      taxVerificationStatus: 'VERIFIED',
      taxConfirmedBy: adminEmail,
      taxConfirmedAt: now,
      taxNotes: taxNotes ? String(taxNotes).trim() : null,
      verified: true, // mark product verified if tax is confirmed
    },
  });

  await logAdminAction({
    adminEmail,
    action: 'PRODUCT_TAX_CLASSIFICATION_CONFIRM',
    entityType: 'Product',
    entityId: productId,
    details: { hsnCode: hsnVal.cleanHsn, gstRate: rateVal.rate },
  });

  return { success: true, product: updatedProduct };
}

/**
 * Gets currently active verified rate mapping for an HSN code
 */
export async function getVerifiedRateForHsn(hsnCode) {
  if (!hsnCode) return null;
  const clean = String(hsnCode).trim();
  const now = new Date();
  const entry = await prisma.gstRateMaster.findFirst({
    where: {
      hsnCode: clean,
      status: 'APPROVED',
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } },
      ],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
  return entry;
}

