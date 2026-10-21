import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import collectionsRoutes from './collectionsRoutes.js';
import productsRoutes from './productsRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import adminRoutes from './adminRoutes.js';
import contactRoutes from './contactRoutes.js';
import customerRoutes from './customerRoutes.js';
import reviewsRoutes from './reviewsRoutes.js';
import posPublicRoutes from './posPublicRoutes.js';
import stallRoutes from './stallRoutes.js';
import {
  createStandardOrder,
  verifyStandardPayment,
} from '../controllers/razorpayStandardController.js';
import { postWebhook } from '../controllers/paymentsController.js';

const router = Router();

// Razorpay Standard Checkout Endpoints
router.post('/create-order', createStandardOrder);
router.post('/verify-payment', verifyStandardPayment);
router.post('/webhook', postWebhook);

router.use('/health', healthRoutes);
router.use('/collections', collectionsRoutes);
router.use('/products', productsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRoutes);
router.use('/pos', posPublicRoutes);
router.use('/stall', stallRoutes);
router.use('/contact', contactRoutes);
router.use('/customer', customerRoutes);
router.use('/reviews', reviewsRoutes);

export default router;

