import { Router } from 'express';
import {
  postCreatePaymentOrder,
  postVerifyPayment,
  postWebhook,
  getPaymentStatus,
  postTestSimulate,
} from '../controllers/paymentsController.js';

import { env } from '../config/env.js';

const router = Router();

// 1. Create a payment order attempt
router.post('/create-order', postCreatePaymentOrder);

// 2. Verify client payment callback signature
router.post('/verify', postVerifyPayment);

// 3. Provider Webhook Ingestion
router.post('/webhook', postWebhook);

// 4. Development test simulation helper (blocked in production)
if (env.NODE_ENV !== 'production') {
  router.post('/test-simulate', postTestSimulate);
} else {
  router.post('/test-simulate', (_req, res) => {
    return res.status(403).json({
      success: false,
      error: 'Test payment simulation is strictly prohibited in production.',
    });
  });
}

// 5. Protected payment attempt status check
router.get('/:paymentReference/status', getPaymentStatus);

export default router;
