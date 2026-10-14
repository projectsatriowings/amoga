/**
 * AMOGA E-COMMERCE — STOREFRONT INVENTORY UTILITIES
 * Standardizes availability derivations, labels, and badges across all collections.
 */

export function resolveAvailability(product, selectedVariant = null) {
  if (!product) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Unavailable',
      isAvailable: false,
      availableQuantity: 0,
      onHandQuantity: 0,
      lowStockThreshold: 5,
      isLowStock: false,
      isOutOfStock: true,
      purchasable: false,
    };
  }

  // If a variant is selected, derive strictly from variant stock
  if (selectedVariant) {
    const onHand = typeof selectedVariant.onHandQuantity === 'number'
      ? selectedVariant.onHandQuantity
      : (typeof selectedVariant.stockQuantity === 'number' ? selectedVariant.stockQuantity : 25);
    const reserved = typeof selectedVariant.reservedQuantity === 'number' ? selectedVariant.reservedQuantity : 0;
    const available = Math.max(0, onHand - reserved);
    const threshold = typeof selectedVariant.lowStockThreshold === 'number' ? selectedVariant.lowStockThreshold : 5;

    const inStock = selectedVariant.inStock !== false && available > 0;
    const isOutOfStock = !inStock || available <= 0;
    const isLowStock = inStock && available <= threshold;

    let label = 'In Stock';
    let detailText = `${available} available`;
    if (isOutOfStock) {
      label = 'Out of Stock';
      detailText = 'Notify Me When Available';
    } else if (isLowStock) {
      label = 'Low Stock';
      detailText = `Only ${available} remaining`;
    }

    return {
      status: isOutOfStock ? 'OUT_OF_STOCK' : (isLowStock ? 'LOW_STOCK' : 'IN_STOCK'),
      label,
      detailText,
      isAvailable: !isOutOfStock,
      availableQuantity: available,
      onHandQuantity: onHand,
      lowStockThreshold: threshold,
      isLowStock,
      isOutOfStock,
      purchasable: !isOutOfStock,
    };
  }

  // Product level availability
  const onHand = typeof product.onHandQuantity === 'number'
    ? product.onHandQuantity
    : (typeof product.stockQuantity === 'number' ? product.stockQuantity : 50);
  const reserved = typeof product.reservedQuantity === 'number' ? product.reservedQuantity : 0;
  const available = Math.max(0, onHand - reserved);
  const threshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 5;

  const inStock = product.inStock !== false && available > 0;
  const isOutOfStock = !inStock || available <= 0;
  const isLowStock = inStock && available <= threshold;

  let label = 'In Stock';
  let detailText = `${available} available`;
  if (isOutOfStock) {
    label = 'Out of Stock';
    detailText = 'Notify Me When Available';
  } else if (isLowStock) {
    label = 'Low Stock';
    detailText = `Only ${available} remaining`;
  }

  return {
    status: isOutOfStock ? 'OUT_OF_STOCK' : (isLowStock ? 'LOW_STOCK' : 'IN_STOCK'),
    label,
    detailText,
    isAvailable: !isOutOfStock,
    availableQuantity: available,
    onHandQuantity: onHand,
    lowStockThreshold: threshold,
    isLowStock,
    isOutOfStock,
    purchasable: !isOutOfStock,
  };
}
