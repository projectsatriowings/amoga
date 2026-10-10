import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import collectionsRoutes from './collectionsRoutes.js';
import productsRoutes from './productsRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import adminRoutes from './adminRoutes.js';
import { listPublicBanners } from '../controllers/adminBannersController.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/collections', collectionsRoutes);
router.use('/products', productsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRoutes);

// Public storefront CMS banners
router.get('/banners', listPublicBanners);

export default router;
