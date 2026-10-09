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

    return res.status(200).json({
      success: true,
      canCheckout: true,
      lines: result.lines,
      totals: {
        subtotal: result.subtotal,
        shippingAmount: 0.0,
        taxAmount: 0.0,
        totalAmount: result.subtotal,
        payableCount: result.payableCount,
        totalCount: result.totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
