import { Router } from 'express';
import { validateCheckoutCart } from '../controllers/checkoutController.js';
import { validateCheckoutCoupon } from '../controllers/adminCouponsController.js';
import { checkoutRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/validate', checkoutRateLimiter, validateCheckoutCart);
router.post('/apply-coupon', checkoutRateLimiter, validateCheckoutCoupon);

export default router;
