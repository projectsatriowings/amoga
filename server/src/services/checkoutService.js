import { prisma } from '../config/prisma.js';
import {
  generateOrderReference,
  generateGuestAccessToken,
  hashGuestAccessToken,
  verifyGuestAccessToken,
} from '../utils/security.js';

/**
 * Authoritatively resolves and validates cart items against the PostgreSQL database
 * Computes monetary calculations using integer paise (1 INR = 100 paise)
 * to completely eliminate floating-point arithmetic errors.
 */
export async function resolveAndValidateCart(cartItems = []) {
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

  for (const item of cartItems) {
    const qty = parseInt(item.quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`Invalid quantity for product ${item.productId}. Quantity must be a positive integer.`);
      continue;
    }
    totalCount += qty;

    // Resolve product by internal DB id or sourceId
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: item.productId }, { sourceId: item.productId }],
        isActive: true,
      },
      include: {
        collection: true,
        variants: true,
      },
    });

    if (!product) {
      errors.push(`Product identifier "${item.productId}" was not found in the catalogue.`);
      continue;
    }

    // Availability Safeguard: Product inStock flag
    if (!product.inStock) {
      errors.push(`"${product.name}" is currently unavailable or out of stock.`);
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

      if (!selectedVariant.inStock) {
        errors.push(`Variant "${selectedVariant.name}" of "${product.name}" is currently out of stock.`);
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

  return {
    isValid: errors.length === 0 && lines.length > 0,
    errors,
    lines,
    subtotal: subtotalRupees,
    subtotalPaise,
    totalCount,
    payableCount,
  };
}

/**
 * Creates a persistent order with database transaction and strict idempotency guarantees
 */
export async function createOrder({ items, customer, idempotencyKey = null, isDemo = false }) {
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
        isDuplicate: true,
        orderReference: existingOrder.orderReference,
        status: existingOrder.status,
        currency: existingOrder.currency,
        totals: {
          subtotal: Number(existingOrder.subtotal.toFixed(2)),
          shippingAmount: Number(existingOrder.shippingAmount.toFixed(2)),
          taxAmount: Number(existingOrder.taxAmount.toFixed(2)),
          totalAmount: Number(existingOrder.totalAmount.toFixed(2)),
        },
        createdAt: existingOrder.createdAt,
      };
    }
  }

  // 2. Authoritative server-side cart resolution with integer paise
  const validation = await resolveAndValidateCart(items);
  if (!validation.isValid) {
    const error = new Error('Checkout validation failed');
    error.status = 422;
    error.details = validation.errors;
    throw error;
  }

  // 3. Generate Cryptographically Secure Reference & Guest Access Token
  const orderReference = generateOrderReference();
  const guestAccessToken = generateGuestAccessToken();
  const guestAccessTokenHash = hashGuestAccessToken(guestAccessToken);

  // Authoritative financial totals in exact integer paise
  const subtotalRupees = validation.subtotal;
  const shippingAmountRupees = 0.0;
  const taxAmountRupees = 0.0;
  const discountAmountRupees = 0.0;
  const totalAmountRupees = subtotalRupees;

  // 4. Atomic database transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
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
        customerName: customer.fullName.trim(),
        customerEmail: customer.email.trim().toLowerCase(),
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

    return order;
  });

  return {
    isDuplicate: false,
    orderReference: createdOrder.orderReference,
    guestAccessToken, // Returned to client once so guest can view their confirmation
    status: createdOrder.status,
    currency: createdOrder.currency,
    totals: {
      subtotal: Number(createdOrder.subtotal.toFixed(2)),
      shippingAmount: Number(createdOrder.shippingAmount.toFixed(2)),
      taxAmount: Number(createdOrder.taxAmount.toFixed(2)),
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
