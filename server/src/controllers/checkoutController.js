import { resolveAndValidateCart } from '../services/checkoutService.js';
import { validateCartBodySchema } from '../schemas/checkoutSchemas.js';

export async function validateCheckoutCart(req, res, next) {
  try {
    const parseResult = validateCartBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { items } = parseResult.data;
    const result = await resolveAndValidateCart(items);

    if (!result.isValid) {
      return res.status(422).json({
        success: false,
        canCheckout: false,
        errors: result.errors,
        totals: {
          subtotal: result.subtotal,
          payableCount: result.payableCount,
          totalCount: result.totalCount,
        },
      });
    }

    const shippingAmount = result.shipping?.amount || 0.0;
    const isComplimentary = result.shipping?.isComplimentary ?? (shippingAmount === 0);
    const totalAmount = Number((result.subtotal + shippingAmount).toFixed(2));

    return res.status(200).json({
      success: true,
      canCheckout: true,
      lines: result.lines,
      shipping: result.shipping,
      taxBreakdown: result.taxBreakdown,
      totals: {
        subtotal: result.subtotal,
        shippingAmount,
        shippingCarrier: result.shipping?.carrier || 'India Post',
        isComplimentaryShipping: isComplimentary,
        freeShippingThreshold: result.shipping?.freeShippingThreshold ?? 2000,
        shippingThresholdOperator: result.shipping?.thresholdOperator || 'GTE',
        taxPercentage: result.taxPercentage ?? 5,
        totalTaxAmount: result.taxBreakdown?.totalTaxAmount || 0,
        taxableAmount: result.taxBreakdown?.taxableAmount || 0,
        cgstAmount: result.taxBreakdown?.cgstAmount || 0,
        sgstAmount: result.taxBreakdown?.sgstAmount || 0,
        igstAmount: result.taxBreakdown?.igstAmount || 0,
        isTaxInclusive: true,
        totalAmount,
        payableCount: result.payableCount,
        totalCount: result.totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicShippingConfig(req, res, next) {
  try {
    const { prisma } = await import('../config/prisma.js');
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });

    const freeShippingThreshold = Number(settings?.freeShippingThreshold ?? 2000);
    const shippingThresholdOperator = settings?.shippingThresholdOperator || 'GTE';
    const shippingCarrierName = settings?.shippingCarrierName || 'India Post';
    const shippingStandardRate = Number(settings?.shippingStandardRate || 0);

    const compliance = {
      sellerLegalName: settings?.sellerLegalName || 'Amoga Luxury Private Limited',
      sellerTradeName: settings?.sellerTradeName || 'Amoga',
      sellerGstin: settings?.sellerGstin || '33AYMPK1833D1ZQ',
      sellerPan: settings?.sellerPan || 'AYMPK1833D',
      sellerState: settings?.sellerState || 'Tamil Nadu',
      sellerStateCode: settings?.sellerStateCode || '33',
      sellerAddress: [
        settings?.sellerAddressLine1 || '108, Heritage Walk, Anna Salai',
        settings?.sellerAddressLine2 || 'T. Nagar',
        settings?.sellerCity || 'Chennai',
        settings?.sellerState || 'Tamil Nadu',
        settings?.sellerPincode || '600017',
      ].filter(Boolean).join(', '),
      fssaiLicenseNumber: settings?.fssaiLicenseNumber || '22425540000677',
      fssaiLicenseHolder: settings?.fssaiLicenseHolder || 'Amoga Luxury Private Limited',
      fssaiLicenseType: settings?.fssaiLicenseType || 'State License',
      fssaiCertificateUrl: settings?.fssaiCertificateUrl || null,
      fssaiScopeNotice: settings?.fssaiScopeNotice || 'Verified 14-digit FSSAI licence for proprietary food and botanical tea retail packaging.',
      returnWindowDays: settings?.returnWindowDays || 7,
      foodReturnWindowHours: settings?.foodReturnWindowHours || 48,
      returnPolicyVersion: settings?.returnPolicyVersion || '2026.1',
    };

    return res.status(200).json({
      success: true,
      config: {
        freeShippingThreshold,
        shippingThresholdOperator,
        shippingCarrierName,
        shippingStandardRate,
        businessApprovalPending: true,
        status: 'PENDING_BUSINESS_CONFIRMATION',
        notes: 'Authoritative configuration loaded from StoreSetting database table. Final threshold pending business owner confirmation.',
        compliance,
      },
    });
  } catch (error) {
    next(error);
  }
}
