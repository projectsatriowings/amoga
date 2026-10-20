import { Router } from 'express';
import { validateCheckoutCart, getPublicShippingConfig } from '../controllers/checkoutController.js';
import { cartValidationRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.get('/shipping-config', getPublicShippingConfig);
router.post('/validate', cartValidationRateLimiter, validateCheckoutCart);

export default router;
