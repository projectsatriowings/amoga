import { Router } from 'express';
import { postOrder, getOrder } from '../controllers/ordersController.js';
import { trackOrder } from '../controllers/trackingController.js';
import { checkoutRateLimiter } from '../middleware/rateLimiter.js';
import { optionalCustomerAuth } from '../middleware/customerAuth.js';

const router = Router();

router.post('/', checkoutRateLimiter, optionalCustomerAuth, postOrder);
router.get('/:orderReference', optionalCustomerAuth, getOrder);
router.get('/:orderReference/track', optionalCustomerAuth, trackOrder);

export default router;
