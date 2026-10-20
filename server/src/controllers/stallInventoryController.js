import {
  listStockLocations,
  createStockLocation,
  getLocationInventory,
  adjustLocationStock,
  executeStockTransfer,
  listStockTransfers,
  listLocationMovementLogs,
  getStallInventoryReport,
} from '../services/stallInventoryService.js';

/**
 * Controller for Stall Management & Stock Location APIs
 */

export async function listLocationsEndpoint(req, res, next) {
  try {
    const { type, isActive } = req.query;
    const locations = await listStockLocations({
      type: type || null,
      isActive: isActive !== undefined ? isActive === 'true' : null,
    });
    return res.json({ success: true, locations });
  } catch (error) {
    next(error);
  }
}

export async function createLocationEndpoint(req, res, next) {
  try {
    const { code, name, type, stallEventId, address, city, state, isActive, isDefault } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Code and name are required.' });
    }
    const location = await createStockLocation(
      { code, name, type, stallEventId, address, city, state, isActive, isDefault },
      req.admin.email,
      req.admin.id
    );
    return res.status(201).json({ success: true, location });
  } catch (error) {
    next(error);
  }
}

export async function getLocationInventoryEndpoint(req, res, next) {
  try {
    const { locationId, collectionId, query, stockStatus, page, limit } = req.query;
    if (!locationId) {
      return res.status(400).json({ success: false, message: 'locationId is required.' });
    }
    const data = await getLocationInventory({
      locationId,
      collectionId,
      query,
      stockStatus,
      page,
      limit,
    });
    return res.json({ success: true, inventory: data.items, ...data });
  } catch (error) {
    next(error);
  }
}

export async function adjustStockEndpoint(req, res, next) {
  try {
    const locationId = req.body.locationId || req.body.stockLocationId;
    const { productId, variantId, reason } = req.body;
    let newQuantity = req.body.newQuantity;

    if (!locationId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'locationId and productId are required.',
      });
    }

    if (newQuantity === undefined && req.body.quantityChange !== undefined) {
      const { prisma } = await import('../config/prisma.js');
      const inv = await prisma.locationInventory.findFirst({
        where: { locationId, productId, variantId: variantId || null },
      });
      const currentQty = inv ? inv.onHandQuantity : 0;
      newQuantity = Math.max(0, currentQty + Number(req.body.quantityChange));
    }

    if (newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'newQuantity or quantityChange is required.',
      });
    }

    const result = await adjustLocationStock({
      locationId,
      productId,
      variantId: variantId || null,
      newQuantity: Number(newQuantity),
      reason: reason || 'Manual adjustment',
      actorEmail: req.admin.email,
      actorId: req.admin.id,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function executeStockTransferEndpoint(req, res, next) {
  try {
    const sourceLocationId = req.body.sourceLocationId || req.body.fromLocationId;
    const destinationLocationId = req.body.destinationLocationId || req.body.toLocationId;
    const { items, reason, notes } = req.body;
    if (!sourceLocationId || !destinationLocationId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'sourceLocationId (or fromLocationId), destinationLocationId (or toLocationId), and items are required.',
      });
    }

    const result = await executeStockTransfer({
      sourceLocationId,
      destinationLocationId,
      items,
      reason,
      notes,
      actorEmail: req.admin.email,
      actorId: req.admin.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listTransfersEndpoint(req, res, next) {
  try {
    const { sourceLocationId, destinationLocationId, status, page, limit } = req.query;
    const data = await listStockTransfers({
      sourceLocationId,
      destinationLocationId,
      status,
      page,
      limit,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export async function listMovementLogsEndpoint(req, res, next) {
  try {
    const { locationId, productId, movementType, page, limit } = req.query;
    const data = await listLocationMovementLogs({
      locationId,
      productId,
      movementType,
      page,
      limit,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryReportEndpoint(req, res, next) {
  try {
    const { locationId, startDate, endDate } = req.query;
    const report = await getStallInventoryReport({ locationId, startDate, endDate });
    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}
