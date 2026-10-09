import { Router } from 'express';
import { validateCheckoutCart } from '../controllers/checkoutController.js';
import { checkoutRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/validate', checkoutRateLimiter, validateCheckoutCart);

export default router;
