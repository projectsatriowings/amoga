import { Router } from 'express';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
} from '../controllers/adminAuthController.js';
import { getDashboardStats } from '../controllers/adminDashboardController.js';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
} from '../controllers/adminProductsController.js';
import {
  listCollections,
  createCollection,
  updateCollection,
  toggleCollection,
  deleteCollection,
} from '../controllers/adminCollectionsController.js';
import {
  listInventory,
  adjustStock,
  getInventoryLogs,
} from '../controllers/adminInventoryController.js';
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
} from '../controllers/adminOrdersController.js';
import {
  listPayments,
  getPaymentById,
  listPaymentEvents,
} from '../controllers/adminPaymentsController.js';
import {
  listCustomers,
  getCustomerByEmail,
} from '../controllers/adminCustomersController.js';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from '../controllers/adminCouponsController.js';
import { uploadImage } from '../controllers/adminUploadController.js';
import {
  getSalesReport,
  exportCsv,
} from '../controllers/adminReportsController.js';
import {
  getStoreSettings,
  updateStoreSettings,
  listAdminUsers,
  createAdminUser,
  toggleAdminUser,
  listAuditLogs,
  getAuditLogById,
} from '../controllers/adminSettingsController.js';
import {
  listInquiries,
  getInquiryById,
  updateInquiryStatus,
  updateInquiryNotes,
  assignInquiry,
} from '../controllers/adminInquiriesController.js';

const router = Router();

// ================= PUBLIC ADMIN AUTH ROUTES =================
router.post('/auth/login', loginAdmin);

// ================= PROTECTED ADMIN ROUTES =================
router.post('/auth/logout', requireAdminAuth(), logoutAdmin);
router.get('/auth/me', requireAdminAuth(), getAdminProfile);

// 0. Asset Uploads (Catalogue & Content Managers)
router.post('/upload', requireAdminAuth(['CATALOGUE_MANAGER', 'CONTENT_MANAGER']), uploadImage);

// 1. Dashboard Overview
router.get('/dashboard/stats', requireAdminAuth(), getDashboardStats);

// 2. Products & Variants (Catalogue & Super Admin)
router.get('/products', requireAdminAuth(), listProducts);
router.get('/products/:id', requireAdminAuth(), getProductById);
router.post('/products', requireAdminAuth(['CATALOGUE_MANAGER']), createProduct);
router.put('/products/:id', requireAdminAuth(['CATALOGUE_MANAGER']), updateProduct);
router.patch('/products/:id/archive', requireAdminAuth(['CATALOGUE_MANAGER']), archiveProduct);
router.patch('/products/:id/restore', requireAdminAuth(['CATALOGUE_MANAGER']), restoreProduct);

// 3. Collections (Catalogue & Super Admin)
router.get('/collections', requireAdminAuth(), listCollections);
router.post('/collections', requireAdminAuth(['CATALOGUE_MANAGER']), createCollection);
router.put('/collections/:id', requireAdminAuth(['CATALOGUE_MANAGER']), updateCollection);
router.patch('/collections/:id/toggle', requireAdminAuth(['CATALOGUE_MANAGER']), toggleCollection);
router.delete('/collections/:id', requireAdminAuth(['CATALOGUE_MANAGER']), deleteCollection);

// 4. Inventory (Catalogue, Order Manager & Super Admin)
router.get('/inventory', requireAdminAuth(), listInventory);
router.post('/inventory/adjust', requireAdminAuth(['CATALOGUE_MANAGER', 'ORDER_MANAGER']), adjustStock);
router.get('/inventory/logs', requireAdminAuth(), getInventoryLogs);

// 5. Orders & Fulfilment (Order Manager & Super Admin)
router.get('/orders', requireAdminAuth(), listOrders);
router.get('/orders/:id', requireAdminAuth(), getOrderById);
router.patch('/orders/:id/status', requireAdminAuth(['ORDER_MANAGER']), updateOrderStatus);
router.patch('/orders/:id/tracking', requireAdminAuth(['ORDER_MANAGER']), updateOrderTracking);

// 6. Payments (Order Manager & Super Admin)
router.get('/payments', requireAdminAuth(), listPayments);
router.get('/payments/events', requireAdminAuth(), listPaymentEvents);
router.get('/payments/:id', requireAdminAuth(), getPaymentById);

// 7. Customers (Order Manager & Super Admin)
router.get('/customers', requireAdminAuth(), listCustomers);
router.get('/customers/:email', requireAdminAuth(), getCustomerByEmail);

// 7.5 Customer Inquiries (Order Manager, Content Manager & Super Admin)
router.get('/inquiries', requireAdminAuth(['ORDER_MANAGER', 'CONTENT_MANAGER']), listInquiries);
router.get('/inquiries/:id', requireAdminAuth(['ORDER_MANAGER', 'CONTENT_MANAGER']), getInquiryById);
router.patch('/inquiries/:id/status', requireAdminAuth(['ORDER_MANAGER', 'CONTENT_MANAGER']), updateInquiryStatus);
router.patch('/inquiries/:id/notes', requireAdminAuth(['ORDER_MANAGER', 'CONTENT_MANAGER']), updateInquiryNotes);
router.patch('/inquiries/:id/assign', requireAdminAuth(['ORDER_MANAGER', 'CONTENT_MANAGER']), assignInquiry);

// 8. Promotions & Coupons (Content Manager & Super Admin)
router.get('/coupons', requireAdminAuth(), listCoupons);
router.post('/coupons', requireAdminAuth(['CONTENT_MANAGER']), createCoupon);
router.put('/coupons/:id', requireAdminAuth(['CONTENT_MANAGER']), updateCoupon);
router.patch('/coupons/:id/toggle', requireAdminAuth(['CONTENT_MANAGER']), toggleCoupon);
router.delete('/coupons/:id', requireAdminAuth(['CONTENT_MANAGER']), deleteCoupon);

// 10. Reports & Exports (Super Admin, Order Manager)
router.get('/reports/sales', requireAdminAuth(['ORDER_MANAGER']), getSalesReport);
router.get('/reports/export', requireAdminAuth(['ORDER_MANAGER']), exportCsv);

// 11. Settings, Users & Audit Logs
router.get('/settings', requireAdminAuth(), getStoreSettings);
router.put('/settings', requireAdminAuth(['SUPER_ADMIN']), updateStoreSettings);
router.get('/users', requireAdminAuth(['SUPER_ADMIN']), listAdminUsers);
router.post('/users', requireAdminAuth(['SUPER_ADMIN']), createAdminUser);
router.patch('/users/:id/toggle', requireAdminAuth(['SUPER_ADMIN']), toggleAdminUser);
router.get('/audit-logs', requireAdminAuth(['SUPER_ADMIN']), listAuditLogs);
router.get('/audit-logs/:id', requireAdminAuth(['SUPER_ADMIN']), getAuditLogById);

export default router;
