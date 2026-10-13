import { createOrder, getOrderByReference } from '../services/checkoutService.js';
import { createOrderBodySchema } from '../schemas/checkoutSchemas.js';

export async function postOrder(req, res, next) {
  try {
    const parseResult = createOrderBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { items, customer, idempotencyKey, couponCode } = parseResult.data;
    const isDemo = Boolean(req.body.isDemo);

    const result = await createOrder({
      items,
      customer,
      idempotencyKey,
      couponCode,
      isDemo,
      customerId: req.customerId || null,
    });

    if (result.isDuplicate) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: 'Order previously submitted with identical parameters',
        orderReference: result.orderReference,
        status: result.status,
        currency: result.currency,
        totals: result.totals,
        createdAt: result.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      orderReference: result.orderReference,
      guestAccessToken: result.guestAccessToken,
      status: result.status,
      currency: result.currency,
      totals: result.totals,
      customer: result.customer,
      items: result.items,
      createdAt: result.createdAt,
    });
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({
        success: false,
        error: error.message,
        details: error.details,
      });
    }
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const { orderReference } = req.params;

    // Security Hardening: ONLY accept token via header (never query string)
    // Supports 'x-guest-access-token' or 'Authorization: Bearer <token>'
    let guestAccessToken = req.headers['x-guest-access-token'];
    if (!guestAccessToken && req.headers.authorization?.startsWith('Bearer ')) {
      guestAccessToken = req.headers.authorization.slice(7).trim();
    }

    if (!guestAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'Guest access token header (x-guest-access-token) is required to view order details.',
      });
    }

    const result = await getOrderByReference(orderReference, guestAccessToken);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        error: `Order with reference "${orderReference}" was not found.`,
      });
    }

    if (result.unauthorized) {
      return res.status(403).json({
        success: false,
        error: 'Invalid guest access token. You are not authorized to view this order.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
