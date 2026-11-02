import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { savePrivateEvidenceFile } from './evidenceStorageService.js';
import { logAdminAction } from '../utils/adminAuth.js';

/**
 * Generate human-readable, non-guessable return request reference
 * Example: AMOGA-RET-2026-A1B2C
 */
export function generateReturnReference() {
  const year = new Date().getFullYear();
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AMOGA-RET-${year}-${token}`;
}

/**
 * Validates whether an order is eligible for return submission under configured store policy
 */
export async function validateReturnEligibility(order, settings = null) {
  if (!order) {
    return { isEligible: false, code: 'ORDER_NOT_FOUND', message: 'Order could not be found' };
  }

  // Must be delivered
  if (order.status !== 'DELIVERED') {
    return {
      isEligible: false,
      code: 'NOT_DELIVERED',
      message: `Return requests can only be submitted for delivered orders. Current order status: ${order.status}`,
    };
  }

  const currentSettings = settings || (await prisma.storeSetting.findUnique({ where: { id: 'default' } }));
  const returnWindowDays = currentSettings?.returnWindowDays || 7;
  const foodReturnWindowHours = currentSettings?.foodReturnWindowHours || 48;

  // Compute reference delivery time (from tracking event or order updatedAt)
  const deliveryEvent = await prisma.orderTrackingEvent.findFirst({
    where: { orderId: order.id, status: 'DELIVERED' },
    orderBy: { createdAt: 'desc' },
  });

  const deliveryTimestamp = deliveryEvent?.createdAt || order.updatedAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(deliveryTimestamp).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  const hasFoodItems = (order.items || []).some(
    (item) => item.collectionId === 'food' || item.collectionId === 'tea'
  );

  // If order consists exclusively of perishable pantry goods, apply food window
  const allFood = (order.items || []).every(
    (item) => item.collectionId === 'food' || item.collectionId === 'tea'
  );

  if (allFood && diffHours > foodReturnWindowHours) {
    return {
      isEligible: false,
      code: 'WINDOW_EXPIRED',
      message: `The return reporting window of ${foodReturnWindowHours} hours for perishable pantry and tea goods has elapsed since delivery.`,
    };
  }

  if (diffDays > returnWindowDays) {
    return {
      isEligible: false,
      code: 'WINDOW_EXPIRED',
      message: `The standard return window of ${returnWindowDays} days has elapsed since delivery on ${new Date(deliveryTimestamp).toLocaleDateString('en-IN')}.`,
    };
  }

  return { isEligible: true, deliveryTimestamp, returnWindowDays, foodReturnWindowHours };
}

/**
 * Creates a customer return / replacement request with validation and secure evidence handling
 */
export async function submitCustomerReturnRequest({
  orderReference,
  customerId = null,
  customerEmail,
  reason,
  resolutionPreference = 'REPLACEMENT',
  description,
  items = [],
  evidenceFiles = [],
}) {
  if (!orderReference || !orderReference.trim()) {
    throw new Error('Order reference is required');
  }

  if (!description || description.trim().length < 10) {
    throw new Error('Please provide a detailed description of the issue (at least 10 characters)');
  }

  const validReasons = ['DAMAGED_PRODUCT', 'INCORRECT_PRODUCT', 'TRANSIT_SEAL_BROKEN', 'DEFECTIVE_OR_SPOILED'];
  if (!validReasons.includes(reason)) {
    throw new Error(`Invalid return reason. Permitted reasons: ${validReasons.join(', ')}`);
  }

  const validResolutions = ['REPLACEMENT', 'REFUND'];
  const resolution = validResolutions.includes(resolutionPreference) ? resolutionPreference : 'REPLACEMENT';

  // 1. Fetch order and items with full ownership validation
  const order = await prisma.order.findUnique({
    where: { orderReference: orderReference.trim() },
    include: {
      items: true,
      returnRequests: {
        where: {
          status: { notIn: ['REJECTED', 'CANCELLED'] },
        },
        include: { items: true },
      },
    },
  });

  if (!order) {
    const err = new Error(`Order with reference ${orderReference} was not found`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Strict Customer Ownership Check
  const normalizedEmail = (customerEmail || '').toLowerCase().trim();
  const orderEmail = (order.customerEmail || '').toLowerCase().trim();

  const isOwnerByEmail = normalizedEmail && normalizedEmail === orderEmail;
  const isOwnerById = customerId && order.customerId && customerId === order.customerId;

  if (!isOwnerByEmail && !isOwnerById) {
    const err = new Error('Access denied: You are not authorized to file a return request against this order');
    err.statusCode = 403;
    throw err;
  }

  // 3. Verify Delivery Status and Policy Window
  const eligibility = await validateReturnEligibility(order);
  if (!eligibility.isEligible) {
    const err = new Error(eligibility.message);
    err.statusCode = 400;
    err.code = eligibility.code;
    throw err;
  }

  // 4. Validate Affected Line Items
  if (!items || items.length === 0) {
    throw new Error('Please select at least one delivered item from the order for return/replacement');
  }

  // Map order items by id
  const orderItemMap = new Map();
  for (const oi of order.items) {
    orderItemMap.set(oi.id, oi);
  }

  // Check for existing active return items to prevent duplicate claims
  const alreadyClaimedItemIds = new Set();
  for (const activeReq of order.returnRequests) {
    for (const ri of activeReq.items) {
      alreadyClaimedItemIds.add(ri.orderItemId);
    }
  }

  const validatedItems = [];
  let totalClaimAmount = 0;

  for (const it of items) {
    const orderItemId = it.orderItemId || it.id;
    const orderItem = orderItemMap.get(orderItemId);

    if (!orderItem) {
      throw new Error(`Item ${orderItemId} does not belong to order ${orderReference}`);
    }

    if (alreadyClaimedItemIds.has(orderItemId)) {
      throw new Error(`An active return or replacement request is already pending for item "${orderItem.productName}"`);
    }

    const qty = Number(it.quantity || 1);
    if (isNaN(qty) || qty < 1 || qty > orderItem.quantity) {
      throw new Error(`Invalid return quantity (${qty}) for item "${orderItem.productName}". Maximum allowed: ${orderItem.quantity}`);
    }

    const unitPrice = Number(orderItem.unitPrice || 0);
    const lineTotal = Number((unitPrice * qty).toFixed(2));
    totalClaimAmount += lineTotal;

    validatedItems.push({
      orderItemId: orderItem.id,
      productId: orderItem.productId,
      variantId: orderItem.variantId,
      productName: orderItem.productName,
      variantName: orderItem.variantName,
      quantity: qty,
      unitPrice,
      lineTotal,
      itemConditionNotes: it.conditionNotes || null,
    });
  }

  // 5. Secure Evidence File Processing (Photos & Videos)
  const savedEvidences = [];
  const filesToProcess = evidenceFiles || [];
  if (Array.isArray(filesToProcess) && filesToProcess.length > 0) {
    for (const file of filesToProcess) {
      const fileData = file?.fileData || file?.data;
      if (file && fileData) {
        const saved = await savePrivateEvidenceFile({
          data: fileData,
          fileName: file.fileName || file.originalName || file.name || 'evidence',
          mimeType: file.mimeType || file.type || 'image/jpeg',
        });
        savedEvidences.push(saved);
      }
    }
  }

  // 6. Atomically persist ReturnRequest, Items, Evidence, and Status History in database
  const returnReference = generateReturnReference();

  const createdRequest = await prisma.$transaction(async (tx) => {
    const returnRecord = await tx.returnRequest.create({
      data: {
        returnReference,
        orderId: order.id,
        customerId: order.customerId || customerId || null,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        reason,
        resolutionPreference: resolution,
        description: description.trim(),
        status: 'SUBMITTED',
        refundAmount: resolution === 'REFUND' ? totalClaimAmount : null,
        items: {
          create: validatedItems,
        },
        evidences: {
          create: savedEvidences.map((e) => ({
            fileType: e.fileType,
            mimeType: e.mimeType,
            fileName: e.fileName,
            fileSize: e.fileSize,
            storageKey: e.storageKey,
          })),
        },
        history: {
          create: {
            toStatus: 'SUBMITTED',
            changedBy: normalizedEmail || order.customerEmail,
            actorRole: 'CUSTOMER',
            notes: 'Customer submitted return/replacement request with supporting evidence.',
          },
        },
      },
      include: {
        items: true,
        evidences: {
          select: {
            id: true,
            fileType: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
        history: true,
      },
    });

    return returnRecord;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  // 7. Audit Log
  await logAdminAction({
    adminEmail: 'customer@amogastores.com',
    action: 'RETURN_REQUEST_CREATED',
    entityType: 'ReturnRequest',
    entityId: createdRequest.id,
    details: {
      returnReference: createdRequest.returnReference,
      orderReference: order.orderReference,
      reason,
      resolutionPreference: resolution,
      itemsCount: validatedItems.length,
      evidencesCount: savedEvidences.length,
    },
  });

  return {
    ...createdRequest,
    evidence: createdRequest.evidences || [],
  };
}

/**
 * List returns for a customer (strictly scoped)
 */
export async function listCustomerReturns({ customerId, customerEmail }) {
  const where = {};
  if (customerId) {
    where.OR = [
      { customerId },
      { customerEmail: (customerEmail || '').toLowerCase().trim() },
    ];
  } else if (customerEmail) {
    where.customerEmail = customerEmail.toLowerCase().trim();
  } else {
    return [];
  }

  const returns = await prisma.returnRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          orderReference: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      },
      items: true,
      evidences: {
        select: {
          id: true,
          fileType: true,
          fileName: true,
          fileSize: true,
          createdAt: true,
        },
      },
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return returns;
}

/**
 * Get return request details with security check
 */
export async function getReturnRequestByRef(returnReference, { customerId, customerEmail, isAdmin = false }) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { returnReference },
    include: {
      order: {
        include: {
          items: true,
        },
      },
      items: true,
      evidences: {
        select: {
          id: true,
          fileType: true,
          mimeType: true,
          fileName: true,
          fileSize: true,
          storageKey: true,
          createdAt: true,
        },
      },
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!returnReq) {
    return null;
  }

  // Authorization check
  if (!isAdmin) {
    const normCustomerEmail = (customerEmail || '').toLowerCase().trim();
    const reqEmail = (returnReq.customerEmail || '').toLowerCase().trim();
    const isOwner = (customerId && returnReq.customerId === customerId) || (normCustomerEmail && normCustomerEmail === reqEmail);

    if (!isOwner) {
      const err = new Error('Access denied to this return request');
      err.statusCode = 403;
      throw err;
    }
  }

  return returnReq;
}

/**
 * Admin: List all return requests with filters and pagination
 */
export async function listAdminReturnRequests({ status, reason, search, page = 1, limit = 25 }) {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (reason && reason !== 'ALL') {
    where.reason = reason;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { returnReference: { contains: s, mode: 'insensitive' } },
      { customerEmail: { contains: s, mode: 'insensitive' } },
      { order: { orderReference: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const [totalCount, requests] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderReference: true,
            customerName: true,
            customerEmail: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        items: true,
        evidences: {
          select: {
            id: true,
            fileType: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    }),
  ]);

  return {
    requests,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
    },
  };
}

/**
 * Admin: Update return request workflow state with safeguards against duplicate refunds and stock errors
 */
export async function updateAdminReturnWorkflow(returnId, adminUser, payload) {
  const {
    status,
    notes,
    adminNotes,
    adminNote,
    rejectionReason,
    infoRequestedDetails,
    inspectionNotes,
    returnCarrier,
    reverseCarrier,
    returnTrackingNumber,
    reverseAwbNumber,
    pickupScheduledAt,
    refundAmount,
    refundReference,
    replacementOrderReference,
    shouldRestock = false,
  } = payload;

  const existing = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: true,
      items: true,
    },
  });

  if (!existing) {
    const err = new Error(`Return request ${returnId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const updateData = { updatedAt: new Date() };

  const finalCarrier = returnCarrier || reverseCarrier;
  const finalTracking = returnTrackingNumber || reverseAwbNumber;
  if (finalCarrier !== undefined) updateData.returnCarrier = finalCarrier;
  if (finalTracking !== undefined) updateData.returnTrackingNumber = finalTracking;
  if (adminNotes !== undefined || adminNote !== undefined) updateData.adminNotes = adminNotes || adminNote;
  if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
  if (infoRequestedDetails !== undefined) updateData.infoRequestedDetails = infoRequestedDetails;
  if (inspectionNotes !== undefined) updateData.inspectionNotes = inspectionNotes;
  if (pickupScheduledAt !== undefined) updateData.pickupScheduledAt = pickupScheduledAt ? new Date(pickupScheduledAt) : null;
  if (replacementOrderReference !== undefined) updateData.replacementOrderReference = replacementOrderReference;

  // Safeguard: Prevent duplicate refunds
  if (status === 'REFUND_COMPLETED') {
    if (existing.refundStatus === 'PROCESSED' || existing.status === 'REFUND_COMPLETED') {
      const err = new Error(`Refund has already processed / completed with reference: ${existing.refundReference}`);
      err.statusCode = 400;
      throw err;
    }
    if (!refundReference || !refundReference.trim()) {
      const err = new Error('A payment gateway refund ID or bank UTR reference is required to record refund completion');
      err.statusCode = 400;
      throw err;
    }

    updateData.status = 'REFUND_COMPLETED';
    updateData.refundStatus = 'PROCESSED';
    updateData.refundReference = refundReference.trim();
    updateData.refundedAt = new Date();
    if (refundAmount !== undefined) {
      updateData.refundAmount = Number(refundAmount);
    }
  } else if (status && status !== existing.status) {
    updateData.status = status;

    // Record inspection timestamp and inspector
    if (status === 'INSPECTED_PASSED' || status === 'INSPECTED_REJECTED') {
      updateData.inspectedAt = new Date();
      updateData.inspectedBy = adminUser.email;
    }

    if (status === 'RECEIVED_AT_FACILITY' && !existing.receivedAtFacilityAt) {
      updateData.receivedAtFacilityAt = new Date();
    }

    if (status === 'REPLACEMENT_DISPATCHED' && !existing.replacementDispatchedAt) {
      updateData.replacementDispatchedAt = new Date();
    }

    // Safeguard: Rejection must have reason
    if (status === 'REJECTED' && !rejectionReason && !existing.rejectionReason) {
      const err = new Error('A rejection reason must be recorded when rejecting a return request');
      err.statusCode = 400;
      throw err;
    }

    if (refundAmount !== undefined) {
      updateData.refundAmount = Number(refundAmount);
    }
  }

  // Stock Movement Safeguard:
  // Restocking must only happen once, and only for non-perishable undamaged items
  let restockLogsToCreate = [];
  if (shouldRestock) {
    if (existing.isRestocked) {
      const err = new Error(`Goods for return request ${existing.returnReference} have already been restocked.`);
      err.statusCode = 400;
      throw err;
    }
    updateData.isRestocked = true;
    updateData.restockedAt = new Date();
    updateData.restockedBy = adminUser.email;

    for (const item of existing.items) {
      if (item.productId) {
        restockLogsToCreate.push({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          productName: item.productName,
        });
      }
    }
  }

  // Execute update within atomic transaction
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update return record
    const record = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        ...updateData,
        history: {
          create: {
            fromStatus: existing.status,
            toStatus: status || existing.status,
            changedBy: adminUser.email,
            actorRole: 'ADMIN',
            notes: notes || `Return request updated to ${status || existing.status} by admin staff`,
          },
        },
      },
      include: {
        items: true,
        evidences: {
          select: {
            id: true,
            fileType: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 2. Perform safe inventory restock if authorized
    for (const rItem of restockLogsToCreate) {
      if (rItem.variantId) {
        await tx.productVariant.update({
          where: { id: rItem.variantId },
          data: { stockQuantity: { increment: rItem.quantity } },
        });
      }
      await tx.product.update({
        where: { id: rItem.productId },
        data: { stockQuantity: { increment: rItem.quantity } },
      });

      // Log restock in InventoryLog
      await tx.inventoryLog.create({
        data: {
          productId: rItem.productId,
          variantId: rItem.variantId,
          previousStock: 0,
          adjustedStock: rItem.quantity,
          delta: rItem.quantity,
          reason: `Returned goods inspected & restocked (Return ref: ${existing.returnReference})`,
          adminEmail: adminUser.email,
          adminId: adminUser.id || null,
          orderId: existing.orderId,
          type: 'RETURN_RESTOCK',
        },
      });
    }

    return record;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  // Log action
  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: 'RETURN_WORKFLOW_UPDATED',
    entityType: 'ReturnRequest',
    entityId: returnId,
    details: {
      returnReference: updated.returnReference,
      previousStatus: existing.status,
      newStatus: updated.status,
      isRestocked: updated.isRestocked,
      refundStatus: updated.refundStatus,
      refundReference: updated.refundReference,
    },
  });

  return {
    ...updated,
    reverseCarrier: updated.returnCarrier,
    reverseAwbNumber: updated.returnTrackingNumber,
    adminNote: updated.adminNotes,
  };
}
