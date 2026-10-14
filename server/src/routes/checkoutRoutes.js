import { Router } from 'express';
import { validateCheckoutCart } from '../controllers/checkoutController.js';
import { validateCheckoutCoupon } from '../controllers/adminCouponsController.js';
import { cartValidationRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/validate', cartValidationRateLimiter, validateCheckoutCart);
router.post('/apply-coupon', cartValidationRateLimiter, validateCheckoutCoupon);

export default router;
