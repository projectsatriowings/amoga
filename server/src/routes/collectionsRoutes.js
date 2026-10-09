import { Router } from 'express';
import { getCollections } from '../controllers/collectionsController.js';

const router = Router();
router.get('/', getCollections);

export default router;
