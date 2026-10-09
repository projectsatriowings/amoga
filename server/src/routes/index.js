import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import collectionsRoutes from './collectionsRoutes.js';
import productsRoutes from './productsRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/collections', collectionsRoutes);
router.use('/products', productsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);

export default router;
