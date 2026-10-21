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
  getNextSkuPreview,
  validateSkuEndpoint,
} from '../controllers/adminProductsController.js';
import {
  downloadTemplate,
  validateWorkbook,
  executeImport,
  downloadErrorReport,
} from '../controllers/adminProductImportController.js';
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
  updateThreshold,
  listRestockSubscriptions,
  getInventoryAlerts,
} from '../controllers/adminInventoryController.js';
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getOrderInvoice,
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
  sendStaffResetLink,
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
import {
  searchHsnEndpoint,
  listRateMasterEndpoint,
  createRateMasterEndpoint,
  updateRateMasterEndpoint,
  deactivateRateMasterEndpoint,
  verifyProductTaxEndpoint,
} from '../controllers/adminTaxController.js';
import {
  searchPosCatalogEndpoint,
  calculatePosBillEndpoint,
  finalizePosSaleEndpoint,
  listPosSalesEndpoint,
  getPosSaleEndpoint,
  cancelPosSaleEndpoint,
  refundPosSaleEndpoint,
  sendPosBillWhatsAppEndpoint,
  getPosSalesReportEndpoint,
  listStallEventsEndpoint,
  createStallEventEndpoint,
  updateStallEventEndpoint,
  deleteStallEventEndpoint,
  setDefaultStallEndpoint,
  getPosSettingsEndpoint,
  updatePosSettingsEndpoint,
} from '../controllers/adminPosController.js';
import {
  listLocationsEndpoint,
  createLocationEndpoint,
  updateLocationEndpoint,
  toggleLocationActiveEndpoint,
  getLocationInventoryEndpoint,
  adjustStockEndpoint,
  executeStockTransferEndpoint,
  listTransfersEndpoint,
  listMovementLogsEndpoint,
  getInventoryReportEndpoint,
} from '../controllers/stallInventoryController.js';

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
router.get('/products/sku/generate', requireAdminAuth(['CATALOGUE_MANAGER']), getNextSkuPreview);
router.post('/products/sku/validate', requireAdminAuth(['CATALOGUE_MANAGER']), validateSkuEndpoint);
router.get('/products/import/template', requireAdminAuth(['CATALOGUE_MANAGER']), downloadTemplate);
router.post('/products/import/validate', requireAdminAuth(['CATALOGUE_MANAGER']), validateWorkbook);
router.post('/products/import/execute', requireAdminAuth(['CATALOGUE_MANAGER']), executeImport);
router.post('/products/import/error-report', requireAdminAuth(['CATALOGUE_MANAGER']), downloadErrorReport);
router.get('/products/:id', requireAdminAuth(), getProductById);
router.post('/products', requireAdminAuth(['CATALOGUE_MANAGER']), createProduct);
router.put('/products/:id', requireAdminAuth(['CATALOGUE_MANAGER']), updateProduct);
router.patch('/products/:id/archive', requireAdminAuth(['CATALOGUE_MANAGER']), archiveProduct);
router.patch('/products/:id/restore', requireAdminAuth(['CATALOGUE_MANAGER']), restoreProduct);
router.post('/products/:id/tax-verify', requireAdminAuth(['CATALOGUE_MANAGER']), verifyProductTaxEndpoint);

// 2.5 Assisted GST/HSN Classification & Verified Rate Master (Catalogue & Super Admin)
router.get('/tax/hsn/search', requireAdminAuth(), searchHsnEndpoint);
router.get('/tax/rates', requireAdminAuth(), listRateMasterEndpoint);
router.post('/tax/rates', requireAdminAuth(['CATALOGUE_MANAGER']), createRateMasterEndpoint);
router.put('/tax/rates/:id', requireAdminAuth(['CATALOGUE_MANAGER']), updateRateMasterEndpoint);
router.delete('/tax/rates/:id', requireAdminAuth(['CATALOGUE_MANAGER']), deactivateRateMasterEndpoint);

// 3. Collections (Catalogue & Super Admin)
router.get('/collections', requireAdminAuth(), listCollections);
router.post('/collections', requireAdminAuth(['CATALOGUE_MANAGER']), createCollection);
router.put('/collections/:id', requireAdminAuth(['CATALOGUE_MANAGER']), updateCollection);
router.patch('/collections/:id/toggle', requireAdminAuth(['CATALOGUE_MANAGER']), toggleCollection);
router.delete('/collections/:id', requireAdminAuth(['CATALOGUE_MANAGER']), deleteCollection);

// 4. Inventory (Catalogue, Order Manager & Super Admin)
router.get('/inventory', requireAdminAuth(), listInventory);
router.post('/inventory/adjust', requireAdminAuth(['CATALOGUE_MANAGER', 'ORDER_MANAGER']), adjustStock);
router.put('/inventory/threshold', requireAdminAuth(['CATALOGUE_MANAGER', 'ORDER_MANAGER']), updateThreshold);
router.get('/inventory/logs', requireAdminAuth(), getInventoryLogs);
router.get('/inventory/subscriptions', requireAdminAuth(), listRestockSubscriptions);
router.get('/inventory/alerts', requireAdminAuth(), getInventoryAlerts);

// 5. Orders & Fulfilment (Order Manager & Super Admin)
router.get('/orders', requireAdminAuth(), listOrders);
router.get('/orders/:id', requireAdminAuth(), getOrderById);
router.get('/orders/:id/invoice', requireAdminAuth(['ORDER_MANAGER']), getOrderInvoice);
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

// 10. Reports & Exports (Super Admin, Order Manager)
router.get('/reports/sales', requireAdminAuth(['ORDER_MANAGER']), getSalesReport);
router.get('/reports/export', requireAdminAuth(['ORDER_MANAGER']), exportCsv);

// 11. Settings, Users & Audit Logs
router.get('/settings', requireAdminAuth(), getStoreSettings);
router.put('/settings', requireAdminAuth(['SUPER_ADMIN']), updateStoreSettings);
router.get('/users', requireAdminAuth(['SUPER_ADMIN']), listAdminUsers);
router.post('/users', requireAdminAuth(['SUPER_ADMIN']), createAdminUser);
router.patch('/users/:id/toggle', requireAdminAuth(['SUPER_ADMIN']), toggleAdminUser);
router.post('/users/:id/send-reset-link', requireAdminAuth(['SUPER_ADMIN']), sendStaffResetLink);
router.get('/audit-logs', requireAdminAuth(['SUPER_ADMIN']), listAuditLogs);
router.get('/audit-logs/:id', requireAdminAuth(['SUPER_ADMIN']), getAuditLogById);

// 12. Stall Billing & Point of Sale (POS)
router.get('/pos/catalog', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), searchPosCatalogEndpoint);
router.post('/pos/calculate', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), calculatePosBillEndpoint);
router.post('/pos/sales', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), finalizePosSaleEndpoint);
router.get('/pos/sales', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), listPosSalesEndpoint);
router.get('/pos/sales/:id', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), getPosSaleEndpoint);
router.post('/pos/sales/:id/cancel', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), cancelPosSaleEndpoint);
router.post('/pos/sales/:id/refund', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), refundPosSaleEndpoint);
router.post('/pos/sales/:id/whatsapp', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), sendPosBillWhatsAppEndpoint);
router.get('/pos/reports', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), getPosSalesReportEndpoint);
router.get('/pos/events', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), listStallEventsEndpoint);
router.post('/pos/events', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), createStallEventEndpoint);
router.put('/pos/events/:id', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), updateStallEventEndpoint);
router.delete('/pos/events/:id', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), deleteStallEventEndpoint);
router.post('/pos/events/:id/set-default', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), setDefaultStallEndpoint);
router.get('/pos/settings', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), getPosSettingsEndpoint);
router.put('/pos/settings', requireAdminAuth(['SUPER_ADMIN']), updatePosSettingsEndpoint);

// 13. Stall Management & Stock Locations
router.get('/stall/locations', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), listLocationsEndpoint);
router.post('/stall/locations', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), createLocationEndpoint);
router.put('/stall/locations/:id', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), updateLocationEndpoint);
router.patch('/stall/locations/:id/toggle', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), toggleLocationActiveEndpoint);
router.get('/stall/inventory', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), getLocationInventoryEndpoint);
router.post('/stall/inventory/adjust', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), adjustStockEndpoint);
router.post('/stall/transfers', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), executeStockTransferEndpoint);
router.get('/stall/transfers', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), listTransfersEndpoint);
router.get('/stall/movements', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER', 'CATALOGUE_MANAGER']), listMovementLogsEndpoint);
router.get('/stall/reports', requireAdminAuth(['SUPER_ADMIN', 'ORDER_MANAGER']), getInventoryReportEndpoint);

export default router;
