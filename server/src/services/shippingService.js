/**
 * AMOGA E-COMMERCE — INDIA POST SHIPPING RULES SERVICE
 * 
 * Provides authoritative server-side calculation for India Post parcel shipping:
 * - Admin-configurable quantity brackets (default: 1-2 pcs = ₹100, 3 pcs = ₹150, 4 pcs = ₹200)
 * - Configurable beyond-max piece rule (default: +₹50/piece beyond 4 pieces)
 * - Configurable Free Shipping Threshold (default: ₹2,500) and operator (default: >=)
 * - Evaluated against discounted product subtotal (before shipping)
 * - Indian postal code format serviceability validation (6-digit PIN)
 * - Full audit snapshot generation for historical order persistence
 */

export const DEFAULT_SHIPPING_BRACKETS = [
  { minQty: 1, maxQty: 2, charge: 100 },
  { minQty: 3, maxQty: 3, charge: 150 },
  { minQty: 4, maxQty: 4, charge: 200 },
];

/**
 * Validates Indian postal code (6 digits, non-zero starting digit)
 */
export function validateIndianPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return { isValid: false, message: 'Postal code is required.' };
  }
  const clean = pincode.trim().replace(/\s+/g, '');
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      isValid: false,
      message: 'Postal code must be a valid 6-digit Indian PIN code (e.g. 600017, 110001).',
      cleanPincode: clean,
    };
  }
  return { isValid: true, cleanPincode: clean };
}

/**
 * Validates shipping brackets configuration
 */
export function validateShippingBrackets(brackets) {
  if (!Array.isArray(brackets) || brackets.length === 0) {
    return { isValid: false, message: 'At least one shipping bracket must be configured.' };
  }

  const normalized = brackets.map((b) => ({
    minQty: Number(b.minQty !== undefined ? b.minQty : b.minPieces),
    maxQty: Number(b.maxQty !== undefined ? b.maxQty : b.maxPieces),
    charge: Number(b.charge),
  }));

  const sorted = [...normalized].sort((a, b) => a.minQty - b.minQty);

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const min = b.minQty;
    const max = b.maxQty;
    const charge = b.charge;

    if (isNaN(min) || min < 1) {
      return { isValid: false, message: `Bracket #${i + 1}: Minimum quantity must be at least 1.` };
    }
    if (isNaN(max) || max < min) {
      return { isValid: false, message: `Bracket #${i + 1}: Maximum quantity cannot be less than minimum quantity.` };
    }
    if (isNaN(charge) || charge < 0) {
      return { isValid: false, message: `Bracket #${i + 1}: Shipping charge cannot be negative.` };
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (min <= prev.maxQty) {
        return {
          isValid: false,
          message: `Conflicting brackets: Bracket ${min}-${max} overlaps with previous bracket ${prev.minQty}-${prev.maxQty}.`,
        };
      }
    }
  }

  return { isValid: true, brackets: sorted };
}

/**
 * Authoritatively calculates India Post shipping charge based on store settings,
 * actual cart items, discounted subtotal, and destination pincode.
 * 
 * @param {Object} params
 * @param {Array} params.items - Cart items with quantity
 * @param {Number} params.subtotalRupees - Server-calculated product subtotal
 * @param {Number} params.discountRupees - Verified promo discount
 * @param {Object} params.storeSettings - Active StoreSetting database record
 * @param {String} [params.pincode] - Optional delivery postal code
 */
export function calculateShipping({
  items = [],
  subtotalRupees = 0,
  discountRupees = 0,
  storeSettings = {},
  pincode = null,
}) {
  const carrierName = storeSettings.shippingCarrierName || 'India Post';
  const rulesEnabled = storeSettings.shippingRulesEnabled !== false;
  const standardRate = Number(storeSettings.shippingStandardRate || 0);

  // 1. Calculate eligible items and quantity
  const eligibleItemsCount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + (qty > 0 ? qty : 0);
  }, 0);

  // 2. Authoritative discounted subtotal (threshold basis: discounted product subtotal before shipping)
  const netSubtotal = Math.max(0, Number(subtotalRupees) - Number(discountRupees));
  const freeShippingThreshold = Number(storeSettings.freeShippingThreshold ?? 2500.0);
  const thresholdOperator = (storeSettings.shippingThresholdOperator || 'GTE').toUpperCase();

  // 3. Evaluate Free Shipping Threshold Condition
  let isFreeShipping = false;
  if (freeShippingThreshold >= 0) {
    if (thresholdOperator === 'GT') {
      isFreeShipping = netSubtotal > freeShippingThreshold;
    } else {
      // Default GTE: >= threshold qualifies
      isFreeShipping = netSubtotal >= freeShippingThreshold;
    }
  }

  // If cart is empty, shipping is 0
  if (eligibleItemsCount === 0) {
    return {
      carrier: carrierName,
      amount: 0,
      amountPaise: 0,
      isComplimentary: true,
      freeShippingThreshold,
      thresholdOperator,
      isThresholdMet: false,
      netSubtotal,
      eligibleItemsCount: 0,
      ruleApplied: 'EMPTY_CART',
      bracket: null,
      snapshot: {
        carrier: carrierName,
        ruleApplied: 'EMPTY_CART',
        eligibleItemsCount: 0,
        shippingAmount: 0,
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // 4. If Free Shipping Threshold is met
  if (isFreeShipping) {
    const snapshot = {
      carrier: carrierName,
      ruleApplied: 'FREE_SHIPPING_THRESHOLD',
      eligibleItemsCount,
      netSubtotal,
      freeShippingThreshold,
      thresholdOperator,
      isThresholdMet: true,
      shippingAmount: 0,
      pincode: pincode ? String(pincode).trim() : null,
      calculatedAt: new Date().toISOString(),
    };

    return {
      carrier: carrierName,
      amount: 0,
      amountPaise: 0,
      isComplimentary: true,
      freeShippingThreshold,
      thresholdOperator,
      isThresholdMet: true,
      netSubtotal,
      eligibleItemsCount,
      ruleApplied: 'FREE_SHIPPING_THRESHOLD',
      bracket: null,
      snapshot,
    };
  }

  // 5. If shipping rules disabled, use standard fallback rate
  if (!rulesEnabled) {
    const snapshot = {
      carrier: carrierName,
      ruleApplied: 'STANDARD_FLAT_FALLBACK',
      eligibleItemsCount,
      netSubtotal,
      shippingAmount: standardRate,
      calculatedAt: new Date().toISOString(),
    };

    return {
      carrier: carrierName,
      amount: standardRate,
      amountPaise: Math.round(standardRate * 100),
      isComplimentary: standardRate === 0,
      freeShippingThreshold,
      thresholdOperator,
      isThresholdMet: false,
      netSubtotal,
      eligibleItemsCount,
      ruleApplied: 'STANDARD_FLAT_FALLBACK',
      bracket: null,
      snapshot,
    };
  }

  // 6. Parse and evaluate India Post quantity brackets
  let brackets = DEFAULT_SHIPPING_BRACKETS;
  if (storeSettings.shippingBrackets) {
    try {
      const raw = typeof storeSettings.shippingBrackets === 'string'
        ? JSON.parse(storeSettings.shippingBrackets)
        : storeSettings.shippingBrackets;
      if (Array.isArray(raw) && raw.length > 0) {
        brackets = raw.map((b) => ({
          minQty: Number(b.minQty !== undefined ? b.minQty : b.minPieces),
          maxQty: Number(b.maxQty !== undefined ? b.maxQty : b.maxPieces),
          charge: Number(b.charge),
        }));
      }
    } catch {
      brackets = DEFAULT_SHIPPING_BRACKETS;
    }
  }

  // Sort brackets by minQty
  const sortedBrackets = [...brackets].sort((a, b) => Number(a.minQty) - Number(b.minQty));

  // Find matching bracket
  let matchedBracket = null;
  for (const b of sortedBrackets) {
    const min = Number(b.minQty);
    const max = Number(b.maxQty);
    if (eligibleItemsCount >= min && eligibleItemsCount <= max) {
      matchedBracket = b;
      break;
    }
  }

  let finalShippingAmount = 0;
  let ruleApplied = '';
  let calculationDetails = {};

  if (matchedBracket) {
    finalShippingAmount = Number(matchedBracket.charge);
    ruleApplied = 'QUANTITY_BRACKET';
    calculationDetails = {
      bracket: matchedBracket,
    };
  } else {
    // Quantity exceeds highest configured bracket
    const maxConfiguredBracket = sortedBrackets[sortedBrackets.length - 1];
    const maxQty = maxConfiguredBracket ? Number(maxConfiguredBracket.maxQty) : 4;
    const maxBaseCharge = Number(storeSettings.shippingBeyondMaxBaseCharge ?? (maxConfiguredBracket?.charge || 200));
    const beyondMaxRule = storeSettings.shippingBeyondMaxRule || 'PER_PIECE';
    const chargePerPiece = Number(storeSettings.shippingBeyondMaxChargePerPiece ?? 50);

    if (beyondMaxRule === 'FLAT') {
      finalShippingAmount = maxBaseCharge;
      ruleApplied = 'BEYOND_MAX_FLAT';
      calculationDetails = {
        baseCharge: maxBaseCharge,
      };
    } else {
      // Default: PER_PIECE (+₹50 for each additional piece beyond 4)
      const additionalPieces = Math.max(0, eligibleItemsCount - maxQty);
      const additionalCharge = additionalPieces * chargePerPiece;
      finalShippingAmount = maxBaseCharge + additionalCharge;
      ruleApplied = 'BEYOND_MAX_INCREMENTAL';
      calculationDetails = {
        baseCharge: maxBaseCharge,
        maxQty,
        additionalPieces,
        chargePerPiece,
        additionalCharge,
      };
    }
  }

  finalShippingAmount = Math.max(0, Math.round(finalShippingAmount * 100) / 100);

  const snapshot = {
    carrier: carrierName,
    ruleApplied,
    eligibleItemsCount,
    netSubtotal,
    freeShippingThreshold,
    thresholdOperator,
    isThresholdMet: false,
    shippingAmount: finalShippingAmount,
    pincode: pincode ? String(pincode).trim() : null,
    calculationDetails,
    calculatedAt: new Date().toISOString(),
  };

  return {
    carrier: carrierName,
    amount: finalShippingAmount,
    amountPaise: Math.round(finalShippingAmount * 100),
    isComplimentary: finalShippingAmount === 0,
    freeShippingThreshold,
    thresholdOperator,
    isThresholdMet: false,
    netSubtotal,
    eligibleItemsCount,
    ruleApplied,
    bracket: matchedBracket,
    calculationDetails,
    snapshot,
  };
}
