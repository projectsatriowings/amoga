import { Router } from 'express';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import {
  searchPosCatalogEndpoint,
  calculatePosBillEndpoint,
  finalizePosSaleEndpoint,
  listPosSalesEndpoint,
  getPosSaleEndpoint,
  sendPosBillWhatsAppEndpoint,
  listStallEventsEndpoint,
  getPosSettingsEndpoint,
} from '../controllers/adminPosController.js';
import { listLocationsEndpoint } from '../controllers/stallInventoryController.js';

const router = Router();

// Staff authentication and role authorization required for all Stall POS operations
// SUPER_ADMIN, ORDER_MANAGER, and CATALOGUE_MANAGER are authorized for POS operations
// CONTENT_MANAGER is strictly forbidden
const POS_ALLOWED_ROLES = ['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER'];
router.use(requireAdminAuth(POS_ALLOWED_ROLES));

// Active locations for stall selector
router.get('/locations', listLocationsEndpoint);
router.get('/events', listStallEventsEndpoint);
router.get('/settings', getPosSettingsEndpoint);

// Catalog search scoped to stall inventory
router.get('/catalog', searchPosCatalogEndpoint);

// GST-inclusive calculation preview
router.post('/calculate', calculatePosBillEndpoint);

// Finalize bill with atomic stall stock deduction
router.post('/finalize', finalizePosSaleEndpoint);

// Bills history for quick reprints
router.get('/sales', listPosSalesEndpoint);
router.get('/sales/:id', getPosSaleEndpoint);

// WhatsApp dispatch
router.post('/whatsapp', sendPosBillWhatsAppEndpoint);

export default router;
