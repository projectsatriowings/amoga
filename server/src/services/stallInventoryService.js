import { prisma } from '../config/prisma.js';

/**
 * AMOGA E-COMMERCE — INDEPENDENT STALL INVENTORY & STOCK TRANSFER SERVICE
 * 
 * Manages multi-location stock isolation:
 * - Central Warehouse, Online Storefront, and Independent Event/Stall locations
 * - Audited location inventory balances (on-hand, reserved, available, reorder threshold)
 * - Atomic stock transfers with negative stock prevention
 * - Full movement ledger (LocationMovementLog) for compliance and traceability
 */

/**
 * Lists all configured stock locations
 */
export async function listStockLocations({ type = null, isActive = null } = {}, client = prisma) {
  const where = {};
  if (type) where.type = type;
  if (isActive !== null && isActive !== undefined) where.isActive = Boolean(isActive);

  return await client.stockLocation.findMany({
    where,
    include: {
      stallEvent: {
        select: {
          id: true,
          code: true,
          name: true,
          venue: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
      _count: {
        select: {
          inventories: true,
          posSales: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { type: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Creates or updates a stock location
 */
export async function createStockLocation(data, actorEmail, actorId = null, client = prisma) {
  const loc = await client.stockLocation.create({
    data: {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      type: data.type || 'STALL',
      stallEventId: data.stallEventId || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isDefault: Boolean(data.isDefault),
    },
  });

  await client.auditLog.create({
    data: {
      adminEmail: actorEmail,
      adminId: actorId,
      action: 'STOCK_LOCATION_CREATE',
      entityType: 'StockLocation',
      entityId: loc.id,
      details: { code: loc.code, name: loc.name, type: loc.type },
    },
  });

  return loc;
}

/**
 * Retrieves inventory balances for a specific stock location
 * with search, collection filters, and stock health thresholds
 */
export async function getLocationInventory({
  locationId,
  collectionId = 'all',
  query = '',
  stockStatus = 'all',
  page = 1,
  limit = 50,
} = {}, client = prisma) {
  if (!locationId) {
    throw new Error('Location ID is required to query location inventory.');
  }

  const location = await client.stockLocation.findUnique({
    where: { id: locationId },
    include: { stallEvent: true },
  });

  if (!location) {
    const err = new Error('Stock location not found.');
    err.status = 404;
    throw err;
  }

  const cleanQuery = String(query).trim().toLowerCase();
  const where = {
    locationId,
  };

  if (collectionId && collectionId !== 'all') {
    where.product = { collectionId };
  }

  const rawInventories = await client.locationInventory.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          sourceId: true,
          collectionId: true,
          price: true,
          image: true,
          hsnCode: true,
          gstRate: true,
          category: true,
          stockQuantity: true, // online stock
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          sourceId: true,
          price: true,
          stockQuantity: true, // online variant stock
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Filter in memory for query & stock status
  let items = rawInventories.map((inv) => {
    const p = inv.product;
    const v = inv.variant;
    const displayName = v ? `${p.name} - ${v.name}` : p.name;
    const sku = v?.sku || p.sku || p.sourceId;
    const onHand = inv.onHandQuantity;
    const reserved = inv.reservedQuantity;
    const available = Math.max(0, onHand - reserved);
    const price = v?.price !== null && v?.price !== undefined ? Number(v.price) : Number(p.price || 0);

    let status = 'IN_STOCK';
    if (onHand <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (onHand <= inv.reorderThreshold) {
      status = 'LOW_STOCK';
    }

    return {
      id: inv.id,
      locationId: inv.locationId,
      locationName: location.name,
      locationType: location.type,
      productId: p.id,
      productName: p.name,
      variantId: v?.id || null,
      variantName: v?.name || null,
      displayName,
      sku,
      collectionId: p.collectionId,
      category: p.category,
      image: p.image,
      unitPrice: price,
      hsnCode: p.hsnCode || '5007',
      gstRate: p.gstRate !== null ? Number(p.gstRate) : 5,
      onHandQuantity: onHand,
      reservedQuantity: reserved,
      availableQuantity: available,
      reorderThreshold: inv.reorderThreshold,
      status,
      onlineStockAvailable: v ? v.stockQuantity : p.stockQuantity,
      lastMovementAt: inv.lastMovementAt || inv.updatedAt,
      updatedAt: inv.updatedAt,
    };
  });

  if (cleanQuery) {
    items = items.filter(
      (it) =>
        it.displayName.toLowerCase().includes(cleanQuery) ||
        (it.sku && it.sku.toLowerCase().includes(cleanQuery))
    );
  }

  if (stockStatus && stockStatus !== 'all') {
    items = items.filter((it) => it.status === stockStatus);
  }

  const total = items.length;
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 50);
  const paginated = items.slice((p - 1) * l, p * l);

  // Summary counts
  const summary = {
    totalSkus: total,
    totalPiecesOnHand: items.reduce((sum, it) => sum + it.onHandQuantity, 0),
    lowStockCount: items.filter((it) => it.status === 'LOW_STOCK').length,
    outOfStockCount: items.filter((it) => it.status === 'OUT_OF_STOCK').length,
  };

  return {
    location,
    items: paginated,
    summary,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

/**
 * Audited manual adjustment of location stock
 */
export async function adjustLocationStock({
  locationId,
  productId,
  variantId = null,
  newQuantity,
  reason,
  actorEmail,
  actorId = null,
}, client = prisma) {
  if (newQuantity < 0) {
    const err = new Error('Stock quantity cannot be negative.');
    err.status = 400;
    throw err;
  }
  if (!reason || !reason.trim()) {
    const err = new Error('A reason is mandatory for manual stock adjustments.');
    err.status = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    // Find or create location inventory record
    let inv = await tx.locationInventory.findFirst({
      where: {
        locationId,
        productId,
        variantId: variantId || null,
      },
      include: { product: true, variant: true, location: true },
    });

    const previousQuantity = inv ? inv.onHandQuantity : 0;
    const delta = newQuantity - previousQuantity;

    if (!inv) {
      inv = await tx.locationInventory.create({
        data: {
          locationId,
          productId,
          variantId: variantId || null,
          onHandQuantity: newQuantity,
          lastMovementAt: new Date(),
        },
        include: { product: true, variant: true, location: true },
      });
    } else {
      inv = await tx.locationInventory.update({
        where: { id: inv.id },
        data: {
          onHandQuantity: newQuantity,
          lastMovementAt: new Date(),
        },
        include: { product: true, variant: true, location: true },
      });
    }

    // Ledger entry
    await tx.locationMovementLog.create({
      data: {
        locationId,
        productId,
        variantId: variantId || null,
        previousQuantity,
        newQuantity,
        delta,
        movementType: 'ADJUSTMENT',
        reference: `ADJ-${Date.now()}`,
        actorEmail,
        actorId,
        reason: reason.trim(),
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        adminEmail: actorEmail,
        adminId: actorId,
        action: 'STALL_STOCK_ADJUSTMENT',
        entityType: 'LocationInventory',
        entityId: inv.id,
        details: {
          location: inv.location.name,
          product: inv.product.name,
          variant: inv.variant?.name,
          previousQuantity,
          newQuantity,
          delta,
          reason: reason.trim(),
        },
      },
    });

    return {
      inventory: inv,
      previousQuantity,
      newQuantity,
      delta,
    };
  }, { timeout: 35000, maxWait: 15000 });
}

/**
 * Creates and executes an atomic stock transfer between locations
 * Validates available source stock, prevents negative balances, and creates auditable ledger
 */
export async function executeStockTransfer({
  sourceLocationId,
  destinationLocationId,
  items = [],
  reason = 'Stall Event Stock Allocation',
  notes = null,
  actorEmail,
  actorId = null,
}, client = prisma) {
  if (!sourceLocationId || !destinationLocationId) {
    const err = new Error('Source and destination locations are both required.');
    err.status = 400;
    throw err;
  }
  if (sourceLocationId === destinationLocationId) {
    const err = new Error('Source and destination locations cannot be identical.');
    err.status = 400;
    throw err;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Transfer must contain at least one item.');
    err.status = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    const sourceLoc = await tx.stockLocation.findUnique({ where: { id: sourceLocationId } });
    const destLoc = await tx.stockLocation.findUnique({ where: { id: destinationLocationId } });

    if (!sourceLoc) throw new Error('Source stock location not found.');
    if (!destLoc) throw new Error('Destination stock location not found.');

    // Sequential transfer reference
    const currentYear = new Date().getFullYear();
    const count = await tx.stockTransfer.count();
    const transferNumber = `TRF-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    // Verify stock availability for each item at source
    const verifiedItems = [];
    for (const it of items) {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const productId = it.productId;
      const variantId = it.variantId || null;

      // Check source balance
      let sourceInv = await tx.locationInventory.findFirst({
        where: {
          locationId: sourceLocationId,
          productId,
          variantId: variantId || null,
        },
        include: { product: true, variant: true },
      });

      // If source is MAIN-WAREHOUSE and no local record exists yet, initialize from product's warehouse stock
      if (!sourceInv && sourceLoc.type === 'WAREHOUSE') {
        const prod = await tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
        if (!prod) throw new Error(`Product ${productId} not found.`);
        const v = variantId ? prod.variants.find((x) => x.id === variantId) : null;
        const initialStock = v ? v.stockQuantity : prod.stockQuantity;

        sourceInv = await tx.locationInventory.create({
          data: {
            locationId: sourceLocationId,
            productId,
            variantId,
            onHandQuantity: initialStock,
          },
          include: { product: true, variant: true },
        });
      }

      const availableAtSource = sourceInv ? Math.max(0, sourceInv.onHandQuantity - sourceInv.reservedQuantity) : 0;
      const prodName = sourceInv?.product?.name || it.productName || productId;
      const varName = sourceInv?.variant?.name || it.variantName || '';
      const label = varName ? `${prodName} (${varName})` : prodName;

      if (qty > availableAtSource) {
        const err = new Error(
          `Insufficient stock at "${sourceLoc.name}" for "${label}". Requested: ${qty}, Available: ${availableAtSource}.`
        );
        err.status = 422;
        throw err;
      }

      verifiedItems.push({
        productId,
        variantId,
        quantity: qty,
        sourceInv,
        label,
      });
    }

    // Create StockTransfer master record
    const transfer = await tx.stockTransfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        status: 'COMPLETED',
        initiatedById: actorId,
        initiatedByEmail: actorEmail,
        receivedById: actorId,
        receivedByEmail: actorEmail,
        reason,
        notes,
        transferredAt: new Date(),
        receivedAt: new Date(),
      },
    });

    // Execute atomic balance movements
    for (const item of verifiedItems) {
      // 1. Create Transfer Item
      await tx.stockTransferItem.create({
        data: {
          transferId: transfer.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          receivedQuantity: item.quantity,
        },
      });

      // 2. Decrement Source
      const prevSource = item.sourceInv.onHandQuantity;
      const newSource = prevSource - item.quantity;
      await tx.locationInventory.update({
        where: { id: item.sourceInv.id },
        data: {
          onHandQuantity: newSource,
          lastMovementAt: new Date(),
        },
      });

      await tx.locationMovementLog.create({
        data: {
          locationId: sourceLocationId,
          productId: item.productId,
          variantId: item.variantId,
          previousQuantity: prevSource,
          newQuantity: newSource,
          delta: -item.quantity,
          movementType: 'TRANSFER_OUT',
          reference: transferNumber,
          actorEmail,
          actorId,
          reason: `Transfer to ${destLoc.name} (${transferNumber})`,
        },
      });

      // 3. Increment Destination
      let destInv = await tx.locationInventory.findFirst({
        where: {
          locationId: destinationLocationId,
          productId: item.productId,
          variantId: item.variantId || null,
        },
      });

      const prevDest = destInv ? destInv.onHandQuantity : 0;
      const newDest = prevDest + item.quantity;

      if (!destInv) {
        destInv = await tx.locationInventory.create({
          data: {
            locationId: destinationLocationId,
            productId: item.productId,
            variantId: item.variantId,
            onHandQuantity: newDest,
            lastMovementAt: new Date(),
          },
        });
      } else {
        await tx.locationInventory.update({
          where: { id: destInv.id },
          data: {
            onHandQuantity: newDest,
            lastMovementAt: new Date(),
          },
        });
      }

      await tx.locationMovementLog.create({
        data: {
          locationId: destinationLocationId,
          productId: item.productId,
          variantId: item.variantId,
          previousQuantity: prevDest,
          newQuantity: newDest,
          delta: item.quantity,
          movementType: 'TRANSFER_IN',
          reference: transferNumber,
          actorEmail,
          actorId,
          reason: `Transfer from ${sourceLoc.name} (${transferNumber})`,
        },
      });
    }

    // System audit log
    await tx.auditLog.create({
      data: {
        adminEmail: actorEmail,
        adminId: actorId,
        action: 'STOCK_TRANSFER_EXECUTED',
        entityType: 'StockTransfer',
        entityId: transfer.id,
        details: {
          transferNumber,
          from: sourceLoc.name,
          to: destLoc.name,
          itemCount: verifiedItems.length,
          totalUnits: verifiedItems.reduce((acc, it) => acc + it.quantity, 0),
        },
      },
    });

    return {
      success: true,
      transfer: {
        ...transfer,
        sourceLocation: sourceLoc,
        destinationLocation: destLoc,
        itemsCount: verifiedItems.length,
      },
    };
  }, { timeout: 35000, maxWait: 15000 });
}

/**
 * Lists stock transfers with filtering and pagination
 */
export async function listStockTransfers({
  sourceLocationId = null,
  destinationLocationId = null,
  status = null,
  page = 1,
  limit = 25,
} = {}, client = prisma) {
  const where = {};
  if (sourceLocationId) where.sourceLocationId = sourceLocationId;
  if (destinationLocationId) where.destinationLocationId = destinationLocationId;
  if (status && status !== 'all') where.status = status;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 25);
  const skip = (p - 1) * l;

  const [total, transfers] = await Promise.all([
    client.stockTransfer.count({ where }),
    client.stockTransfer.findMany({
      where,
      include: {
        sourceLocation: { select: { id: true, code: true, name: true, type: true } },
        destinationLocation: { select: { id: true, code: true, name: true, type: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, image: true, collectionId: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    }),
  ]);

  return {
    transfers,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

/**
 * Lists location movement audit logs (auditable ledger)
 */
export async function listLocationMovementLogs({
  locationId = null,
  productId = null,
  movementType = null,
  page = 1,
  limit = 50,
} = {}, client = prisma) {
  const where = {};
  if (locationId && locationId !== 'all') where.locationId = locationId;
  if (productId) where.productId = productId;
  if (movementType && movementType !== 'all') where.movementType = movementType;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 50);
  const skip = (p - 1) * l;

  const [total, logs] = await Promise.all([
    client.locationMovementLog.count({ where }),
    client.locationMovementLog.findMany({
      where,
      include: {
        location: { select: { id: true, code: true, name: true, type: true } },
        product: { select: { id: true, name: true, sku: true, collectionId: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    }),
  ]);

  return {
    logs,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

/**
 * Returns summary reporting of stall stock balance & movements
 */
export async function getStallInventoryReport({ locationId = null, startDate = null, endDate = null } = {}, client = prisma) {
  const whereLoc = {};
  if (locationId && locationId !== 'all') whereLoc.id = locationId;
  else whereLoc.type = 'STALL';

  const locations = await client.stockLocation.findMany({
    where: whereLoc,
    include: {
      stallEvent: true,
      inventories: {
        include: {
          product: { select: { id: true, name: true, sku: true, collectionId: true, price: true } },
          variant: { select: { id: true, name: true, sku: true, price: true } },
        },
      },
      _count: { select: { posSales: true } },
    },
  });

  return locations.map((loc) => {
    const totalItems = loc.inventories.reduce((acc, inv) => acc + inv.onHandQuantity, 0);
    const totalValuation = loc.inventories.reduce((acc, inv) => {
      const price = inv.variant?.price !== null && inv.variant?.price !== undefined
        ? Number(inv.variant.price)
        : Number(inv.product.price || 0);
      return acc + (price * inv.onHandQuantity);
    }, 0);

    return {
      locationId: loc.id,
      locationCode: loc.code,
      locationName: loc.name,
      stallEvent: loc.stallEvent,
      totalSkus: loc.inventories.length,
      totalUnitsOnHand: totalItems,
      estimatedInventoryValuation: Number(totalValuation.toFixed(2)),
      completedSalesCount: loc._count.posSales,
      isActive: loc.isActive,
    };
  });
}
