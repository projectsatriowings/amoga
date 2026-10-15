import { prisma } from '../config/prisma.js';
import {
  generateOrderReference,
  generateGuestAccessToken,
  hashGuestAccessToken,
  verifyGuestAccessToken,
} from '../utils/security.js';
import { reserveStock, releaseExpiredReservations } from './inventoryService.js';

let cachedStoreSettings = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL_MS = 60000;

export async function getCachedStoreSettings() {
  const now = Date.now();
  if (cachedStoreSettings && now - lastSettingsFetch < SETTINGS_CACHE_TTL_MS) {
    return cachedStoreSettings;
  }
  try {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    if (settings) {
      cachedStoreSettings = settings;
      lastSettingsFetch = now;
    }
    return settings || cachedStoreSettings;
  } catch (err) {
    console.warn('[CHECKOUT] Store settings read error:', err.message);
    return cachedStoreSettings || null;
  }
}

/**
 * Authoritatively resolves and validates cart items against the PostgreSQL database
 * Computes monetary calculations using integer paise (1 INR = 100 paise)
 * to completely eliminate floating-point arithmetic errors.
 */
export async function resolveAndValidateCart(cartItems = []) {
  // Proactively sweep expired reservations asynchronously in the background so it never blocks customer checkout
  releaseExpiredReservations().catch(() => {});

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      isValid: false,
      errors: ['Shopping cart is empty. Please add items to proceed.'],
      lines: [],
      subtotal: 0,
      totalCount: 0,
      payableCount: 0,
      subtotalPaise: 0,
    };
  }

  const errors = [];
  const lines = [];
  let subtotalPaise = 0;
  let totalCount = 0;
  let payableCount = 0;

  // Extract all product IDs and batch query them in a single database round trip
  const productIds = cartItems
    .map((item) => item.productId)
    .filter(Boolean)
    .map(String);

  const matchedProducts = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: productIds } },
        { sourceId: { in: productIds } },
      ],
      isActive: true,
    },
    include: {
      collection: true,
      variants: true,
    },
  });

  const productMap = new Map();
  for (const prod of matchedProducts) {
    productMap.set(prod.id, prod);
    if (prod.sourceId) productMap.set(prod.sourceId, prod);
  }

  for (const item of cartItems) {
    const qty = parseInt(item.quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`Invalid quantity for product ${item.productId}. Quantity must be a positive integer.`);
      continue;
    }
    totalCount += qty;

    // Resolve product from preloaded map or fallback to DB
    let product = productMap.get(item.productId);
    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          OR: [{ id: item.productId }, { sourceId: item.productId }],
          isActive: true,
        },
        include: {
          collection: true,
          variants: true,
        },
      });
    }

    if (!product) {
      errors.push(`Product identifier "${item.productId}" was not found in the catalogue.`);
      continue;
    }

    // Availability & Live Stock Safeguard
    const onHand = Math.max(0, product.stockQuantity || 0);
    const reserved = Math.max(0, product.reservedQuantity || 0);
    const availableStock = Math.max(0, onHand - reserved);

    if (!product.inStock || availableStock <= 0) {
      errors.push(`"${product.name}" is currently unavailable or out of stock.`);
      continue;
    }

    if (qty > availableStock && !item.variantId) {
      errors.push(`Only ${availableStock} unit(s) available for "${product.name}". Requested: ${qty}.`);
      continue;
    }

    // Pricing Safeguard: Reject unpriced items
    if (product.price === null || product.price === undefined) {
      errors.push(`"${product.name}" has bespoke pricing pending client approval and cannot be purchased.`);
      continue;
    }

    const basePriceNum = parseFloat(product.price.toString());
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      errors.push(`"${product.name}" does not have a valid purchasable price.`);
      continue;
    }

    // Precise Integer Paise Calculation (1 INR = 100 paise) via Prisma Decimal
    let unitPricePaise = product.price.mul
      ? Number(product.price.mul(100).toFixed(0))
      : Math.round(basePriceNum * 100);

    // Resolve variant if specified
    let selectedVariant = null;

    if (item.variantId) {
      selectedVariant = product.variants.find(
        (v) => v.id === item.variantId || v.sourceId === item.variantId
      );

      if (!selectedVariant) {
        errors.push(`Selected variant "${item.variantId}" is invalid for product "${product.name}".`);
        continue;
      }

      const variantOnHand = Math.max(0, selectedVariant.stockQuantity || 0);
      const variantReserved = Math.max(0, selectedVariant.reservedQuantity || 0);
      const variantAvailable = Math.max(0, variantOnHand - variantReserved);

      if (!selectedVariant.inStock || variantAvailable <= 0) {
        errors.push(`Variant "${selectedVariant.name}" of "${product.name}" is currently out of stock.`);
        continue;
      }

      if (qty > variantAvailable) {
        errors.push(`Only ${variantAvailable} unit(s) available for "${product.name} (${selectedVariant.name})". Requested: ${qty}.`);
        continue;
      }

      if (selectedVariant.price !== null && selectedVariant.price !== undefined) {
        const variantPriceNum = parseFloat(selectedVariant.price.toString());
        if (!isNaN(variantPriceNum) && variantPriceNum > 0) {
          unitPricePaise = selectedVariant.price.mul
            ? Number(selectedVariant.price.mul(100).toFixed(0))
            : Math.round(variantPriceNum * 100);
        }
      }
    }

    // Multiply integer paise by quantity: guarantees 0 binary rounding drift
    const lineTotalPaise = unitPricePaise * qty;
    subtotalPaise += lineTotalPaise;
    payableCount += qty;

    const unitPriceRupees = Number((unitPricePaise / 100).toFixed(2));
    const lineTotalRupees = Number((lineTotalPaise / 100).toFixed(2));

    lines.push({
      productId: product.id,
      sourceId: product.sourceId,
      productName: product.name,
      collectionId: product.collectionId,
      collectionName: product.collection.name,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      image: product.image,
      unitPrice: unitPriceRupees,
      unitPricePaise,
      quantity: qty,
      lineTotal: lineTotalRupees,
      lineTotalPaise,
    });
  }

  const subtotalRupees = Number((subtotalPaise / 100).toFixed(2));

  let shippingAmount = 0;
  let isComplimentary = true;
  let freeShippingThreshold = 2000;
  let shippingStandardRate = 0;
  let taxPercentage = 5;

  try {
    const storeSettings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    if (storeSettings) {
      freeShippingThreshold = Number(storeSettings.freeShippingThreshold || 2000);
      shippingStandardRate = Number(storeSettings.shippingStandardRate || 0);
      taxPercentage = Number(storeSettings.taxPercentage || 5);
      if (subtotalRupees < freeShippingThreshold) {
        shippingAmount = shippingStandardRate;
        isComplimentary = shippingStandardRate === 0;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return {
    isValid: errors.length === 0 && lines.length > 0,
    errors,
    lines,
    subtotal: subtotalRupees,
    subtotalPaise,
    shipping: {
      amount: shippingAmount,
      isComplimentary,
      freeShippingThreshold,
      standardRate: shippingStandardRate,
    },
    taxPercentage,
    totalCount,
    payableCount,
  };
}

export async function createOrder({
  items,
  customer,
  idempotencyKey = null,
  couponCode = null,
  isDemo = false,
  customerId = null,
  paymentMethod = 'online',
}) {
  // 1. Strict Idempotency Validation
  if (idempotencyKey) {
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existingOrder) {
      // Helper to verify payload equality
      const norm = (s) => (s || '').trim().toLowerCase();
      const normPhone = (s) => (s || '').replace(/[\s-]/g, '');

      const customerMatches =
        norm(customer.fullName) === norm(existingOrder.customerName) &&
        norm(customer.email) === norm(existingOrder.customerEmail) &&
        normPhone(customer.phone) === normPhone(existingOrder.customerPhone) &&
        norm(customer.pincode) === norm(existingOrder.pincode);

      let itemsMatch = Array.isArray(items) && items.length === existingOrder.items.length;
      if (itemsMatch) {
        const pool = [...existingOrder.items];
        for (const reqItem of items) {
          const reqPid = String(reqItem.productId || '');
          const reqVid = reqItem.variantId ? String(reqItem.variantId) : null;
          const reqQty = Number(reqItem.quantity || 0);

          const idx = pool.findIndex((p) => {
            const pidMatches = p.productId === reqPid || (p.product && p.product.sourceId === reqPid);
            const vidMatches = (p.variantId || null) === reqVid;
            const qtyMatches = p.quantity === reqQty;
            return pidMatches && vidMatches && qtyMatches;
          });

          if (idx === -1) {
            itemsMatch = false;
            break;
          }
          pool.splice(idx, 1);
        }
      }

      // If payload differs -> HTTP 409 Conflict (reusing key with different request)
      if (!customerMatches || !itemsMatch) {
        const conflictError = new Error(
          `Idempotency key "${idempotencyKey}" has already been used for a different order payload.`
        );
        conflictError.status = 409;
        throw conflictError;
      }

      // If payload is identical -> return existing order result idempotently (HTTP 200)
      return {
        id: existingOrder.id,
        orderId: existingOrder.id,
        isDuplicate: true,
        orderReference: existingOrder.orderReference,
        status: existingOrder.status,
        currency: existingOrder.currency,
        totals: {
          subtotal: Number(existingOrder.subtotal.toFixed(2)),
          shippingAmount: Number(existingOrder.shippingAmount.toFixed(2)),
          taxAmount: Number(existingOrder.taxAmount.toFixed(2)),
          discountAmount: Number(existingOrder.discountAmount.toFixed(2)),
          totalAmount: Number(existingOrder.totalAmount.toFixed(2)),
        },
        createdAt: existingOrder.createdAt,
      };
    }
  }

  // 2. Concurrently fetch cart validation, coupon, store settings, and customer record
  const customerEmailClean = (customer?.email || '').trim().toLowerCase();
  const cleanCode = (couponCode && typeof couponCode === 'string' && couponCode.trim())
    ? couponCode.trim().toUpperCase()
    : null;

  const [validation, coupon, storeSettings, existingCust] = await Promise.all([
    resolveAndValidateCart(items),
    cleanCode ? prisma.coupon.findUnique({ where: { code: cleanCode } }) : Promise.resolve(null),
    getCachedStoreSettings(),
    (!customerId && customerEmailClean)
      ? prisma.customer.findUnique({ where: { email: customerEmailClean } }).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!validation.isValid) {
    const error = new Error('Checkout validation failed');
    error.status = 422;
    error.details = validation.errors;
    throw error;
  }

  // 3. Authoritative Coupon Validation & Discount Calculation
  let appliedCoupon = null;
  let discountPaise = 0;

  if (cleanCode) {
    if (!coupon || !coupon.isActive) {
      const err = new Error(`Promotional coupon "${cleanCode}" is invalid or inactive`);
      err.status = 422;
      err.details = [err.message];
      throw err;
    }

    const now = new Date();
    if (coupon.startsAt && now < new Date(coupon.startsAt)) {
      const err = new Error(`Promotional coupon "${cleanCode}" is not yet active`);
      err.status = 422;
      err.details = [err.message];
      throw err;
    }

    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
      const err = new Error(`Promotional coupon "${cleanCode}" has expired`);
      err.status = 422;
      err.details = [err.message];
      throw err;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      const err = new Error(`Promotional coupon "${cleanCode}" has reached its maximum global usage cap`);
      err.status = 422;
      err.details = [err.message];
      throw err;
    }

    if (coupon.minOrderAmount) {
      const minOrderPaise = Math.round(Number(coupon.minOrderAmount) * 100);
      if (validation.subtotalPaise < minOrderPaise) {
        const err = new Error(
          `Minimum order subtotal of ₹${Number(coupon.minOrderAmount).toLocaleString()} required for coupon "${cleanCode}"`
        );
        err.status = 422;
        err.details = [err.message];
        throw err;
      }
    }

    // Applicable collections check
    let eligibleSubtotalPaise = validation.subtotalPaise;
    let applicableCollections = [];
    if (coupon.applicableCollections) {
      try {
        applicableCollections = Array.isArray(coupon.applicableCollections)
          ? coupon.applicableCollections
          : JSON.parse(coupon.applicableCollections);
      } catch {
        applicableCollections = [];
      }
    }

    if (applicableCollections.length > 0) {
      const eligibleLines = validation.lines.filter((l) =>
        applicableCollections.includes(l.collectionId)
      );
      if (eligibleLines.length === 0) {
        const err = new Error(
          `Coupon "${cleanCode}" is exclusively valid for items in: ${applicableCollections.join(', ')}`
        );
        err.status = 422;
        err.details = [err.message];
        throw err;
      }
      eligibleSubtotalPaise = eligibleLines.reduce((acc, l) => acc + l.lineTotalPaise, 0);
    }

    if (coupon.discountType === 'PERCENTAGE') {
      discountPaise = Math.floor((eligibleSubtotalPaise * Number(coupon.discountValue)) / 100);
      if (coupon.maxDiscountAmount) {
        const maxPaise = Math.round(Number(coupon.maxDiscountAmount) * 100);
        if (discountPaise > maxPaise) discountPaise = maxPaise;
      }
    } else {
      discountPaise = Math.round(Number(coupon.discountValue) * 100);
    }

    // Cap at order subtotal paise so total is never negative
    discountPaise = Math.min(validation.subtotalPaise, Math.max(0, discountPaise));
    appliedCoupon = coupon;
  }

  // 4. Generate Cryptographically Secure Reference & Guest Access Token
  const orderReference = generateOrderReference();
  const guestAccessToken = generateGuestAccessToken();
  const guestAccessTokenHash = hashGuestAccessToken(guestAccessToken);

  // Authoritative financial totals in exact integer paise incorporating store shipping & tax settings
  let shippingPaise = 0;
  let taxPercentage = 5.0;

  if (storeSettings) {
    taxPercentage = Number(storeSettings.taxPercentage || 5);
    const freeThresholdPaise = Math.round(Number(storeSettings.freeShippingThreshold || 2000) * 100);
    const standardRatePaise = Math.round(Number(storeSettings.shippingStandardRate || 0) * 100);

    // If discounted subtotal is below free shipping threshold, charge standard shipping
    const netSubtotalPaise = Math.max(0, validation.subtotalPaise - discountPaise);
    if (netSubtotalPaise < freeThresholdPaise) {
      shippingPaise = standardRatePaise;
    }
  }

  const subtotalRupees = validation.subtotal;
  const shippingAmountRupees = Number((shippingPaise / 100).toFixed(2));
  const discountAmountRupees = Number((discountPaise / 100).toFixed(2));
  const totalAmountPaise = Math.max(0, validation.subtotalPaise - discountPaise + shippingPaise);
  const totalAmountRupees = Number((totalAmountPaise / 100).toFixed(2));

  // Taxes are inclusive in prices (GST on luxury craft goods), recorded for accounting compliance
  const taxPaise = Math.round((validation.subtotalPaise * taxPercentage) / (100 + taxPercentage));
  const taxAmountRupees = Number((taxPaise / 100).toFixed(2));

  // Resolve customer ID if registered
  const resolvedCustomerId = customerId || existingCust?.id || null;

  // 5. Atomic database transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Atomically increment coupon usage count if applied
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const order = await tx.order.create({
      data: {
        orderReference,
        idempotencyKey: idempotencyKey || null,
        guestAccessTokenHash,
        status: 'PENDING_CONFIRMATION',
        currency: 'INR',
        subtotal: subtotalRupees,
        shippingAmount: shippingAmountRupees,
        taxAmount: taxAmountRupees,
        discountAmount: discountAmountRupees,
        totalAmount: totalAmountRupees,
        customerId: resolvedCustomerId,
        customerName: customer.fullName.trim(),
        customerEmail: customerEmailClean,
        customerPhone: customer.phone.trim(),
        addressLine1: customer.addressLine1.trim(),
        addressLine2: customer.addressLine2 ? customer.addressLine2.trim() : null,
        city: customer.city.trim(),
        state: customer.state.trim(),
        pincode: customer.pincode.trim(),
        deliveryInstructions: customer.instructions ? customer.instructions.trim() : null,
        isDemo: Boolean(isDemo),
        items: {
          create: validation.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            collectionId: line.collectionId,
            productName: line.productName,
            variantName: line.variantName,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
            image: line.image,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const isCod = paymentMethod === 'cod';

    // Create initial order tracking event
    await tx.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        status: 'PENDING_CONFIRMATION',
        title: isCod ? 'Order Placed (Cash on Delivery)' : 'Order Placed',
        description: isCod
          ? 'Cash on Delivery order placed. Payment of ₹' + totalAmountRupees.toLocaleString('en-IN') + ' will be collected upon delivery by courier.'
          : 'Order created and awaiting payment authorization at Amoga Atelier.',
        actor: isCod ? 'Customer (COD)' : 'System',
      },
    });

    if (isCod) {
      // Create explicit COD payment record with status PENDING
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentReference: `AMOGA-COD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          provider: 'cod',
          amountPaise: totalAmountPaise,
          amount: totalAmountRupees,
          currency: 'INR',
          status: 'PENDING',
          metadata: {
            method: 'CASH_ON_DELIVERY',
            customerName: customer.fullName.trim(),
            customerPhone: customer.phone.trim(),
          },
        },
      });
    }

    // Concurrency-Safe Atomic Stock Reservation
    await reserveStock({
      tx,
      orderId: order.id,
      orderReference: order.orderReference,
      items: validation.lines,
    });

    return order;
  }, {
    maxWait: 20000,
    timeout: 30000,
  });

  return {
    id: createdOrder.id,
    orderId: createdOrder.id,
    isDuplicate: false,
    orderReference: createdOrder.orderReference,
    guestAccessToken, // Returned to client once so guest can view their confirmation
    status: createdOrder.status,
    paymentStatus: createdOrder.paymentStatus,
    paymentMethod,
    currency: createdOrder.currency,
    appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
    totals: {
      subtotal: Number(createdOrder.subtotal.toFixed(2)),
      shippingAmount: Number(createdOrder.shippingAmount.toFixed(2)),
      taxAmount: Number(createdOrder.taxAmount.toFixed(2)),
      discountAmount: Number(createdOrder.discountAmount.toFixed(2)),
      totalAmount: Number(createdOrder.totalAmount.toFixed(2)),
    },
    customer: {
      fullName: createdOrder.customerName,
      email: createdOrder.customerEmail,
      phone: createdOrder.customerPhone,
      addressLine1: createdOrder.addressLine1,
      addressLine2: createdOrder.addressLine2,
      city: createdOrder.city,
      state: createdOrder.state,
      pincode: createdOrder.pincode,
      instructions: createdOrder.deliveryInstructions,
    },
    items: createdOrder.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      collectionId: i.collectionId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice.toFixed(2)),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal.toFixed(2)),
      image: i.image,
    })),
    createdAt: createdOrder.createdAt,
  };
}

/**
 * Securely retrieves an order by reference, verifying guest access token
 */
export async function getOrderByReference(orderReference, guestAccessToken) {
  const order = await prisma.order.findUnique({
    where: { orderReference },
    include: {
      items: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    return { notFound: true };
  }

  // Verify access control
  const isAuthorized = verifyGuestAccessToken(guestAccessToken, order.guestAccessTokenHash);
  if (!isAuthorized) {
    return { unauthorized: true };
  }

  return {
    orderReference: order.orderReference,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    totals: {
      subtotal: Number(order.subtotal.toFixed(2)),
      shippingAmount: Number(order.shippingAmount.toFixed(2)),
      taxAmount: Number(order.taxAmount.toFixed(2)),
      totalAmount: Number(order.totalAmount.toFixed(2)),
    },
    payments: order.payments.map((p) => ({
      paymentReference: p.paymentReference,
      provider: p.provider,
      status: p.status,
      amount: Number(p.amount.toFixed(2)),
      currency: p.currency,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
    })),
    customer: {
      fullName: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      instructions: order.deliveryInstructions,
    },
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      collectionId: i.collectionId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice.toFixed(2)),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal.toFixed(2)),
      image: i.image,
    })),
    createdAt: order.createdAt,
  };
}
