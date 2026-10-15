import { Router } from 'express';
import {
  getProductReviews,
  submitProductReview,
  adminListReviews,
  adminModerateReview,
} from '../controllers/reviewsController.js';
import { optionalCustomerAuth } from '../middleware/customerAuth.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();

// Public / Customer Product Reviews
router.get('/product/:productId', optionalCustomerAuth, getProductReviews);
router.post('/product/:productId', optionalCustomerAuth, submitProductReview);

// Admin Moderation Endpoints
router.get('/admin', requireAdminAuth(), adminListReviews);
router.patch('/admin/:id/status', requireAdminAuth(), adminModerateReview);

export default router;
