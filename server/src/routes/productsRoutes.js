import { Router } from 'express';
import { getProducts, getProductBySlug } from '../controllers/productsController.js';

const router = Router();
router.get('/', getProducts);
router.get('/:collection/:slug', getProductBySlug);

export default router;
