import { Router } from 'express';
import { postOrder, getOrder, getOrderInvoice } from '../controllers/ordersController.js';
import { trackOrder } from '../controllers/trackingController.js';
import { checkoutRateLimiter } from '../middleware/rateLimiter.js';
import { optionalCustomerAuth } from '../middleware/customerAuth.js';

const router = Router();

import {
  submitReturnEndpoint,
  getCustomerReturnDetailEndpoint,
  downloadCustomerEvidenceEndpoint,
} from '../controllers/customerReturnController.js';

router.post('/', checkoutRateLimiter, optionalCustomerAuth, postOrder);
router.get('/:orderReference', optionalCustomerAuth, getOrder);
router.get('/:orderReference/track', optionalCustomerAuth, trackOrder);
router.get('/:orderReference/invoice', optionalCustomerAuth, getOrderInvoice);

// Return / Replacement submission and tracking
router.post('/:orderReference/returns', checkoutRateLimiter, optionalCustomerAuth, submitReturnEndpoint);
router.get('/:orderReference/returns/:returnReference', optionalCustomerAuth, getCustomerReturnDetailEndpoint);
router.get('/:orderReference/returns/:returnReference/evidence/:evidenceId', optionalCustomerAuth, downloadCustomerEvidenceEndpoint);

export default router;
