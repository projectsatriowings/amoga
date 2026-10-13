import { Router } from 'express';
import { getCollections, getCollectionBySlug } from '../controllers/collectionsController.js';

const router = Router();

// Ensure collections endpoints never serve stale browser-cached responses
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.get('/', getCollections);
router.get('/:slug', getCollectionBySlug);

export default router;
