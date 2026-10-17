/**
 * AMOGA E-COMMERCE — PRICING & CURRENCY UTILITIES
 * Centralized currency formatting, pricing validation, and cart arithmetic safeguards.
 */

/**
 * Format numeric value in Indian Rupees (INR)
 * @param {number|null|undefined} amount 
 * @param {boolean} includeSymbol 
 * @returns {string}
 */
export function formatINR(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount) || amount < 0) {
    return 'Price to be confirmed';
  }
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Validates that a product has a confirmed, positive numeric price
 * @param {any} price 
 * @returns {boolean}
 */
export function isValidPrice(price) {
  return typeof price === 'number' && !isNaN(price) && isFinite(price) && price > 0;
}

/**
 * Validates that a quantity is an integer >= 1
 * @param {any} quantity 
 * @returns {boolean}
 */
export function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Compute verified totals across cart lines
 * Strictly excludes any unconfirmed or invalid prices from payable subtotals
 * @param {Array} items 
 * @returns {Object}
 */
export function calculateCartTotals(items = []) {
  if (!Array.isArray(items)) {
    return {
      subtotal: 0,
      totalCount: 0,
      pricedItemCount: 0,
      unpricedItemCount: 0,
      hasUnpricedItems: false,
      isPayable: false,
    };
  }

  let subtotal = 0;
  let totalCount = 0;
  let pricedItemCount = 0;
  let unpricedItemCount = 0;

  for (const item of items) {
    const qty = isValidQuantity(item.quantity) ? item.quantity : 1;
    totalCount += qty;

    const unitPrice = item.price !== undefined ? item.price : item.product?.price;
    if (isValidPrice(unitPrice)) {
      subtotal += unitPrice * qty;
      pricedItemCount += qty;
    } else {
      unpricedItemCount += qty;
    }
  }

  return {
    subtotal,
    totalCount,
    totalItemsCount: totalCount,
    pricedItemCount,
    payableItemsCount: pricedItemCount,
    unpricedItemCount,
    unpricedCount: unpricedItemCount,
    hasUnpricedItems: unpricedItemCount > 0,
    isPayable: items.length > 0 && unpricedItemCount === 0 && subtotal > 0,
  };
}

/**
 * Re-validates entire cart for checkout eligibility
 * @param {Array} items 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateCartForCheckout(items = []) {
  const errors = [];

  if (!items || items.length === 0) {
    errors.push('Your shopping bag is empty. Please add items to proceed.');
    return { isValid: false, canCheckout: false, errors };
  }

  items.forEach((item, index) => {
    const name = item.name || item.product?.name || `Item #${index + 1}`;
    const price = item.price !== undefined ? item.price : item.product?.price;
    
    // Check price
    if (!isValidPrice(price)) {
      errors.push(`"${name}" is awaiting catalogue price confirmation (pricing pending approval) and cannot be purchased.`);
    }

    // Check quantity
    if (!isValidQuantity(item.quantity)) {
      errors.push(`"${name}" has an invalid quantity (${item.quantity}). Quantity must be at least 1.`);
    }
  });

  return {
    isValid: errors.length === 0,
    canCheckout: errors.length === 0,
    errors,
  };
}

/**
 * Calculates taxable value and included GST from a GST-inclusive selling price
 * Formula: Taxable value = inclusive price / (1 + GST rate / 100)
 *          Included GST = inclusive price - taxable value
 * @param {number} inclusivePrice 
 * @param {number} gstRate (e.g. 5 for 5%)
 * @returns {{ inclusivePrice: number, gstRate: number, taxableValue: number, includedGst: number, cgst: number, sgst: number, igst: number }}
 */
export function calculateGstInclusiveBreakdown(inclusivePrice = 0, gstRate = 5) {
  const price = Number(inclusivePrice) || 0;
  const rate = Number(gstRate) || 0;

  if (price <= 0 || rate <= 0) {
    return {
      inclusivePrice: price,
      gstRate: rate,
      taxableValue: price,
      includedGst: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };
  }

  // Exact 2-decimal rounded calculation
  const taxableValue = Math.round((price / (1 + rate / 100)) * 100) / 100;
  const includedGst = Math.round((price - taxableValue) * 100) / 100;
  const halfGst = Math.round((includedGst / 2) * 100) / 100;
  const remainingHalfGst = Math.round((includedGst - halfGst) * 100) / 100;

  return {
    inclusivePrice: price,
    gstRate: rate,
    taxableValue,
    includedGst,
    cgst: halfGst,
    sgst: remainingHalfGst,
    igst: includedGst,
  };
}

/**
 * Client-side estimate for India Post shipping charges
 * Default rules:
 * - 1-2 pcs: ₹100
 * - 3 pcs: ₹150
 * - 4 pcs: ₹200
 * - 5+ pcs: ₹200 + (pcs - 4) * ₹50
 * - Discounted product subtotal >= ₹2,500: Free Shipping
 */
export function estimateIndiaPostShipping({
  itemCount = 0,
  subtotal = 0,
  discount = 0,
  freeShippingThreshold = 2500,
  thresholdOperator = 'GTE',
  brackets = null,
  beyondMaxBaseCharge = 200,
  beyondMaxChargePerPiece = 50,
}) {
  const count = Number(itemCount) || 0;
  const netSubtotal = Math.max(0, (Number(subtotal) || 0) - (Number(discount) || 0));

  if (count === 0) {
    return { amount: 0, isFree: true, ruleApplied: 'EMPTY' };
  }

  const isFree = thresholdOperator === 'GT'
    ? netSubtotal > freeShippingThreshold
    : netSubtotal >= freeShippingThreshold;

  if (isFree) {
    return {
      amount: 0,
      isFree: true,
      ruleApplied: 'FREE_SHIPPING_THRESHOLD',
      threshold: freeShippingThreshold,
    };
  }

  const defaultBrackets = [
    { minQty: 1, maxQty: 2, charge: 100 },
    { minQty: 3, maxQty: 3, charge: 150 },
    { minQty: 4, maxQty: 4, charge: 200 },
  ];

  const activeBrackets = Array.isArray(brackets) && brackets.length > 0 ? brackets : defaultBrackets;
  const matched = activeBrackets.find((b) => count >= Number(b.minQty) && count <= Number(b.maxQty));

  if (matched) {
    return {
      amount: Number(matched.charge),
      isFree: Number(matched.charge) === 0,
      ruleApplied: 'QUANTITY_BRACKET',
      bracket: matched,
    };
  }

  // Beyond max: base charge + incremental per piece
  const maxBracket = activeBrackets[activeBrackets.length - 1];
  const maxQty = maxBracket ? Number(maxBracket.maxQty) : 4;
  const base = Number(beyondMaxBaseCharge || 200);
  const perPiece = Number(beyondMaxChargePerPiece || 50);
  const extra = Math.max(0, count - maxQty) * perPiece;
  const total = base + extra;

  return {
    amount: total,
    isFree: false,
    ruleApplied: 'BEYOND_MAX_INCREMENTAL',
    extraPieces: count - maxQty,
  };
}

