import {
  searchPosCatalog,
  calculatePosBillTax,
  finalizePosSale,
  cancelPosSale,
  refundPosSale,
  listPosSales,
  getPosSale,
  getPosSalesReport,
  listStallEvents,
  createStallEvent,
  updateStallEvent,
  deleteStallEvent,
  getPosSettings,
  updatePosSettings,
} from '../services/posService.js';
import {
  sendPosBillWhatsApp,
  normalizeIndianPhone,
  isWhatsAppApiConfigured,
} from '../services/whatsappService.js';
import { prisma } from '../config/prisma.js';

/**
 * Controller for Stall Billing / POS module
 */

// 1. Search catalogue for POS Register
export async function searchPosCatalogEndpoint(req, res, next) {
  try {
    const { query = '', collectionId = 'all', inStockOnly, stockLocationId, stallEventId } = req.query;
    const products = await searchPosCatalog({
      query,
      collectionId,
      inStockOnly: inStockOnly === 'true',
      stockLocationId: stockLocationId || null,
      stallEventId: stallEventId || null,
    });
    return res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

// 2. Pre-flight GST-inclusive calculation
export async function calculatePosBillEndpoint(req, res, next) {
  try {
    const {
      items = [],
      stallEventId = null,
      overallDiscountType = 'AMOUNT',
      overallDiscountValue = 0,
    } = req.body;

    let discountAmount = 0;
    const val = Number(overallDiscountValue) || 0;
    if (val > 0) {
      if (overallDiscountType === 'PERCENT') {
        // Approximate discount on gross before tax calc
        let grossPaise = 0;
        for (const it of items) {
          grossPaise += Math.round((Number(it.unitPrice) || 0) * 100) * (Number(it.quantity) || 1);
        }
        discountAmount = (grossPaise * (val / 100)) / 100;
      } else {
        discountAmount = val;
      }
    }

    const calculation = await calculatePosBillTax({
      items,
      stallEventId,
      discountAmount,
    });

    return res.json({ success: true, calculation });
  } catch (error) {
    next(error);
  }
}

// 3. Finalize POS Bill (Atomic transaction with inventory deduction)
export async function finalizePosSaleEndpoint(req, res, next) {
  try {
    const {
      stallEventId,
      stockLocationId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      overallDiscountType,
      overallDiscountValue,
      discountReason,
      paymentMethod = 'CASH',
      paymentStatus = 'PAID',
      amountReceived,
      paymentReference,
      notes,
      sendWhatsApp = false,
      idempotencyKey,
    } = req.body;

    const staffId = req.admin.id;
    const staffEmail = req.admin.email;
    const staffName = req.admin.name || staffEmail;
    const userRole = req.admin.role;

    // Check discount permission
    const posSettings = await getPosSettings();
    const maxAllowedDiscount = posSettings.maxDiscountPercentWithoutApproval ?? 15.0;

    let discountPct = 0;
    const discVal = Number(overallDiscountValue) || 0;
    if (discVal > 0) {
      if (overallDiscountType === 'PERCENT') {
        discountPct = discVal;
      } else {
        // Compute percentage of gross
        let approxGross = 0;
        for (const it of (items || [])) {
          approxGross += (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1);
        }
        if (approxGross > 0) {
          discountPct = (discVal / approxGross) * 100;
        }
      }

      if (discountPct > maxAllowedDiscount && userRole !== 'SUPER_ADMIN' && userRole !== 'ORDER_MANAGER') {
        return res.status(403).json({
          error: 'DISCOUNT_APPROVAL_REQUIRED',
          message: `Discounts exceeding ${maxAllowedDiscount}% require Store Manager or Super Admin approval.`,
        });
      }
    }

    const { sale, isDuplicate } = await finalizePosSale({
      stallEventId: stallEventId || null,
      stockLocationId: stockLocationId || null,
      staffId,
      staffEmail,
      staffName,
      customerName: customerName ? customerName.trim() : null,
      customerPhone: customerPhone ? customerPhone.trim() : null,
      customerEmail: customerEmail ? customerEmail.trim() : null,
      items,
      overallDiscountType: overallDiscountType || 'AMOUNT',
      overallDiscountValue: Number(overallDiscountValue) || 0,
      discountReason: discountReason ? discountReason.trim() : null,
      paymentMethod,
      paymentStatus,
      amountReceived: amountReceived !== undefined ? Number(amountReceived) : null,
      paymentReference: paymentReference ? paymentReference.trim() : null,
      notes: notes ? notes.trim() : null,
      idempotencyKey: idempotencyKey || null,
    });

    // Optional WhatsApp dispatch
    let whatsAppResult = null;
    const targetPhone = sale.customerPhone || customerPhone;
    if (sendWhatsApp && targetPhone) {
      const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
      const receiptUrl = `${frontendOrigin}/receipt/${sale.publicReceiptToken}`;

      whatsAppResult = await sendPosBillWhatsApp({
        phone: targetPhone,
        billNumber: sale.billNumber,
        createdAt: sale.createdAt,
        stallName: sale.stallEvent?.name || null,
        customerName: sale.customerName,
        items: sale.items,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        receiptUrl,
        sellerTradeName: 'Amoga',
      });

      // Update sale whatsappDeliveryStatus in DB
      if (whatsAppResult.success) {
        await prisma.posSale.update({
          where: { id: sale.id },
          data: {
            whatsappDeliveryStatus: whatsAppResult.deliveryMode === 'MANUAL_FALLBACK' ? 'FALLBACK_READY' : 'SENT',
            whatsappSentAt: new Date(),
            whatsappMessageId: whatsAppResult.messageId || null,
            whatsappError: null,
          },
        }).catch((err) => {
          console.error('[POS WhatsApp Finalize Update Error]:', err.message);
        });
      } else {
        await prisma.posSale.update({
          where: { id: sale.id },
          data: {
            whatsappDeliveryStatus: 'FAILED',
            whatsappError: whatsAppResult.message || whatsAppResult.error || 'WhatsApp dispatch failed',
          },
        }).catch((err) => {
          console.error('[POS WhatsApp Finalize Update Error]:', err.message);
        });
      }
    }

    const deliveryStatus = whatsAppResult
      ? (whatsAppResult.deliveryMode === 'MANUAL_FALLBACK' ? 'FALLBACK_READY' : (whatsAppResult.success ? 'SENT' : 'FAILED'))
      : (sale.whatsappDeliveryStatus || 'NOT_REQUESTED');

    return res.status(201).json({
      success: true,
      sale: {
        ...sale,
        whatsappDeliveryStatus: deliveryStatus,
        whatsAppStatus: deliveryStatus,
      },
      isDuplicate,
      whatsAppResult: whatsAppResult
        ? {
            ...whatsAppResult,
            status: deliveryStatus,
            deliveryStatus,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

// 4. List POS Sales with search and filters
export async function listPosSalesEndpoint(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      paymentStatus = 'all',
      paymentMethod = 'all',
      stallEventId = 'all',
      startDate = null,
      endDate = null,
    } = req.query;

    const result = await listPosSales({
      page,
      limit,
      search,
      status,
      paymentStatus,
      paymentMethod,
      stallEventId,
      startDate,
      endDate,
    });

    return res.json({
      success: true,
      sales: result.sales,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// 5. Get Single POS Sale Details
export async function getPosSaleEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const sale = await getPosSale(id);

    if (!sale) {
      return res.status(404).json({
        error: 'SALE_NOT_FOUND',
        message: `POS Sale record with identifier "${id}" was not found.`,
      });
    }

    return res.json({ success: true, sale });
  } catch (error) {
    next(error);
  }
}

// 6. Cancel POS Sale (Restores inventory with compensating movements)
export async function cancelPosSaleEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by staff at stall' } = req.body;

    const result = await cancelPosSale({
      saleId: id,
      staffEmail: req.admin.email,
      staffId: req.admin.id,
      reason,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// 7. Refund POS Sale (Safe full or partial refund with optional restocking)
export async function refundPosSaleEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const { refundAmount, reason, restockItems = true } = req.body;

    const result = await refundPosSale({
      saleId: id,
      staffEmail: req.admin.email,
      staffId: req.admin.id,
      refundAmount,
      reason,
      restockItems,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// 8. Re-send or Generate WhatsApp Receipt
export async function sendPosBillWhatsAppEndpoint(req, res, next) {
  try {
    const id = req.params.id || req.body.id || req.body.saleId;
    const { phone, forceManual = false } = req.body;

    const sale = await getPosSale(id);
    if (!sale) {
      return res.status(404).json({
        error: 'SALE_NOT_FOUND',
        message: 'POS bill not found.',
      });
    }

    const targetPhone = phone || sale.customerPhone;
    if (!targetPhone) {
      return res.status(400).json({
        error: 'PHONE_REQUIRED',
        message: 'Please provide a valid 10-digit Indian mobile number.',
      });
    }

    const phoneValidation = normalizeIndianPhone(targetPhone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: phoneValidation.message,
      });
    }

    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const receiptUrl = `${frontendOrigin}/receipt/${sale.publicReceiptToken}`;

    const whatsAppResult = await sendPosBillWhatsApp({
      phone: targetPhone,
      billNumber: sale.billNumber,
      createdAt: sale.createdAt,
      stallName: sale.stallEvent?.name || null,
      customerName: sale.customerName,
      items: sale.items,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      receiptUrl,
      sellerTradeName: sale.sellerDetails?.tradeName || 'Amoga',
      forceManual,
    });

    const deliveryStatus = whatsAppResult.success
      ? (whatsAppResult.deliveryMode === 'MANUAL_FALLBACK' ? 'FALLBACK_READY' : 'SENT')
      : 'FAILED';

    // Update status in database using exact Prisma schema column names
    if (whatsAppResult.success) {
      await prisma.posSale.update({
        where: { id: sale.id },
        data: {
          customerPhone: phoneValidation.digits10,
          whatsappDeliveryStatus: deliveryStatus,
          whatsappSentAt: new Date(),
          whatsappMessageId: whatsAppResult.messageId || null,
          whatsappError: null,
        },
      });
    } else {
      await prisma.posSale.update({
        where: { id: sale.id },
        data: {
          customerPhone: phoneValidation.digits10,
          whatsappDeliveryStatus: 'FAILED',
          whatsappError: whatsAppResult.message || whatsAppResult.error || 'WhatsApp delivery failed',
        },
      });
    }

    return res.json({
      success: true,
      whatsAppResult: {
        ...whatsAppResult,
        status: deliveryStatus,
        deliveryStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 9. Aggregated POS Sales Reports
export async function getPosSalesReportEndpoint(req, res, next) {
  try {
    const {
      startDate,
      endDate,
      stallEventId,
      staffId,
      paymentMethod,
      collectionId,
    } = req.query;

    const report = await getPosSalesReport({
      startDate,
      endDate,
      stallEventId,
      staffId,
      paymentMethod,
      collectionId,
    });

    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

// 10. Stall Events CRUD
export async function listStallEventsEndpoint(req, res, next) {
  try {
    const { status = 'all' } = req.query;
    const events = await listStallEvents({ status });
    return res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
}

export async function createStallEventEndpoint(req, res, next) {
  try {
    const event = await createStallEvent(req.body, req.admin.email, req.admin.id);
    return res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

export async function updateStallEventEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const event = await updateStallEvent(id, req.body, req.admin.email, req.admin.id);
    return res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

export async function deleteStallEventEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const result = await deleteStallEvent(id, req.admin.email, req.admin.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function setDefaultStallEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.posSetting.updateMany({
      data: { defaultStallId: id },
    });
    return res.json({ success: true, message: 'Default POS stall register updated successfully.', defaultStallId: id });
  } catch (error) {
    next(error);
  }
}

// 11. POS Settings
export async function getPosSettingsEndpoint(req, res, next) {
  try {
    const settings = await getPosSettings();
    const isCloudApiReady = isWhatsAppApiConfigured();
    return res.json({
      success: true,
      settings: {
        ...settings,
        isCloudApiConfigured: isCloudApiReady,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePosSettingsEndpoint(req, res, next) {
  try {
    const settings = await updatePosSettings(req.body, req.admin.email, req.admin.id);
    return res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

// 12. Public Unauthenticated Receipt by Cryptographic Token
export async function getPublicReceiptEndpoint(req, res, next) {
  try {
    const { token } = req.params;
    if (!token || token.trim().length < 16) {
      return res.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed receipt token.',
      });
    }

    const sale = await getPosSale(token);
    if (!sale) {
      return res.status(404).json({
        error: 'RECEIPT_NOT_FOUND',
        message: 'The requested tax invoice receipt was not found or has expired.',
      });
    }

    // Mask sensitive details for public view
    const maskedPhone = sale.customerPhone
      ? sale.customerPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2')
      : null;

    return res.json({
      success: true,
      receipt: {
        ...sale,
        customerPhone: maskedPhone,
        staff: sale.staff ? { name: sale.staff.name || 'Store Staff' } : null,
      },
    });
  } catch (error) {
    next(error);
  }
}
