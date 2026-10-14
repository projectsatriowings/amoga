import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductAvailability,
  subscribeRestock,
  unsubscribeRestock,
} from '../controllers/productsController.js';

const router = Router();

// Public stock availability query
router.get('/availability', getProductAvailability);

// Customer back-in-stock subscriptions & cancellations
router.post('/restock-subscribe', subscribeRestock);
router.post('/restock-unsubscribe', unsubscribeRestock);

// Standard catalog retrieval
router.get('/', getProducts);
router.get('/:collection/:slug', getProductBySlug);

export default router;
