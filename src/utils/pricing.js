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
