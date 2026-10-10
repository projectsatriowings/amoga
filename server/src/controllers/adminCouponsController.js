import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      coupons: coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
        maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      })),
    });
  } catch (err) {
    console.error('[ADMIN LIST COUPONS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve coupons',
    });
  }
}

export async function createCoupon(req, res) {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
      isActive = true,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Code, discount type, and discount value are required',
      });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_CODE',
        message: `Coupon code "${cleanCode}" already exists`,
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: Boolean(isActive),
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'COUPON_CREATE',
      entityType: 'Coupon',
      entityId: coupon.code,
      details: { code: coupon.code, discountType, discountValue },
    });

    return res.status(201).json({
      success: true,
      coupon: {
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
        maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
      },
    });
  } catch (err) {
    console.error('[ADMIN CREATE COUPON ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create coupon',
    });
  }
}

export async function toggleCoupon(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Coupon not found' });
    }

    const newActive = !existing.isActive;
    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: newActive },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: newActive ? 'COUPON_ACTIVATE' : 'COUPON_DEACTIVATE',
      entityType: 'Coupon',
      entityId: existing.code,
      details: { code: existing.code, isActive: newActive },
    });

    return res.status(200).json({
      success: true,
      coupon: {
        ...updated,
        discountValue: Number(updated.discountValue),
      },
    });
  } catch (err) {
    console.error('[ADMIN TOGGLE COUPON ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to toggle coupon status',
    });
  }
}

/**
 * Public checkout endpoint to authoritative validate coupon against order subtotal
 */
export async function validateCheckoutCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Coupon code required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or inactive coupon code',
      });
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(422).json({
        valid: false,
        message: 'This coupon has expired',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(422).json({
        valid: false,
        message: 'This coupon has reached its maximum usage limit',
      });
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (coupon.minOrderAmount && orderSubtotal < Number(coupon.minOrderAmount)) {
      return res.status(422).json({
        valid: false,
        message: `Minimum order of ₹${Number(coupon.minOrderAmount).toLocaleString()} required for this coupon`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderSubtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    // Ensure discount does not exceed subtotal
    discountAmount = Math.min(orderSubtotal, Math.max(0, discountAmount));

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Number(discountAmount.toFixed(2)),
      message: `Coupon "${coupon.code}" applied successfully!`,
    });
  } catch (err) {
    console.error('[VALIDATE COUPON ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate coupon',
    });
  }
}
