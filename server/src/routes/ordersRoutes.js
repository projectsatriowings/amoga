import { Router } from 'express';
import { postOrder, getOrder } from '../controllers/ordersController.js';
import { checkoutRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/', checkoutRateLimiter, postOrder);
router.get('/:orderReference', getOrder);

export default router;
