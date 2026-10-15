import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import {
  triggerRestockNotifications,
  checkAndTriggerThresholdAlert,
} from './notificationService.js';

/**
 * AMOGA E-COMMERCE — CENTRALIZED INVENTORY SERVICE
 * 
 * Single authoritative source of truth for all stock-changing workflows:
 * - On-hand, reserved, and available quantity derivations
 * - Concurrency-safe atomic reservations for checkout
 * - Commit deductions upon confirmed payment
 * - Safe release of cancellations, failures, and expirations
 * - Transactional admin adjustments and restock triggers
 */

// Default reservation hold window in minutes
const DEFAULT_RESERVATION_EXPIRY_MINUTES = 30;

/**
 * Get current authoritative availability for a product or variant
 */
export async function getAvailability(target, maybeVariantIdOrClient = null, maybeClient = prisma) {
  let productId;
  let variantId = null;
  let client = prisma;

  if (typeof target === 'string') {
    productId = target;
    if (typeof maybeVariantIdOrClient === 'string') {
      variantId = maybeVariantIdOrClient;
      if (maybeClient && maybeClient.product) client = maybeClient;
    } else if (maybeVariantIdOrClient && maybeVariantIdOrClient.product) {
      client = maybeVariantIdOrClient;
    }
  } else if (target && typeof target === 'object') {
    productId = target.productId;
    variantId = target.variantId || null;
    if (maybeVariantIdOrClient && maybeVariantIdOrClient.product) {
      client = maybeVariantIdOrClient;
    }
  }

  if (!productId) {
    return { exists: false, error: 'PRODUCT_ID_REQUIRED' };
  }
  if (variantId) {
    const variant = await client.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { id: true, name: true, slug: true, inStock: true } },
      },
    });

    if (!variant || variant.productId !== productId) {
      return { exists: false, error: 'VARIANT_NOT_FOUND' };
    }

    const onHandQuantity = Math.max(0, variant.stockQuantity || 0);
    const reservedQuantity = Math.max(0, variant.reservedQuantity || 0);
    const availableQuantity = Math.max(0, onHandQuantity - reservedQuantity);
    const threshold = variant.lowStockThreshold || 5;

    const inStock = variant.inStock && availableQuantity > 0;
    const isOutOfStock = availableQuantity <= 0;
    const isLowStock = availableQuantity > 0 && availableQuantity <= threshold;

    return {
      exists: true,
      productId: variant.productId,
      productName: variant.product.name,
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku || variant.id,
      onHandQuantity,
      reservedQuantity,
      availableQuantity,
      lowStockThreshold: threshold,
      inStock,
      isLowStock,
      isOutOfStock,
      purchasable: inStock && availableQuantity > 0,
    };
  }

  const product = await client.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
          inStock: true,
        },
      },
    },
  });

  if (!product) {
    return { exists: false, error: 'PRODUCT_NOT_FOUND' };
  }

  const onHandQuantity = Math.max(0, product.stockQuantity || 0);
  const reservedQuantity = Math.max(0, product.reservedQuantity || 0);
  const availableQuantity = Math.max(0, onHandQuantity - reservedQuantity);
  const threshold = product.lowStockThreshold || 5;

  const inStock = product.inStock && availableQuantity > 0;
  const isOutOfStock = availableQuantity <= 0;
  const isLowStock = availableQuantity > 0 && availableQuantity <= threshold;

  return {
    exists: true,
    productId: product.id,
    productName: product.name,
    variantId: null,
    variantName: null,
    sku: product.sourceId || product.id,
    onHandQuantity,
    reservedQuantity,
    availableQuantity,
    lowStockThreshold: threshold,
    inStock,
    isLowStock,
    isOutOfStock,
    purchasable: inStock && availableQuantity > 0,
    variantsCount: product.variants?.length || 0,
  };
}

/**
 * Concurrency-Safe Atomic Stock Reservation for Checkout
 * Validates requested quantities against available stock inside an atomic transaction.
 * Creates InventoryReservation records with configurable expiry.
 */
export async function reserveStock({
  tx,
  orderId,
  orderReference,
  items,
  expiryMinutes = DEFAULT_RESERVATION_EXPIRY_MINUTES,
}) {
  const client = tx || prisma;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const reservationsCreated = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error(`Invalid requested quantity for product "${item.productName || item.productId}".`);
      err.status = 422;
      throw err;
    }

    if (item.variantId) {
      // Variant-level stock reservation
      const variant = await client.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        const err = new Error(`Variant "${item.variantName || item.variantId}" not found.`);
        err.status = 404;
        throw err;
      }

      const available = Math.max(0, variant.stockQuantity - variant.reservedQuantity);
      if (qty > available) {
        const err = new Error(
          `Insufficient stock for "${variant.product.name} (${variant.name})". Requested: ${qty}, Available: ${available}.`
        );
        err.status = 422;
        err.details = {
          productId: variant.productId,
          variantId: variant.id,
          requested: qty,
          available,
        };
        throw err;
      }

      // Concurrency check and atomic increment
      await client.productVariant.update({
        where: { id: variant.id },
        data: {
          reservedQuantity: { increment: qty },
        },
      });

      const reservation = await client.inventoryReservation.create({
        data: {
          orderId,
          orderReference,
          productId: variant.productId,
          variantId: variant.id,
          quantity: qty,
          status: 'ACTIVE',
          expiresAt,
        },
      });

      reservationsCreated.push(reservation);
    } else {
      // Product-level stock reservation
      const product = await client.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        const err = new Error(`Product "${item.productName || item.productId}" not found.`);
        err.status = 404;
        throw err;
      }

      const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
      if (qty > available) {
        const err = new Error(
          `Insufficient stock for "${product.name}". Requested: ${qty}, Available: ${available}.`
        );
        err.status = 422;
        err.details = {
          productId: product.id,
          variantId: null,
          requested: qty,
          available,
        };
        throw err;
      }

      await client.product.update({
        where: { id: product.id },
        data: {
          reservedQuantity: { increment: qty },
        },
      });

      const reservation = await client.inventoryReservation.create({
        data: {
          orderId,
          orderReference,
          productId: product.id,
          variantId: null,
          quantity: qty,
          status: 'ACTIVE',
          expiresAt,
        },
      });

      reservationsCreated.push(reservation);
    }
  }

  // Trigger low-stock threshold evaluation on newly reserved items against available stock
  for (const res of reservationsCreated) {
    checkAndTriggerThresholdAlert({
      productId: res.productId,
      variantId: res.variantId,
    }).catch((err) => console.error('[LOW STOCK ALERT ON RESERVATION ERROR]:', err));
  }

  return reservationsCreated;
}

/**
 * Commits stock deduction exactly once after confirmed payment / order confirmation.
 * Transitions ACTIVE reservations to COMMITTED, decrements on-hand and reserved quantity,
 * creates audit InventoryLog, and evaluates low-stock threshold alerts.
 */
export async function commitReservation(firstArg, ...rest) {
  let params;
  if (typeof firstArg === 'string') {
    params = {
      orderId: firstArg,
      orderReference: rest[0] || 'ORDER_CONFIRMED',
    };
  } else {
    params = firstArg || {};
  }
  const { tx, orderId, orderReference, actor = 'SYSTEM: FULFILMENT', type = 'FULFILMENT', reason } = params;
  const client = tx || prisma;

  if (!orderId && !orderReference) {
    return { success: false, note: 'orderId or orderReference is required' };
  }

  const orderWhere = orderId ? { orderId } : { orderReference };

  // 1. Fetch active reservations for this order
  const activeReservations = await client.inventoryReservation.findMany({
    where: {
      ...orderWhere,
      status: 'ACTIVE',
    },
    include: {
      product: true,
      variant: true,
    },
  });

  if (activeReservations.length === 0) {
    // Idempotent check: check if already committed
    const committedReservations = await client.inventoryReservation.findMany({
      where: {
        ...orderWhere,
        status: 'COMMITTED',
      },
    });

    if (committedReservations.length > 0) {
      return { success: true, isDuplicate: true, committedCount: committedReservations.length, processedCount: 0 };
    }

    return { success: true, committedCount: 0, processedCount: 0, note: 'No active reservations to commit' };
  }

  for (const res of activeReservations) {
    const qty = res.quantity;

    if (res.variantId) {
      const currentVariant = await client.productVariant.findUnique({
        where: { id: res.variantId },
      });

      if (currentVariant) {
        const prevStock = currentVariant.stockQuantity;
        const newStock = Math.max(0, currentVariant.stockQuantity - qty);
        const newReserved = Math.max(0, currentVariant.reservedQuantity - qty);

        await client.productVariant.update({
          where: { id: res.variantId },
          data: {
            stockQuantity: newStock,
            reservedQuantity: newReserved,
            inStock: newStock > 0,
          },
        });

        await client.inventoryLog.create({
          data: {
            productId: res.productId,
            variantId: res.variantId,
            previousStock: prevStock,
            adjustedStock: newStock,
            delta: -qty,
            reason: reason || `Order ${orderReference} stock deduction upon fulfillment / dispatch`,
            adminEmail: typeof actor === 'string' && actor.startsWith('ADMIN:') ? actor.replace('ADMIN: ', '') : 'system',
            orderId,
            actor: typeof actor === 'string' ? actor : 'SYSTEM',
            type,
          },
        });

        // Threshold check
        await checkAndTriggerThresholdAlert({
          productId: res.productId,
          variantId: res.variantId,
          stockQuantity: newStock,
          threshold: currentVariant.lowStockThreshold || 5,
          productName: res.product.name,
          variantName: res.variant?.name,
          sku: res.variant?.sku,
        });
      }
    } else {
      const currentProduct = await client.product.findUnique({
        where: { id: res.productId },
      });

      if (currentProduct) {
        const prevStock = currentProduct.stockQuantity;
        const newStock = Math.max(0, currentProduct.stockQuantity - qty);
        const newReserved = Math.max(0, currentProduct.reservedQuantity - qty);

        await client.product.update({
          where: { id: res.productId },
          data: {
            stockQuantity: newStock,
            reservedQuantity: newReserved,
            inStock: newStock > 0,
          },
        });

        await client.inventoryLog.create({
          data: {
            productId: res.productId,
            variantId: null,
            previousStock: prevStock,
            adjustedStock: newStock,
            delta: -qty,
            reason: reason || `Order ${orderReference} stock deduction upon fulfillment / dispatch`,
            adminEmail: typeof actor === 'string' && actor.startsWith('ADMIN:') ? actor.replace('ADMIN: ', '') : 'system',
            orderId,
            actor: typeof actor === 'string' ? actor : 'SYSTEM',
            type,
          },
        });

        // Threshold check
        await checkAndTriggerThresholdAlert({
          productId: res.productId,
          variantId: null,
          stockQuantity: newStock,
          threshold: currentProduct.lowStockThreshold || 5,
          productName: res.product.name,
          variantName: null,
          sku: currentProduct.sourceId,
        });
      }
    }

    // Mark reservation as COMMITTED
    await client.inventoryReservation.update({
      where: { id: res.id },
      data: { status: 'COMMITTED' },
    });
  }

  return { success: true, committedCount: activeReservations.length, processedCount: activeReservations.length };
}

/**
 * Releases ACTIVE reservations after payment failure, cancellation, or expiration
 */
export async function releaseReservation(firstArg, ...rest) {
  let params;
  if (typeof firstArg === 'string') {
    params = {
      identifier: firstArg,
      reason: rest[0] || 'Payment failed or cancelled',
    };
  } else {
    params = firstArg || {};
  }
  const { tx, orderId, orderReference, identifier, reason = 'Payment failed or cancelled' } = params;
  const client = tx || prisma;

  const targetId = identifier || orderId;
  if (!targetId && !orderReference) {
    return { success: true, releasedCount: 0 };
  }

  const activeReservations = await client.inventoryReservation.findMany({
    where: {
      status: 'ACTIVE',
      ...(targetId
        ? { OR: [{ id: targetId }, { orderId: targetId }] }
        : { orderReference }),
    },
  });

  if (activeReservations.length === 0) {
    return { success: true, releasedCount: 0 };
  }

  for (const res of activeReservations) {
    const qty = res.quantity;

    if (res.variantId) {
      const variant = await client.productVariant.findUnique({ where: { id: res.variantId } });
      if (variant) {
        const newReserved = Math.max(0, variant.reservedQuantity - qty);
        await client.productVariant.update({
          where: { id: res.variantId },
          data: {
            reservedQuantity: newReserved,
          },
        });
      }
    } else {
      const product = await client.product.findUnique({ where: { id: res.productId } });
      if (product) {
        const newReserved = Math.max(0, product.reservedQuantity - qty);
        await client.product.update({
          where: { id: res.productId },
          data: {
            reservedQuantity: newReserved,
          },
        });
      }
    }

    await client.inventoryReservation.update({
      where: { id: res.id },
      data: { status: 'RELEASED' },
    });
  }

  return { success: true, releasedCount: activeReservations.length };
}

/**
 * Periodically sweeps and safely releases expired reservations
 */
export async function releaseExpiredReservations() {
  const now = new Date();
  const expired = await prisma.inventoryReservation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
  });

  if (expired.length === 0) return { released: 0 };

  let count = 0;
  for (const res of expired) {
    try {
      // Check if order has been confirmed, processing, dispatched, delivered, or paid
      if (res.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: res.orderId },
          select: { status: true, paymentStatus: true },
        });

        if (
          order &&
          (
            ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].includes(order.status) ||
            order.paymentStatus === 'SUCCEEDED'
          )
        ) {
          // Keep reservation active for confirmed patron orders
          continue;
        }
      }

      await prisma.$transaction(async (tx) => {
        if (res.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: res.variantId } });
          if (variant) {
            await tx.productVariant.update({
              where: { id: res.variantId },
              data: {
                reservedQuantity: Math.max(0, variant.reservedQuantity - res.quantity),
              },
            });
          }
        } else {
          const product = await tx.product.findUnique({ where: { id: res.productId } });
          if (product) {
            await tx.product.update({
              where: { id: res.productId },
              data: {
                reservedQuantity: Math.max(0, product.reservedQuantity - res.quantity),
              },
            });
          }
        }

        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'EXPIRED' },
        });
      });
      count++;
    } catch (err) {
      console.warn(`[RELEASE EXPIRED RESERVATION ERROR] resId=${res.id}:`, err.message);
    }
  }

  return { released: count };
}

/**
 * Authorized Admin Stock Adjustment / Restock Workflow
 * Enforces audit logging, validates integer quantities, and triggers back-in-stock notifications.
 */
export async function adjustStock(firstArg, ...rest) {
  let params;
  if (typeof firstArg === 'string') {
    params = {
      productId: firstArg,
      variantId: rest[0] || null,
      newStock: rest[1],
      reason: rest[2],
      admin: rest[3] ? (typeof rest[3] === 'string' ? { email: rest[3] } : rest[3]) : null,
    };
  } else {
    params = firstArg || {};
  }
  const { admin, productId, variantId = null, newStock, lowStockThreshold, reason } = params;

  if (!productId || newStock === undefined || !reason || !reason.trim()) {
    const err = new Error('Product ID, new stock quantity, and adjustment reason are required.');
    err.status = 400;
    throw err;
  }

  const targetStock = Math.max(0, parseInt(newStock, 10));
  if (!Number.isInteger(targetStock)) {
    const err = new Error('Stock quantity must be a non-negative integer.');
    err.status = 400;
    throw err;
  }

  const thresholdVal = lowStockThreshold !== undefined ? Math.max(0, parseInt(lowStockThreshold, 10)) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    let previousStock = 0;
    let previousReserved = 0;
    let targetName = '';
    let targetSku = '';
    let variantName = null;
    let resolvedThreshold = 5;

    if (variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant || variant.productId !== productId) {
        const err = new Error('VARIANT_NOT_FOUND');
        err.status = 404;
        throw err;
      }

      previousStock = variant.stockQuantity;
      previousReserved = variant.reservedQuantity;
      targetName = `${variant.product.name} (${variant.name})`;
      variantName = variant.name;
      targetSku = variant.sku || variant.id;
      resolvedThreshold = thresholdVal !== undefined ? thresholdVal : (variant.lowStockThreshold || 5);

      const updateData = {
        stockQuantity: targetStock,
        inStock: targetStock > 0,
      };
      if (thresholdVal !== undefined) updateData.lowStockThreshold = thresholdVal;

      await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });
    } else {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        const err = new Error('PRODUCT_NOT_FOUND');
        err.status = 404;
        throw err;
      }

      previousStock = product.stockQuantity;
      previousReserved = product.reservedQuantity;
      targetName = product.name;
      targetSku = product.sourceId || product.id;
      resolvedThreshold = thresholdVal !== undefined ? thresholdVal : (product.lowStockThreshold || 5);

      const updateData = {
        stockQuantity: targetStock,
        inStock: targetStock > 0,
      };
      if (thresholdVal !== undefined) updateData.lowStockThreshold = thresholdVal;

      await tx.product.update({
        where: { id: productId },
        data: updateData,
      });
    }

    const delta = targetStock - previousStock;
    const isRestock = delta > 0;

    const log = await tx.inventoryLog.create({
      data: {
        productId,
        variantId: variantId || null,
        previousStock,
        adjustedStock: targetStock,
        delta,
        reason: reason.trim(),
        adminEmail: admin?.email || 'admin@amoga.com',
        adminId: admin?.id || null,
        actor: admin ? `ADMIN: ${admin.email}` : 'SYSTEM',
        type: isRestock ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
      },
    });

    return {
      previousStock,
      previousReserved,
      adjustedStock: targetStock,
      delta,
      targetName,
      variantName,
      targetSku,
      threshold: resolvedThreshold,
      logId: log.id,
      isRestock,
    };
  }, {
    maxWait: 20000,
    timeout: 30000,
  });

  // Evaluate threshold alerts
  await checkAndTriggerThresholdAlert({
    productId,
    variantId: variantId || null,
    stockQuantity: result.adjustedStock,
    threshold: result.threshold,
    productName: result.targetName,
    variantName: result.variantName,
    sku: result.targetSku,
  });

  // Trigger Restock Notification Workflow if available stock became > 0 from previously 0 or out-of-stock
  const prevAvailable = Math.max(0, result.previousStock - result.previousReserved);
  const newAvailable = Math.max(0, result.adjustedStock - result.previousReserved);

  if (result.isRestock && prevAvailable === 0 && newAvailable > 0) {
    // Keep notification dispatch strictly separate from the inventory transaction
    setImmediate(() => {
      triggerRestockNotifications({
        productId,
        variantId: variantId || null,
        previousStock: result.previousStock,
        newStock: result.adjustedStock,
        productName: result.targetName,
        variantName: result.variantName,
        sku: result.targetSku,
        adminEmail: admin?.email || 'admin@amoga.com',
      }).catch((err) => console.error('[RESTOCK NOTIFICATION WORKFLOW ERROR]:', err));
    });
  }

  if (admin) {
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'STOCK_ADJUST',
      entityType: variantId ? 'ProductVariant' : 'Product',
      entityId: variantId || productId,
      details: {
        product: result.targetName,
        from: result.previousStock,
        to: result.adjustedStock,
        delta: result.delta,
        reason: reason.trim(),
      },
    });
  }

  return result;
}

/**
 * Handle Order Cancellation & Return Inventory Policy
 * Unpaid orders release reservations.
 * Confirmed paid orders only physically restock if restockPhysical is explicitly requested.
 */
export async function handleOrderCancellation({ tx, orderId, orderReference, admin, reason, restockPhysical = false }) {
  const client = tx || prisma;

  const whereClause = orderId ? { id: orderId } : (orderReference ? { orderReference } : null);
  if (!whereClause) {
    const err = new Error('Order identifier (orderId or orderReference) required for cancellation');
    err.status = 400;
    throw err;
  }

  const order = await client.order.findUnique({
    where: whereClause,
    include: { items: true },
  });

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  // 1. Release active reservations if order was not yet committed
  const releaseRes = await releaseReservation({
    tx: client,
    orderId: order.id,
    orderReference: order.orderReference,
    reason: reason || 'Order cancelled before payment confirmation',
  });

  // 2. If order was already fulfilled / dispatched and restockPhysical is true, restock physical inventory
  let restockedItemsCount = 0;
  if (restockPhysical) {
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await client.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant) {
          const prev = variant.stockQuantity;
          const updated = prev + item.quantity;
          await client.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: updated, inStock: true },
          });
          await client.inventoryLog.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              previousStock: prev,
              adjustedStock: updated,
              delta: item.quantity,
              reason: `Physical return / cancellation restock for Order ${order.orderReference}: ${reason || 'Approved customer return'}`,
              adminEmail: admin?.email || 'admin@amoga.com',
              adminId: admin?.id || null,
              orderId: order.id,
              actor: admin ? `ADMIN: ${admin.email}` : 'SYSTEM',
              type: 'RETURN_RESTOCK',
            },
          });
          restockedItemsCount++;
        }
      } else if (item.productId) {
        const prod = await client.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const prev = prod.stockQuantity;
          const updated = prev + item.quantity;
          await client.product.update({
            where: { id: item.productId },
            data: { stockQuantity: updated, inStock: true },
          });
          await client.inventoryLog.create({
            data: {
              productId: item.productId,
              variantId: null,
              previousStock: prev,
              adjustedStock: updated,
              delta: item.quantity,
              reason: `Physical return / cancellation restock for Order ${order.orderReference}: ${reason || 'Approved customer return'}`,
              adminEmail: admin?.email || 'admin@amoga.com',
              adminId: admin?.id || null,
              orderId: order.id,
              actor: admin ? `ADMIN: ${admin.email}` : 'SYSTEM',
              type: 'RETURN_RESTOCK',
            },
          });
          restockedItemsCount++;
        }
      }
    }
  }

  return {
    success: true,
    releasedReservations: releaseRes.releasedCount,
    restockedPhysical: restockPhysical,
    restockedItemsCount,
  };
}
