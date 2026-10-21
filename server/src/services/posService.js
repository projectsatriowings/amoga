import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { calculateOrderTaxes, calculateItemTax, resolveGstStateCode } from './taxService.js';
import { checkAndTriggerThresholdAlert } from './notificationService.js';

/**
 * AMOGA E-COMMERCE — STALL BILLING & POS SERVICE
 * 
 * Provides complete, concurrency-safe, authoritative stall billing:
 * - Atomic sequential bill numbering under high concurrency
 * - GST-inclusive pricing with accurate place-of-supply decomposition
 * - Real-time stock verification & atomic inventory deductions
 * - Safe cancellation & refund flows with compensating inventory logs
 * - Multi-method payments (Cash, UPI, Card, Split) and change calculation
 * - Unguessable token receipts for printing and WhatsApp dispatch
 */

/**
 * Atomically generates the next sequential POS bill number
 * Format: e.g. "AMOGA-POS-2026/0001" or customized from pos_settings
 */
export async function getNextPosBillNumber(customPrefix = null, client = prisma) {
  const currentYear = new Date().getFullYear();
  let prefix = customPrefix;

  if (!prefix) {
    const settings = await client.posSetting.findUnique({ where: { id: 'default' } });
    prefix = settings?.posPrefix || `AMOGA-POS-${currentYear}/`;
  }

  // Atomically increment sequence counter
  const seq = await client.posSequence.upsert({
    where: { prefix },
    update: {
      lastNumber: { increment: 1 },
    },
    create: {
      prefix,
      lastNumber: 1,
    },
  });

  return `${prefix}${String(seq.lastNumber).padStart(4, '0')}`;
}

/**
 * Retrieves active POS settings or default values
 */
export async function getPosSettings(client = prisma) {
  let settings = await client.posSetting.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await client.posSetting.create({
      data: {
        id: 'default',
        enableBarcodeScanner: true,
        enableThermalPrint: true,
        receiptPrinterWidth: '80mm',
        enableWhatsAppReceipt: true,
        whatsAppChannel: 'MANUAL',
        maxDiscountPercentWithoutApproval: 15.0,
        requireCustomerPhone: false,
        posPrefix: `AMOGA-POS-${new Date().getFullYear()}/`,
      },
    });
  }
  return settings;
}

/**
 * Updates POS settings and records audit trail
 */
export async function updatePosSettings(data, staffEmail, staffId = null, client = prisma) {
  const current = await getPosSettings(client);

  const updated = await client.posSetting.update({
    where: { id: 'default' },
    data: {
      defaultStallId: data.defaultStallId !== undefined ? data.defaultStallId : current.defaultStallId,
      enableBarcodeScanner: data.enableBarcodeScanner !== undefined ? Boolean(data.enableBarcodeScanner) : current.enableBarcodeScanner,
      enableThermalPrint: data.enableThermalPrint !== undefined ? Boolean(data.enableThermalPrint) : current.enableThermalPrint,
      receiptPrinterWidth: data.receiptPrinterWidth || current.receiptPrinterWidth,
      enableWhatsAppReceipt: data.enableWhatsAppReceipt !== undefined ? Boolean(data.enableWhatsAppReceipt) : current.enableWhatsAppReceipt,
      whatsAppChannel: data.whatsAppChannel || current.whatsAppChannel,
      whatsAppPhoneNumberId: data.whatsAppPhoneNumberId !== undefined ? data.whatsAppPhoneNumberId : current.whatsAppPhoneNumberId,
      whatsAppTemplateName: data.whatsAppTemplateName || current.whatsAppTemplateName,
      maxDiscountPercentWithoutApproval: data.maxDiscountPercentWithoutApproval !== undefined ? Number(data.maxDiscountPercentWithoutApproval) : current.maxDiscountPercentWithoutApproval,
      requireCustomerPhone: data.requireCustomerPhone !== undefined ? Boolean(data.requireCustomerPhone) : current.requireCustomerPhone,
      posPrefix: data.posPrefix || current.posPrefix,
    },
  });

  await client.auditLog.create({
    data: {
      adminEmail: staffEmail || 'system',
      adminId: staffId || null,
      action: 'POS_SETTINGS_UPDATE',
      entityType: 'PosSetting',
      entityId: 'default',
      status: 'SUCCESS',
      details: { previous: current, updated },
    },
  });

  return updated;
}

/**
 * Searches product catalogue for quick POS billing:
 * By product name, SKU, variant SKU, sourceId, or barcode
 */
export async function searchPosCatalog({
  query = '',
  collectionId = null,
  inStockOnly = false,
  stockLocationId = null,
  stallEventId = null,
  client = prisma,
}) {
  const clean = String(query).trim();

  const where = {
    isActive: true,
  };

  if (collectionId && collectionId !== 'all') {
    where.collectionId = collectionId;
  }

  if (clean) {
    where.OR = [
      { name: { contains: clean, mode: 'insensitive' } },
      { sku: { contains: clean, mode: 'insensitive' } },
      { sourceId: { contains: clean, mode: 'insensitive' } },
      { category: { contains: clean, mode: 'insensitive' } },
      {
        variants: {
          some: {
            OR: [
              { name: { contains: clean, mode: 'insensitive' } },
              { sku: { contains: clean, mode: 'insensitive' } },
              { sourceId: { contains: clean, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  // Resolve Stock Location if provided
  let resolvedLocation = null;
  const locationInventoriesMap = new Map();

  if (stockLocationId || stallEventId) {
    if (stockLocationId && stockLocationId !== 'all') {
      resolvedLocation = await client.stockLocation.findUnique({
        where: { id: stockLocationId },
        select: { id: true, code: true, name: true, type: true },
      });
    } else if (stallEventId && stallEventId !== 'all') {
      resolvedLocation = await client.stockLocation.findFirst({
        where: { stallEventId },
        select: { id: true, code: true, name: true, type: true },
      });
    }

    if (resolvedLocation) {
      const locInvs = await client.locationInventory.findMany({
        where: { locationId: resolvedLocation.id },
      });
      for (const li of locInvs) {
        const key = `${li.productId}_${li.variantId || 'base'}`;
        locationInventoriesMap.set(key, li);
      }
    }
  }

  const products = await client.product.findMany({
    where,
    take: 60,
    orderBy: { name: 'asc' },
    include: {
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stockQuantity: true,
          reservedQuantity: true,
          inStock: true,
          hsnCode: true,
          gstRate: true,
          isTaxInclusive: true,
          attributes: true,
        },
      },
      collection: {
        select: {
          id: true,
          name: true,
          themeConfig: true,
        },
      },
    },
  });

  // Transform with live stock availability calculations (stall-isolated or warehouse)
  let transformed = products.map((p) => {
    let pOnHand = Math.max(0, p.stockQuantity || 0);
    let pReserved = Math.max(0, p.reservedQuantity || 0);
    let pAvailable = Math.max(0, pOnHand - pReserved);
    let hasStallRecord = false;

    if (resolvedLocation) {
      const locInv = locationInventoriesMap.get(`${p.id}_base`);
      if (locInv) {
        pOnHand = Math.max(0, locInv.onHandQuantity);
        pReserved = Math.max(0, locInv.reservedQuantity);
        pAvailable = Math.max(0, pOnHand - pReserved);
        hasStallRecord = true;
      } else {
        pOnHand = 0;
        pReserved = 0;
        pAvailable = 0;
      }
    }

    const variants = (p.variants || []).map((v) => {
      let vOnHand = Math.max(0, v.stockQuantity || 0);
      let vReserved = Math.max(0, v.reservedQuantity || 0);
      let vAvailable = Math.max(0, vOnHand - vReserved);
      let vHasStall = false;

      if (resolvedLocation) {
        const locInv = locationInventoriesMap.get(`${p.id}_${v.id}`);
        if (locInv) {
          vOnHand = Math.max(0, locInv.onHandQuantity);
          vReserved = Math.max(0, locInv.reservedQuantity);
          vAvailable = Math.max(0, vOnHand - vReserved);
          vHasStall = true;
        } else {
          vOnHand = 0;
          vReserved = 0;
          vAvailable = 0;
        }
      }

      return {
        id: v.id,
        name: v.name,
        sku: v.sku || `${p.sku || p.sourceId}-${v.name}`,
        price: v.price !== null ? Number(v.price) : Number(p.price || 0),
        onHandQuantity: vOnHand,
        reservedQuantity: vReserved,
        availableQuantity: vAvailable,
        inStock: vAvailable > 0,
        onlineStockQuantity: v.stockQuantity,
        hsnCode: v.hsnCode || p.hsnCode || '5007',
        gstRate: v.gstRate !== null ? Number(v.gstRate) : Number(p.gstRate || 5),
        isTaxInclusive: v.isTaxInclusive !== null ? Boolean(v.isTaxInclusive) : Boolean(p.isTaxInclusive),
        attributes: v.attributes,
        hasStallAllocation: vHasStall,
      };
    });

    const isAvailable = variants.length > 0
      ? variants.some((v) => v.availableQuantity > 0)
      : pAvailable > 0;

    return {
      id: p.id,
      sourceId: p.sourceId,
      name: p.name,
      sku: p.sku || p.sourceId,
      collectionId: p.collectionId,
      collectionName: p.collection?.name || p.collectionId,
      category: p.category,
      price: p.price !== null ? Number(p.price) : 0,
      image: p.image,
      packSize: p.packSize,
      hsnCode: p.hsnCode || '5007',
      gstRate: p.gstRate !== null ? Number(p.gstRate) : 5,
      isTaxInclusive: p.isTaxInclusive !== null ? Boolean(p.isTaxInclusive) : true,
      onHandQuantity: pOnHand,
      reservedQuantity: pReserved,
      availableQuantity: pAvailable,
      inStock: isAvailable,
      onlineStockQuantity: p.stockQuantity,
      hasStallAllocation: hasStallRecord,
      stockLocation: resolvedLocation || null,
      variants,
    };
  });

  if (inStockOnly) {
    transformed = transformed.filter((p) => p.inStock);
  }

  return transformed;
}

/**
 * Calculates authoritative GST-inclusive preview for a stall cart
 */
export async function calculatePosBillTax({
  items = [],
  stallEventId = null,
  discountAmount = 0,
  client = prisma,
}) {
  const storeSettings = await client.storeSetting.findUnique({ where: { id: 'default' } });
  const sellerStateCode = storeSettings?.sellerStateCode || '33'; // Default Tamil Nadu

  // Destination state is determined by Stall / Event location
  let stallStateCode = sellerStateCode;
  let stallName = null;

  if (stallEventId) {
    const event = await client.stallEvent.findUnique({ where: { id: stallEventId } });
    if (event) {
      stallStateCode = event.stateCode || resolveGstStateCode(event.state || '') || sellerStateCode;
      stallName = event.name;
    }
  }

  // Authoritatively resolve items against database
  let grossSubtotalPaise = 0;
  const lineDetails = [];

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    let resolvedPrice = 0;
    let resolvedHsn = '5007';
    let resolvedGstRate = 5;
    let resolvedIsInclusive = true;
    let productName = item.productName || 'Item';
    let variantName = null;
    let sku = item.sku || null;
    let collectionId = item.collectionId || 'general';

    if (item.variantId) {
      const v = await client.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (v) {
        resolvedPrice = v.price !== null ? Number(v.price) : Number(v.product.price || 0);
        resolvedHsn = v.hsnCode || v.product.hsnCode || '5007';
        resolvedGstRate = v.gstRate !== null ? Number(v.gstRate) : Number(v.product.gstRate || 5);
        resolvedIsInclusive = v.isTaxInclusive !== null ? Boolean(v.isTaxInclusive) : Boolean(v.product.isTaxInclusive);
        productName = v.product.name;
        variantName = v.name;
        sku = v.sku || v.sourceId;
        collectionId = v.product.collectionId;
      }
    } else if (item.productId) {
      const p = await client.product.findUnique({ where: { id: item.productId } });
      if (p) {
        resolvedPrice = p.price !== null ? Number(p.price) : 0;
        resolvedHsn = p.hsnCode || '5007';
        resolvedGstRate = p.gstRate !== null ? Number(p.gstRate) : 5;
        resolvedIsInclusive = p.isTaxInclusive !== null ? Boolean(p.isTaxInclusive) : true;
        productName = p.name;
        sku = p.sku || p.sourceId;
        collectionId = p.collectionId;
      }
    } else {
      resolvedPrice = Number(item.unitPrice) || 0;
      resolvedGstRate = Number(item.gstRate) || 5;
    }

    const unitPricePaise = Math.round(resolvedPrice * 100);
    const lineTotalPaise = unitPricePaise * qty;
    grossSubtotalPaise += lineTotalPaise;

    lineDetails.push({
      productId: item.productId || null,
      variantId: item.variantId || null,
      productName,
      variantName,
      collectionId,
      sku,
      hsnCode: resolvedHsn,
      gstRate: resolvedGstRate,
      isTaxInclusive: resolvedIsInclusive,
      unitPrice: Number((unitPricePaise / 100).toFixed(2)),
      quantity: qty,
      lineTotal: Number((lineTotalPaise / 100).toFixed(2)),
    });
  }

  const grossSubtotalRupees = Number((grossSubtotalPaise / 100).toFixed(2));
  const validDiscountRupees = Math.min(grossSubtotalRupees, Math.max(0, Number(discountAmount) || 0));
  const netTotalRupees = Number((grossSubtotalRupees - validDiscountRupees).toFixed(2));

  // Deconstruct GST using authoritative taxService
  const taxResult = calculateOrderTaxes({
    items: lineDetails,
    sellerSettings: storeSettings || {},
    discountRupees: validDiscountRupees,
    sellerStateCode,
    buyerStateOrPincode: stallStateCode,
  });

  return {
    stallName,
    sellerStateCode,
    stallStateCode,
    isInterState: taxResult.isInterState,
    grossSubtotal: grossSubtotalRupees,
    discountAmount: validDiscountRupees,
    totalAmount: netTotalRupees,
    netPayableTotal: netTotalRupees,
    taxableAmount: taxResult.taxableAmount,
    taxableSubtotal: taxResult.taxableAmount,
    cgstAmount: taxResult.cgstAmount,
    sgstAmount: taxResult.sgstAmount,
    igstAmount: taxResult.igstAmount,
    totalTaxAmount: taxResult.totalTax,
    totalGstAmount: taxResult.totalTax,
    items: taxResult.lineTaxes.map((lt, idx) => ({
      ...lineDetails[idx],
      taxableAmount: lt.taxableAmount,
      cgstAmount: lt.cgstAmount,
      sgstAmount: lt.sgstAmount,
      igstAmount: lt.igstAmount,
      totalTax: lt.totalTax,
    })),
  };
}

/**
 * Finalizes a Point of Sale Bill atomically inside a database transaction:
 * - Checks idempotency
 * - Checks live stock availability and rejects overselling
 * - Generates consecutive, unforgeable bill number
 * - Atomically decrements on-hand inventory
 * - Creates immutable PosSale and PosSaleItem snapshots
 * - Logs POS_SALE audit and inventory movements
 * - Generates secure unguessable public receipt token
 */
export async function finalizePosSale({
  staffId = null,
  staffEmail,
  staffName = null,
  staffRole = null,
  stallEventId = null,
  stockLocationId = null,
  items = [],
  customerName = null,
  customerPhone = null,
  customerEmail = null,
  customerGstin = null,
  paymentMethod = 'CASH',
  paymentReference = null,
  amountPaid = 0,
  discountAmount = 0,
  overallDiscountType = 'AMOUNT',
  overallDiscountValue = 0,
  discountReason = null,
  discountApprovedBy = null,
  notes = null,
  idempotencyKey = null,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Cannot finalize bill: Cart contains no items.');
    err.status = 400;
    throw err;
  }

  // Idempotency check: prevent duplicate billing on network retry
  if (idempotencyKey) {
    const existing = await prisma.posSale.findUnique({
      where: { idempotencyKey },
      include: {
        items: true,
        stallEvent: true,
        stockLocation: true,
        payments: true,
      },
    });
    if (existing) {
      return { sale: existing, isDuplicate: true };
    }
  }

  // Execute entire sale and inventory deduction in an atomic transaction
  return await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Stock Location (Stall-isolated stock)
      let resolvedLocationId = stockLocationId;
      let resolvedLocation = null;

      if (!resolvedLocationId && stallEventId) {
        resolvedLocation = await tx.stockLocation.findFirst({
          where: { stallEventId },
        });
        if (resolvedLocation) resolvedLocationId = resolvedLocation.id;
      } else if (resolvedLocationId) {
        resolvedLocation = await tx.stockLocation.findUnique({
          where: { id: resolvedLocationId },
        });
      }

      if (!resolvedLocationId) {
        const defaultStall = await tx.stockLocation.findFirst({
          where: { type: 'STALL', isActive: true },
        });
        if (defaultStall) {
          resolvedLocationId = defaultStall.id;
          resolvedLocation = defaultStall;
        }
      }

      // Enforce staff stall assignment for non-superadmin users
      if (staffEmail && staffRole && staffRole !== 'SUPER_ADMIN') {
        const emailLower = staffEmail.toLowerCase();
        const allActiveEvents = await tx.stallEvent.findMany({
          where: { status: 'ACTIVE' },
          include: { stockLocation: true },
        });

        const staffAssignedEvents = allActiveEvents.filter((ev) => {
          const list = Array.isArray(ev.assignedStaffIds)
            ? ev.assignedStaffIds.map((s) => String(s).toLowerCase())
            : [];
          return list.includes(emailLower) || (staffId && list.includes(staffId));
        });

        if (staffAssignedEvents.length > 0) {
          const authorizedLocationIds = staffAssignedEvents
            .map((ev) => ev.stockLocation?.id)
            .filter(Boolean);

          if (resolvedLocationId && !authorizedLocationIds.includes(resolvedLocationId)) {
            const assignedNames = staffAssignedEvents.map((e) => e.name).join(', ');
            const err = new Error(
              `Staff authorization restricted: You are assigned to "${assignedNames}" and cannot bill for this stall location.`
            );
            err.status = 403;
            throw err;
          }
        }
      }

      // 2. Generate sequential bill number
      const billNumber = await getNextPosBillNumber(null, tx);

      // 3. Validate and check stock for all items
      const verifiedLines = [];
      let grossSubtotalPaise = 0;
      let totalPieces = 0;

      for (const item of items) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        totalPieces += qty;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          if (!variant) {
            const err = new Error(`Variant "${item.variantName || item.variantId}" not found in catalogue.`);
            err.status = 404;
            throw err;
          }

          let available = Math.max(0, (variant.stockQuantity || 0) - (variant.reservedQuantity || 0));
          let currentStock = variant.stockQuantity;
          let stallInv = null;

          if (resolvedLocationId) {
            stallInv = await tx.locationInventory.findFirst({
              where: {
                locationId: resolvedLocationId,
                productId: variant.productId,
                variantId: variant.id,
              },
            });
            available = stallInv ? Math.max(0, stallInv.onHandQuantity - stallInv.reservedQuantity) : 0;
            currentStock = stallInv ? stallInv.onHandQuantity : 0;
          }

          if (qty > available) {
            const locName = resolvedLocation?.name || 'Selected Location';
            const err = new Error(
              `Insufficient stall stock for "${variant.product.name} (${variant.name})" at ${locName}. Requested: ${qty}, Available: ${available}.`
            );
            err.status = 422;
            err.details = {
              productId: variant.productId,
              variantId: variant.id,
              productName: variant.product.name,
              variantName: variant.name,
              requested: qty,
              available,
              locationId: resolvedLocationId,
            };
            throw err;
          }

          const price = variant.price !== null ? Number(variant.price) : Number(variant.product.price || 0);
          const unitPricePaise = Math.round(price * 100);
          const lineTotalPaise = unitPricePaise * qty;
          grossSubtotalPaise += lineTotalPaise;

          verifiedLines.push({
            productId: variant.productId,
            variantId: variant.id,
            collectionId: variant.product.collectionId,
            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku || `${variant.product.sku || variant.product.sourceId}-${variant.name}`,
            hsnCode: variant.hsnCode || variant.product.hsnCode || '5007',
            gstRate: variant.gstRate !== null ? Number(variant.gstRate) : Number(variant.product.gstRate || 5),
            isTaxInclusive: variant.isTaxInclusive !== null ? Boolean(variant.isTaxInclusive) : Boolean(variant.product.isTaxInclusive),
            unitPrice: Number((unitPricePaise / 100).toFixed(2)),
            quantity: qty,
            lineTotal: Number((lineTotalPaise / 100).toFixed(2)),
            currentStock,
            stallInv,
            isVariant: true,
          });
        } else if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            const err = new Error(`Product "${item.productName || item.productId}" not found.`);
            err.status = 404;
            throw err;
          }

          let available = Math.max(0, (product.stockQuantity || 0) - (product.reservedQuantity || 0));
          let currentStock = product.stockQuantity;
          let stallInv = null;

          if (resolvedLocationId) {
            stallInv = await tx.locationInventory.findFirst({
              where: {
                locationId: resolvedLocationId,
                productId: product.id,
                variantId: null,
              },
            });
            available = stallInv ? Math.max(0, stallInv.onHandQuantity - stallInv.reservedQuantity) : 0;
            currentStock = stallInv ? stallInv.onHandQuantity : 0;
          }

          if (qty > available) {
            const locName = resolvedLocation?.name || 'Selected Location';
            const err = new Error(
              `Insufficient stall stock for "${product.name}" at ${locName}. Requested: ${qty}, Available: ${available}.`
            );
            err.status = 422;
            err.details = {
              productId: product.id,
              variantId: null,
              productName: product.name,
              requested: qty,
              available,
              locationId: resolvedLocationId,
            };
            throw err;
          }

          const price = product.price !== null ? Number(product.price) : 0;
          const unitPricePaise = Math.round(price * 100);
          const lineTotalPaise = unitPricePaise * qty;
          grossSubtotalPaise += lineTotalPaise;

          verifiedLines.push({
            productId: product.id,
            variantId: null,
            collectionId: product.collectionId,
            productName: product.name,
            variantName: null,
            sku: product.sku || product.sourceId,
            hsnCode: product.hsnCode || '5007',
            gstRate: product.gstRate !== null ? Number(product.gstRate) : 5,
            isTaxInclusive: product.isTaxInclusive !== null ? Boolean(product.isTaxInclusive) : true,
            unitPrice: Number((unitPricePaise / 100).toFixed(2)),
            quantity: qty,
            lineTotal: Number((lineTotalPaise / 100).toFixed(2)),
            currentStock,
            stallInv,
            isVariant: false,
          });
        } else {
          const err = new Error('Each line item must have either a valid productId or variantId.');
          err.status = 400;
          throw err;
        }
      }

    // 3. Financial calculations
    const grossSubtotalRupees = Number((grossSubtotalPaise / 100).toFixed(2));
    let resolvedDiscount = Number(discountAmount) || 0;
    if (resolvedDiscount === 0 && Number(overallDiscountValue) > 0) {
      if (overallDiscountType === 'PERCENT') {
        resolvedDiscount = (grossSubtotalRupees * Number(overallDiscountValue)) / 100;
      } else {
        resolvedDiscount = Number(overallDiscountValue);
      }
    }
    const validDiscountRupees = Math.min(grossSubtotalRupees, Math.max(0, resolvedDiscount));
    const netTotalRupees = Number((grossSubtotalRupees - validDiscountRupees).toFixed(2));

    const receivedAmountRupees = Math.max(0, Number(amountPaid) || netTotalRupees);
    const changeDueRupees = paymentMethod === 'CASH' && receivedAmountRupees > netTotalRupees
      ? Number((receivedAmountRupees - netTotalRupees).toFixed(2))
      : 0.00;

    // 4. Place of supply & GST calculation
    const storeSettings = await tx.storeSetting.findUnique({ where: { id: 'default' } });
    const sellerStateCode = storeSettings?.sellerStateCode || '33';
    let stallStateCode = sellerStateCode;

    if (stallEventId) {
      const event = await tx.stallEvent.findUnique({ where: { id: stallEventId } });
      if (event && event.stateCode) {
        stallStateCode = event.stateCode;
      }
    }

    const taxResult = calculateOrderTaxes({
      items: verifiedLines,
      sellerSettings: storeSettings || {},
      discountRupees: validDiscountRupees,
      sellerStateCode,
      buyerStateOrPincode: stallStateCode,
    });

    // 5. Generate secure, unguessable public receipt token
    const publicReceiptToken = crypto.randomBytes(24).toString('hex');

    // 6. Create PosSale master record
    const posSale = await tx.posSale.create({
      data: {
        billNumber,
        idempotencyKey: idempotencyKey || null,
        publicReceiptToken,
        stallEventId: stallEventId || null,
        stockLocationId: resolvedLocationId || null,
        staffId: staffId || null,
        staffEmail: staffEmail || 'stall-staff@amoga.com',
        staffName: staffName || null,
        customerName: customerName ? customerName.trim() : null,
        customerPhone: customerPhone ? customerPhone.trim() : null,
        customerEmail: customerEmail ? customerEmail.trim() : null,
        customerGstin: customerGstin ? customerGstin.trim().toUpperCase() : null,
        status: 'COMPLETED',
        paymentStatus: receivedAmountRupees >= netTotalRupees ? 'PAID' : 'PARTIALLY_PAID',
        paymentMethod,
        paymentReference: paymentReference ? paymentReference.trim() : null,
        amountPaid: receivedAmountRupees,
        changeDue: changeDueRupees,
        subtotal: grossSubtotalRupees,
        discountAmount: validDiscountRupees,
        discountReason: discountReason || null,
        discountApprovedBy: discountApprovedBy || null,
        taxableAmount: taxResult.taxableAmount,
        cgstAmount: taxResult.cgstAmount,
        sgstAmount: taxResult.sgstAmount,
        igstAmount: taxResult.igstAmount,
        totalTaxAmount: taxResult.totalTax,
        totalAmount: netTotalRupees,
        totalItemsCount: totalPieces,
        taxSnapshot: taxResult.taxSnapshot || null,
        pricingSnapshot: {
          grossSubtotal: grossSubtotalRupees,
          discountAmount: validDiscountRupees,
          netTotal: netTotalRupees,
          receivedAmount: receivedAmountRupees,
          changeDue: changeDueRupees,
          sellerGstin: storeSettings?.sellerGstin,
          sellerLegalName: storeSettings?.sellerLegalName,
        },
        notes: notes || null,
      },
    });

    // 7. Create PosSaleItem records and atomically decrement inventory
    for (let i = 0; i < verifiedLines.length; i++) {
      const line = verifiedLines[i];
      const taxLine = taxResult.lineTaxes[i];

      await tx.posSaleItem.create({
        data: {
          posSaleId: posSale.id,
          productId: line.productId,
          variantId: line.variantId,
          collectionId: line.collectionId,
          productName: line.productName,
          variantName: line.variantName,
          sku: line.sku,
          hsnCode: line.hsnCode,
          gstRate: line.gstRate,
          isTaxInclusive: line.isTaxInclusive,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineDiscount: 0.00,
          lineTotal: line.lineTotal,
          taxableAmount: taxLine.taxableAmount,
          cgstAmount: taxLine.cgstAmount,
          sgstAmount: taxLine.sgstAmount,
          igstAmount: taxLine.igstAmount,
          totalTax: taxLine.totalTax,
        },
      });

      // Deduct inventory atomically from isolated stall stock location
      if (resolvedLocationId) {
        const prevStock = line.stallInv ? line.stallInv.onHandQuantity : line.currentStock;
        const newStock = Math.max(0, prevStock - line.quantity);

        if (line.stallInv) {
          await tx.locationInventory.update({
            where: { id: line.stallInv.id },
            data: {
              onHandQuantity: newStock,
              lastMovementAt: new Date(),
            },
          });
        } else {
          await tx.locationInventory.create({
            data: {
              locationId: resolvedLocationId,
              productId: line.productId,
              variantId: line.variantId || null,
              onHandQuantity: newStock,
              lastMovementAt: new Date(),
            },
          });
        }

        await tx.locationMovementLog.create({
          data: {
            locationId: resolvedLocationId,
            productId: line.productId,
            variantId: line.variantId || null,
            previousQuantity: prevStock,
            newQuantity: newStock,
            delta: -line.quantity,
            movementType: 'STALL_POS',
            reference: billNumber,
            actorEmail: staffEmail || 'stall-staff',
            actorId: staffId || null,
            reason: `Stall POS Sale ${billNumber}`,
          },
        });
      } else {
        // Fallback for unconfigured stock location
        if (line.isVariant && line.variantId) {
          const newStock = Math.max(0, line.currentStock - line.quantity);
          await tx.productVariant.update({
            where: { id: line.variantId },
            data: {
              stockQuantity: newStock,
              inStock: newStock > 0,
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: line.productId,
              variantId: line.variantId,
              previousStock: line.currentStock,
              adjustedStock: newStock,
              delta: -line.quantity,
              reason: `Stall POS Sale ${billNumber}`,
              adminEmail: staffEmail || 'stall-staff',
              adminId: staffId || null,
              orderId: posSale.id,
              actor: `STAFF: ${staffEmail}`,
              type: 'POS_SALE',
            },
          });
        } else if (line.productId) {
          const newStock = Math.max(0, line.currentStock - line.quantity);
          await tx.product.update({
            where: { id: line.productId },
            data: {
              stockQuantity: newStock,
              inStock: newStock > 0,
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: line.productId,
              variantId: null,
              previousStock: line.currentStock,
              adjustedStock: newStock,
              delta: -line.quantity,
              reason: `Stall POS Sale ${billNumber}`,
              adminEmail: staffEmail || 'stall-staff',
              adminId: staffId || null,
              orderId: posSale.id,
              actor: `STAFF: ${staffEmail}`,
              type: 'POS_SALE',
            },
          });
        }
      }
    }

    // 8. Create PosPaymentRecord
    await tx.posPaymentRecord.create({
      data: {
        posSaleId: posSale.id,
        paymentMethod,
        amount: netTotalRupees,
        amountPaise: Math.round(netTotalRupees * 100),
        reference: paymentReference || null,
        status: receivedAmountRupees >= netTotalRupees ? 'SUCCEEDED' : 'PARTIALLY_PAID',
      },
    });

    // 9. Record Audit Log
    await tx.auditLog.create({
      data: {
        adminEmail: staffEmail || 'stall-staff',
        adminId: staffId || null,
        action: 'POS_SALE_FINALIZED',
        entityType: 'PosSale',
        entityId: posSale.id,
        status: 'SUCCESS',
        details: {
          billNumber,
          totalAmount: netTotalRupees,
          paymentMethod,
          totalPieces,
          stallEventId,
        },
      },
    });

    const fullSale = await tx.posSale.findUnique({
      where: { id: posSale.id },
      include: {
        items: true,
        stallEvent: true,
        payments: true,
      },
    });

    return { sale: fullSale || posSale, isDuplicate: false };
  }, { timeout: 35000, maxWait: 15000 });
}

/**
 * Safely cancels a POS bill and restores inventory with audit movements
 */
export async function cancelPosSale({ saleId, staffEmail, staffId = null, reason = 'Customer cancelled at stall' }) {
  return await prisma.$transaction(
    async (tx) => {
      const sale = await tx.posSale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      const err = new Error('POS Sale record not found.');
      err.status = 404;
      throw err;
    }

    if (sale.status === 'CANCELLED') {
      return { success: true, alreadyCancelled: true, sale };
    }

    // Restore stock for each item
    if (sale.stockLocationId) {
      for (const item of sale.items) {
        const inv = await tx.locationInventory.findFirst({
          where: {
            locationId: sale.stockLocationId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });
        const prevStock = inv ? inv.onHandQuantity : 0;
        const restoredStock = prevStock + item.quantity;
        if (inv) {
          await tx.locationInventory.update({
            where: { id: inv.id },
            data: { onHandQuantity: restoredStock, lastMovementAt: new Date() },
          });
        } else {
          await tx.locationInventory.create({
            data: {
              locationId: sale.stockLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              onHandQuantity: restoredStock,
              lastMovementAt: new Date(),
            },
          });
        }
        await tx.locationMovementLog.create({
          data: {
            locationId: sale.stockLocationId,
            productId: item.productId,
            variantId: item.variantId || null,
            previousQuantity: prevStock,
            newQuantity: restoredStock,
            delta: item.quantity,
            movementType: 'RETURN',
            reference: sale.billNumber,
            actorEmail: staffEmail,
            actorId: staffId,
            reason: `Restock cancelled bill ${sale.billNumber}: ${reason}`,
          },
        });
      }
    } else {
      // Legacy fallback
      for (const item of sale.items) {
        if (item.variantId) {
          const v = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (v) {
            const restoredStock = v.stockQuantity + item.quantity;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: restoredStock,
                inStock: true,
              },
            });

            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                previousStock: v.stockQuantity,
                adjustedStock: restoredStock,
                delta: item.quantity,
                reason: `Compensating restock: POS Bill ${sale.billNumber} cancelled (${reason})`,
                adminEmail: staffEmail,
                adminId: staffId,
                orderId: sale.id,
                actor: `STAFF: ${staffEmail}`,
                type: 'POS_CANCEL',
              },
            });
          }
        } else if (item.productId) {
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (p) {
            const restoredStock = p.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: restoredStock,
                inStock: true,
              },
            });

            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                variantId: null,
                previousStock: p.stockQuantity,
                adjustedStock: restoredStock,
                delta: item.quantity,
                reason: `Compensating restock: POS Bill ${sale.billNumber} cancelled (${reason})`,
                adminEmail: staffEmail,
                adminId: staffId,
                orderId: sale.id,
                actor: `STAFF: ${staffEmail}`,
                type: 'POS_CANCEL',
              },
            });
          }
        }
      }
    }

    // Update sale status
    const updatedSale = await tx.posSale.update({
      where: { id: saleId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledReason: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        adminEmail: staffEmail,
        adminId: staffId,
        action: 'POS_SALE_CANCELLED',
        entityType: 'PosSale',
        entityId: saleId,
        status: 'SUCCESS',
        details: { billNumber: sale.billNumber, reason },
      },
    });

    return { success: true, sale: updatedSale };
  }, { timeout: 35000, maxWait: 15000 });
}

/**
 * Safely records a full or partial refund with optional inventory restoration
 */
export async function refundPosSale({
  saleId,
  staffEmail,
  staffId = null,
  refundAmount = null,
  reason = 'Customer refund requested',
  restockItems = true,
}) {
  return await prisma.$transaction(
    async (tx) => {
      const sale = await tx.posSale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      const err = new Error('POS Sale record not found.');
      err.status = 404;
      throw err;
    }

    const actualRefundAmount = refundAmount !== null ? Number(refundAmount) : Number(sale.totalAmount);

    if (restockItems) {
      if (sale.stockLocationId) {
        for (const item of sale.items) {
          const inv = await tx.locationInventory.findFirst({
            where: {
              locationId: sale.stockLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
            },
          });
          const prevStock = inv ? inv.onHandQuantity : 0;
          const restoredStock = prevStock + item.quantity;
          if (inv) {
            await tx.locationInventory.update({
              where: { id: inv.id },
              data: { onHandQuantity: restoredStock, lastMovementAt: new Date() },
            });
          } else {
            await tx.locationInventory.create({
              data: {
                locationId: sale.stockLocationId,
                productId: item.productId,
                variantId: item.variantId || null,
                onHandQuantity: restoredStock,
                lastMovementAt: new Date(),
              },
            });
          }
          await tx.locationMovementLog.create({
            data: {
              locationId: sale.stockLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              previousQuantity: prevStock,
              newQuantity: restoredStock,
              delta: item.quantity,
              movementType: 'RETURN',
              reference: sale.billNumber,
              actorEmail: staffEmail,
              actorId: staffId,
              reason: `Restock refunded bill ${sale.billNumber}: ${reason}`,
            },
          });
        }
      } else {
        // Legacy fallback
        for (const item of sale.items) {
          if (item.variantId) {
            const v = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (v) {
              const restored = v.stockQuantity + item.quantity;
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: restored, inStock: true },
              });
              await tx.inventoryLog.create({
                data: {
                  productId: item.productId,
                  variantId: item.variantId,
                  previousStock: v.stockQuantity,
                  adjustedStock: restored,
                  delta: item.quantity,
                  reason: `POS Bill ${sale.billNumber} refunded: ${reason}`,
                  adminEmail: staffEmail,
                  adminId: staffId,
                  orderId: sale.id,
                  type: 'POS_REFUND',
                },
              });
            }
          } else if (item.productId) {
            const p = await tx.product.findUnique({ where: { id: item.productId } });
            if (p) {
              const restored = p.stockQuantity + item.quantity;
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: restored, inStock: true },
              });
              await tx.inventoryLog.create({
                data: {
                  productId: item.productId,
                  variantId: null,
                  previousStock: p.stockQuantity,
                  adjustedStock: restored,
                  delta: item.quantity,
                  reason: `POS Bill ${sale.billNumber} refunded: ${reason}`,
                  adminEmail: staffEmail,
                  adminId: staffId,
                  orderId: sale.id,
                  type: 'POS_REFUND',
                },
              });
            }
          }
        }
      }
    }

    const updatedSale = await tx.posSale.update({
      where: { id: saleId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundedAmount: actualRefundAmount,
        refundedAt: new Date(),
        refundReason: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        adminEmail: staffEmail,
        adminId: staffId,
        action: 'POS_SALE_REFUNDED',
        entityType: 'PosSale',
        entityId: saleId,
        status: 'SUCCESS',
        details: { billNumber: sale.billNumber, refundAmount: actualRefundAmount, reason },
      },
    });

    return { success: true, sale: updatedSale };
  }, { timeout: 35000, maxWait: 15000 });
}

/**
 * Lists POS Sales with search, filters, and pagination
 */
export async function listPosSales({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  paymentStatus = 'all',
  paymentMethod = 'all',
  stallEventId = 'all',
  staffEmail = null,
  startDate = null,
  endDate = null,
  client = prisma,
}) {
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { billNumber: { contains: q, mode: 'insensitive' } },
      { customerPhone: { contains: q } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { paymentReference: { contains: q, mode: 'insensitive' } },
      { items: { some: { sku: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  if (status && status !== 'all') {
    where.status = status;
  }
  if (paymentStatus && paymentStatus !== 'all') {
    where.paymentStatus = paymentStatus;
  }
  if (paymentMethod && paymentMethod !== 'all') {
    where.paymentMethod = paymentMethod;
  }
  if (stallEventId && stallEventId !== 'all') {
    where.stallEventId = stallEventId;
  }
  if (staffEmail) {
    where.staffEmail = staffEmail;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = eDate;
    }
  }

  const [totalCount, sales] = await Promise.all([
    client.posSale.count({ where }),
    client.posSale.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        stallEvent: {
          select: { id: true, name: true, venue: true, code: true },
        },
        items: true,
        payments: true,
      },
    }),
  ]);

  return {
    sales: sales.map((sale) => ({
      ...sale,
      whatsAppStatus: sale.whatsappDeliveryStatus,
      whatsAppSentAt: sale.whatsappSentAt,
      whatsAppMessageId: sale.whatsappMessageId,
      whatsAppError: sale.whatsappError,
    })),
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / take) || 1,
    },
  };
}

/**
 * Gets POS Sale details by ID, Bill Number, or Public Receipt Token
 */
export async function getPosSale(identifier, client = prisma) {
  const sale = await client.posSale.findFirst({
    where: {
      OR: [
        { id: identifier },
        { billNumber: identifier },
        { publicReceiptToken: identifier },
      ],
    },
    include: {
      items: true,
      stallEvent: true,
      payments: true,
      staff: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!sale) return null;

  const storeSettings = await client.storeSetting.findUnique({ where: { id: 'default' } });

  return {
    ...sale,
    whatsAppStatus: sale.whatsappDeliveryStatus,
    whatsAppSentAt: sale.whatsappSentAt,
    whatsAppMessageId: sale.whatsappMessageId,
    whatsAppError: sale.whatsappError,
    sellerDetails: {
      legalName: storeSettings?.sellerLegalName || 'Amoga Luxury Private Limited',
      tradeName: storeSettings?.sellerTradeName || 'Amoga',
      gstin: storeSettings?.sellerGstin || '33AAACA1234A1Z5',
      pan: storeSettings?.sellerPan || 'AAACA1234A',
      addressLine1: storeSettings?.sellerAddressLine1 || '108, Heritage Walk, Anna Salai',
      addressLine2: storeSettings?.sellerAddressLine2 || 'T. Nagar',
      city: storeSettings?.sellerCity || 'Chennai',
      state: storeSettings?.sellerState || 'Tamil Nadu',
      pincode: storeSettings?.sellerPincode || '600017',
      contactPhone: storeSettings?.contactPhone || '+91 98765 43210',
      contactEmail: storeSettings?.contactEmail || 'support@amoga.com',
    },
  };
}

/**
 * Aggregates POS Sales Reports from real database records
 */
export async function getPosSalesReport({
  startDate = null,
  endDate = null,
  stallEventId = null,
  stockLocationId = null,
  staffId = null,
  paymentMethod = null,
  collectionId = null,
  client = prisma,
}) {
  const where = {
    status: { in: ['COMPLETED', 'PARTIALLY_PAID', 'REFUNDED'] },
  };

  if (stallEventId && stallEventId !== 'all') {
    where.stallEventId = stallEventId;
  }
  if (stockLocationId && stockLocationId !== 'all') {
    where.stockLocationId = stockLocationId;
  }
  if (staffId && staffId !== 'all') {
    where.staffId = staffId;
  }
  if (paymentMethod && paymentMethod !== 'all') {
    where.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = eDate;
    }
  }

  // 1. Fetch completed sales
  const sales = await client.posSale.findMany({
    where,
    include: {
      items: true,
      stallEvent: { select: { id: true, name: true, venue: true } },
      stockLocation: { select: { id: true, name: true, code: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let grossSales = 0;
  let totalDiscounts = 0;
  let totalTax = 0;
  let netSales = 0;
  let totalUnits = 0;
  let totalRefunds = 0;

  const paymentBreakdown = {
    CASH: { count: 0, amount: 0 },
    UPI: { count: 0, amount: 0 },
    CARD: { count: 0, amount: 0 },
    OTHER: { count: 0, amount: 0 },
  };

  const collectionBreakdown = {
    food: { name: 'Wholesome Pantry', units: 0, amount: 0 },
    tea: { name: 'Wellness Tea', units: 0, amount: 0 },
    sarees: { name: 'Heritage Sarees', units: 0, amount: 0 },
    jewellery: { name: 'Silver Jewellery', units: 0, amount: 0 },
  };

  const stallSalesMap = {};

  for (const s of sales) {
    const isRefunded = s.status === 'REFUNDED';
    const subtotal = Number(s.subtotal) || 0;
    const discount = Number(s.discountAmount) || 0;
    const tax = Number(s.totalTaxAmount) || 0;
    const total = Number(s.totalAmount) || 0;
    const refund = Number(s.refundedAmount) || 0;

    grossSales += subtotal;
    totalDiscounts += discount;
    totalTax += tax;
    netSales += isRefunded ? Math.max(0, total - refund) : total;
    totalRefunds += refund;

    // Payment methods
    const method = s.paymentMethod ? s.paymentMethod.toUpperCase() : 'CASH';
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, amount: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].amount += total;

    // Stall location aggregation
    const stallName = s.stockLocation?.name || s.stallEvent?.name || 'Walk-in / Direct Stall';
    if (!stallSalesMap[stallName]) {
      stallSalesMap[stallName] = {
        name: stallName,
        locationId: s.stockLocationId || s.stallEventId || null,
        city: s.stockLocation?.city || null,
        count: 0,
        amount: 0,
      };
    }
    stallSalesMap[stallName].count += 1;
    stallSalesMap[stallName].amount = Number((stallSalesMap[stallName].amount + total).toFixed(2));

    // Item-level breakdown
    for (const it of s.items) {
      const col = it.collectionId || 'general';
      const itQty = Number(it.quantity) || 1;
      const itTotal = Number(it.lineTotal) || 0;
      totalUnits += itQty;

      if (collectionBreakdown[col]) {
        collectionBreakdown[col].units += itQty;
        collectionBreakdown[col].amount += itTotal;
      }
    }
  }

  return {
    summary: {
      totalBills: sales.length,
      grossSales: Number(grossSales.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      totalRefunds: Number(totalRefunds.toFixed(2)),
      totalUnitsSold: totalUnits,
      averageBillValue: sales.length > 0 ? Number((netSales / sales.length).toFixed(2)) : 0,
    },
    paymentBreakdown,
    collectionBreakdown,
    eventSales: Object.values(stallSalesMap),
    stallSales: Object.values(stallSalesMap),
  };
}

/**
 * Stall Events CRUD
 */
export async function autoInitializeStallLocationInventory(locationId, client = prisma) {
  try {
    const products = await client.product.findMany({
      where: { isActive: true },
      include: { variants: true },
    });

    const existingInvs = await client.locationInventory.findMany({
      where: { locationId },
      select: { productId: true, variantId: true },
    });

    const existingSet = new Set(
      existingInvs.map((inv) => `${inv.productId}_${inv.variantId || 'null'}`)
    );

    const toCreate = [];
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const key = `${p.id}_${v.id}`;
          if (!existingSet.has(key)) {
            toCreate.push({
              locationId,
              productId: p.id,
              variantId: v.id,
              onHandQuantity: 0,
              reservedQuantity: 0,
              reorderThreshold: 5,
              lastMovementAt: new Date(),
            });
          }
        }
      } else {
        const key = `${p.id}_null`;
        if (!existingSet.has(key)) {
          toCreate.push({
            locationId,
            productId: p.id,
            variantId: null,
            onHandQuantity: 0,
            reservedQuantity: 0,
            reorderThreshold: 5,
            lastMovementAt: new Date(),
          });
        }
      }
    }

    if (toCreate.length > 0) {
      await client.locationInventory.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }
  } catch (err) {
    console.error('[autoInitializeStallLocationInventory Error]:', err.message);
  }
}

export async function listStallEvents({ status = 'all', client = prisma } = {}) {
  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }

  const [events, posSettings] = await Promise.all([
    client.stallEvent.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        stockLocation: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            isActive: true,
            _count: {
              select: {
                inventories: true,
                posSales: true,
              },
            },
          },
        },
        _count: {
          select: { posSales: true },
        },
      },
    }),
    client.posSetting.findFirst().catch(() => null),
  ]);

  const defaultStallId = posSettings?.defaultStallId || null;

  return events.map((ev) => ({
    ...ev,
    isDefaultStall: ev.id === defaultStallId,
  }));
}

export async function createStallEvent(data, staffEmail, staffId = null, client = prisma) {
  const code = data.code ? data.code.trim().toUpperCase() : `STALL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const event = await client.stallEvent.create({
    data: {
      code,
      name: data.name.trim(),
      venue: data.venue.trim(),
      address: data.address ? data.address.trim() : null,
      city: data.city ? data.city.trim() : 'Chennai',
      state: data.state ? data.state.trim() : 'Tamil Nadu',
      stateCode: data.stateCode ? data.stateCode.trim() : '33',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status || 'ACTIVE',
      openingCashBalance: data.openingCashBalance !== undefined ? Number(data.openingCashBalance) : 0.0,
      assignedStaffIds: data.assignedStaffIds || [],
      notes: data.notes ? data.notes.trim() : null,
    },
  });

  // Automatically create or link the matching StockLocation for multi-location inventory & transfers
  const locCode = event.code.startsWith('STALL-') ? event.code : `STALL-${event.code}`;
  const stockLocation = await client.stockLocation.upsert({
    where: { code: locCode },
    update: {
      stallEventId: event.id,
      name: `${event.name} Inventory`,
      city: event.city || 'Chennai',
      state: event.state || 'Tamil Nadu',
      address: event.address || null,
      isActive: event.status === 'ACTIVE',
    },
    create: {
      code: locCode,
      name: `${event.name} Inventory`,
      type: 'STALL',
      stallEventId: event.id,
      city: event.city || 'Chennai',
      state: event.state || 'Tamil Nadu',
      address: event.address || null,
      isActive: event.status === 'ACTIVE',
    },
  });

  // If requested or if set as default, update POS settings default stall
  if (data.isDefault || data.setAsDefault) {
    await client.posSetting.updateMany({
      data: { defaultStallId: event.id },
    });
  }

  // Auto-initialize catalog products in LocationInventory for this stall
  if (data.autoInitInventory !== false && stockLocation) {
    await autoInitializeStallLocationInventory(stockLocation.id, client);
  }

  await client.auditLog.create({
    data: {
      adminEmail: staffEmail,
      adminId: staffId,
      action: 'STALL_EVENT_CREATE',
      entityType: 'StallEvent',
      entityId: event.id,
      status: 'SUCCESS',
      details: { name: event.name, code: event.code, venue: event.venue, stockLocationId: stockLocation.id },
    },
  });

  return {
    ...event,
    stockLocation,
    isDefaultStall: Boolean(data.isDefault || data.setAsDefault),
  };
}

export async function updateStallEvent(id, data, staffEmail, staffId = null, client = prisma) {
  const current = await client.stallEvent.findUnique({
    where: { id },
    include: { stockLocation: true },
  });
  if (!current) {
    const err = new Error('Stall/Event not found.');
    err.status = 404;
    throw err;
  }

  const newCode = data.code ? data.code.trim().toUpperCase() : current.code;

  const updated = await client.stallEvent.update({
    where: { id },
    data: {
      code: newCode,
      name: data.name !== undefined ? data.name.trim() : current.name,
      venue: data.venue !== undefined ? data.venue.trim() : current.venue,
      address: data.address !== undefined ? (data.address ? data.address.trim() : null) : current.address,
      city: data.city !== undefined ? (data.city ? data.city.trim() : null) : current.city,
      state: data.state !== undefined ? (data.state ? data.state.trim() : null) : current.state,
      stateCode: data.stateCode !== undefined ? (data.stateCode ? data.stateCode.trim() : '33') : current.stateCode,
      startDate: data.startDate ? new Date(data.startDate) : current.startDate,
      endDate: data.endDate ? new Date(data.endDate) : current.endDate,
      status: data.status || current.status,
      openingCashBalance: data.openingCashBalance !== undefined ? Number(data.openingCashBalance) : current.openingCashBalance,
      assignedStaffIds: data.assignedStaffIds !== undefined ? data.assignedStaffIds : current.assignedStaffIds,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : current.notes,
    },
  });

  // Synchronize or create the corresponding StockLocation
  const locCode = updated.code.startsWith('STALL-') ? updated.code : `STALL-${updated.code}`;
  let stockLocation = null;
  if (current.stockLocation) {
    stockLocation = await client.stockLocation.update({
      where: { id: current.stockLocation.id },
      data: {
        code: locCode,
        name: `${updated.name} Inventory`,
        city: updated.city || 'Chennai',
        state: updated.state || 'Tamil Nadu',
        address: updated.address || null,
        isActive: updated.status === 'ACTIVE',
      },
    });
  } else {
    stockLocation = await client.stockLocation.upsert({
      where: { code: locCode },
      update: {
        stallEventId: updated.id,
        name: `${updated.name} Inventory`,
        city: updated.city || 'Chennai',
        state: updated.state || 'Tamil Nadu',
        address: updated.address || null,
        isActive: updated.status === 'ACTIVE',
      },
      create: {
        code: locCode,
        name: `${updated.name} Inventory`,
        type: 'STALL',
        stallEventId: updated.id,
        city: updated.city || 'Chennai',
        state: updated.state || 'Tamil Nadu',
        address: updated.address || null,
        isActive: updated.status === 'ACTIVE',
      },
    });
  }

  // If default stall status was updated
  if (data.isDefault !== undefined || data.setAsDefault !== undefined) {
    const makeDefault = Boolean(data.isDefault ?? data.setAsDefault);
    if (makeDefault) {
      await client.posSetting.updateMany({
        data: { defaultStallId: id },
      });
    } else {
      const posSetting = await client.posSetting.findFirst();
      if (posSetting?.defaultStallId === id) {
        await client.posSetting.update({
          where: { id: posSetting.id },
          data: { defaultStallId: null },
        });
      }
    }
  }

  // Ensure LocationInventory exists for all active catalogue items
  if (stockLocation) {
    await autoInitializeStallLocationInventory(stockLocation.id, client);
  }

  await client.auditLog.create({
    data: {
      adminEmail: staffEmail,
      adminId: staffId,
      action: 'STALL_EVENT_UPDATE',
      entityType: 'StallEvent',
      entityId: id,
      status: 'SUCCESS',
      details: { previous: current, updated, stockLocationId: stockLocation?.id },
    },
  });

  return {
    ...updated,
    stockLocation,
  };
}

export async function deleteStallEvent(id, staffEmail, staffId = null, client = prisma) {
  const current = await client.stallEvent.findUnique({
    where: { id },
    include: {
      _count: { select: { posSales: true } },
      stockLocation: {
        include: {
          _count: { select: { posSales: true, transfersFrom: true, transfersTo: true } },
        },
      },
    },
  });

  if (!current) {
    const err = new Error('Stall/Event not found.');
    err.status = 404;
    throw err;
  }

  const salesCount = current._count?.posSales || 0;
  const transfersCount = (current.stockLocation?._count?.transfersFrom || 0) + (current.stockLocation?._count?.transfersTo || 0);

  if (salesCount > 0 || transfersCount > 0) {
    // Has fiscal records: soft-archive for audit and compliance safety
    const archived = await client.stallEvent.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    if (current.stockLocation) {
      await client.stockLocation.update({
        where: { id: current.stockLocation.id },
        data: { isActive: false },
      });
    }

    const posSetting = await client.posSetting.findFirst();
    if (posSetting?.defaultStallId === id) {
      await client.posSetting.update({
        where: { id: posSetting.id },
        data: { defaultStallId: null },
      });
    }

    await client.auditLog.create({
      data: {
        adminEmail: staffEmail,
        adminId: staffId,
        action: 'STALL_EVENT_ARCHIVE',
        entityType: 'StallEvent',
        entityId: id,
        status: 'SUCCESS',
        details: { reason: 'Has financial bills/transfers records, archived instead of hard-deleted.' },
      },
    });

    return {
      success: true,
      archived: true,
      message: `Stall "${current.name}" has ${salesCount} bill(s) and has been moved to ARCHIVED.`,
    };
  }

  // No sales/transfers: clean up location inventories, stock location, and stall event
  if (current.stockLocation) {
    await client.locationMovementLog.deleteMany({ where: { locationId: current.stockLocation.id } }).catch(() => {});
    await client.locationInventory.deleteMany({ where: { locationId: current.stockLocation.id } }).catch(() => {});
    await client.stockLocation.delete({ where: { id: current.stockLocation.id } }).catch(() => {});
  }

  const posSetting = await client.posSetting.findFirst();
  if (posSetting?.defaultStallId === id) {
    await client.posSetting.update({
      where: { id: posSetting.id },
      data: { defaultStallId: null },
    });
  }

  await client.stallEvent.delete({ where: { id } });

  await client.auditLog.create({
    data: {
      adminEmail: staffEmail,
      adminId: staffId,
      action: 'STALL_EVENT_DELETE',
      entityType: 'StallEvent',
      entityId: id,
      status: 'SUCCESS',
      details: { name: current.name, code: current.code },
    },
  });

  return {
    success: true,
    deleted: true,
    message: `Stall "${current.name}" deleted successfully.`,
  };
}

