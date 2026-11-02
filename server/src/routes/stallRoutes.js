import { Router } from 'express';
import { requireStallAuth } from '../middleware/adminAuth.js';
import {
  loginStallStaff,
  getStallProfile,
  logoutStallStaff,
  changePasswordStallStaff,
  verifyStallResetToken,
  resetPasswordStallStaff,
} from '../controllers/stallAuthController.js';
import { passwordResetRateLimiter } from '../middleware/authRateLimiter.js';
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
import {
  listStockLocations,
  executeStockTransfer,
} from '../services/stallInventoryService.js';

const router = Router();

// ==========================================
// 1. PUBLIC AUTHENTICATION (FOR STALL STAFF)
// ==========================================

// Dedicated Stall Staff Login
router.post('/auth/login', loginStallStaff);

// Public Staff Password Recovery (Rate-limited single-use token)
router.get('/auth/verify-reset-token', passwordResetRateLimiter, verifyStallResetToken);
router.post('/auth/reset-password', passwordResetRateLimiter, resetPasswordStallStaff);

// ==========================================
// 2. PROTECTED STALL STAFF ROUTES
// Requires authenticated STALL_MANAGER, STALL_CASHIER, or SUPER_ADMIN
// ==========================================
router.use(requireStallAuth());

// Session validation and profile info
router.get('/auth/me', getStallProfile);
router.post('/auth/logout', logoutStallStaff);
router.post('/auth/change-password', changePasswordStallStaff);

// Authorized stall locations for the authenticated staff member
router.get('/locations', async (req, res, next) => {
  try {
    const allLocations = await listStockLocations({ isActive: true });

    // Super Admin has global access to all locations
    if (req.admin.role === 'SUPER_ADMIN') {
      return res.json({ success: true, locations: allLocations });
    }

    const assignedIds = Array.isArray(req.admin.assignedLocationIds) ? req.admin.assignedLocationIds : [];
    const staffEmail = (req.admin.email || '').toLowerCase();
    const staffId = req.admin.id;

    const filtered = allLocations.filter((loc) => {
      if (assignedIds.includes(loc.id)) return true;
      if (Array.isArray(loc.assignedStaffIds)) {
        return loc.assignedStaffIds.some((s) => String(s).toLowerCase() === staffEmail || String(s) === staffId);
      }
      return false;
    });

    // If staff has specific assignments, only return those; otherwise only stall-type locations
    const allowed = filtered.length > 0 ? filtered : allLocations.filter((l) => l.type === 'STALL');
    return res.json({ success: true, locations: allowed });
  } catch (error) {
    next(error);
  }
});

router.get('/events', listStallEventsEndpoint);
router.get('/settings', getPosSettingsEndpoint);

// Catalog search scoped to stall inventory (effective location auto-derived or verified by middleware)
router.get('/catalog', (req, res, next) => {
  // If staff member has assigned locations and none was passed, default to their primary assigned location
  if (!req.query.stockLocationId && req.admin.role !== 'SUPER_ADMIN' && Array.isArray(req.admin.assignedLocationIds) && req.admin.assignedLocationIds.length > 0) {
    req.query.stockLocationId = req.admin.assignedLocationIds[0];
  }
  return searchPosCatalogEndpoint(req, res, next);
});

// GST-inclusive calculation preview
router.post('/calculate', calculatePosBillEndpoint);

// Finalize bill with atomic stall stock deduction
router.post('/finalize', (req, res, next) => {
  // Derive effective location if missing and staff has assigned location
  if (!req.body.stockLocationId && req.admin.role !== 'SUPER_ADMIN' && Array.isArray(req.admin.assignedLocationIds) && req.admin.assignedLocationIds.length > 0) {
    req.body.stockLocationId = req.admin.assignedLocationIds[0];
  }
  return finalizePosSaleEndpoint(req, res, next);
});

// Bills history for reprints & auditing
router.get('/sales', (req, res, next) => {
  // If Cashier, restrict history to today only for privacy & shift isolation
  if (req.admin.role === 'STALL_CASHIER') {
    const today = new Date().toISOString().split('T')[0];
    req.query.startDate = today;
  }
  return listPosSalesEndpoint(req, res, next);
});

router.get('/sales/:id', getPosSaleEndpoint);

// WhatsApp dispatch
router.post('/whatsapp', sendPosBillWhatsAppEndpoint);

// Stock transfers: Restricted to Stall Managers and Super Admins (Cashiers are NOT authorized)
router.post('/transfers', requireStallAuth(['SUPER_ADMIN', 'STALL_MANAGER']), async (req, res, next) => {
  try {
    const sourceLocationId = req.body.sourceLocationId || req.body.fromLocationId;
    const destinationLocationId = req.body.destinationLocationId || req.body.toLocationId;
    const { items, reason, notes } = req.body;

    if (!sourceLocationId || !destinationLocationId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'sourceLocationId, destinationLocationId, and items are required.',
      });
    }

    // Verify manager has permission to transfer into this destination stall
    if (req.admin.role !== 'SUPER_ADMIN' && Array.isArray(req.admin.assignedLocationIds) && req.admin.assignedLocationIds.length > 0) {
      if (!req.admin.assignedLocationIds.includes(destinationLocationId)) {
        return res.status(403).json({
          error: 'FORBIDDEN_LOCATION',
          message: 'You are only authorized to transfer stock into your assigned stall location.',
        });
      }
    }

    const result = await executeStockTransfer({
      sourceLocationId,
      destinationLocationId,
      items,
      reason: reason || 'Stall stock transfer',
      notes,
      actorEmail: req.admin.email,
      actorId: req.admin.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
