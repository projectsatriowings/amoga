import { Router } from 'express';
import {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  listCustomerOrders,
  getCustomerOrder,
  forgotPasswordCustomer,
  verifyCustomerResetToken,
  resetPasswordCustomer,
  changePasswordCustomer,
} from '../controllers/customerController.js';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import { passwordResetRateLimiter } from '../middleware/authRateLimiter.js';

const router = Router();

// Public customer authentication endpoints
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Password recovery endpoints (Strictly rate-limited)
router.post('/forgot-password', passwordResetRateLimiter, forgotPasswordCustomer);
router.get('/verify-reset-token', passwordResetRateLimiter, verifyCustomerResetToken);
router.post('/reset-password', passwordResetRateLimiter, resetPasswordCustomer);

// Protected customer session endpoints
router.post('/logout', requireCustomerAuth, logoutCustomer);
router.get('/me', requireCustomerAuth, getCustomerProfile);
router.put('/profile', requireCustomerAuth, updateCustomerProfile);
router.post('/change-password', requireCustomerAuth, changePasswordCustomer);

// Address Management
router.get('/addresses', requireCustomerAuth, listAddresses);
router.post('/addresses', requireCustomerAuth, createAddress);
router.put('/addresses/:id', requireCustomerAuth, updateAddress);
router.delete('/addresses/:id', requireCustomerAuth, deleteAddress);
router.patch('/addresses/:id/default', requireCustomerAuth, setDefaultAddress);

// Customer Orders (Strictly scoped to authenticated customer)
router.get('/orders', requireCustomerAuth, listCustomerOrders);
router.get('/orders/:orderReference', requireCustomerAuth, getCustomerOrder);

// Customer Returns & Replacements
import {
  submitReturnEndpoint,
  listCustomerReturnsEndpoint,
  getCustomerReturnDetailEndpoint,
  downloadCustomerEvidenceEndpoint,
} from '../controllers/customerReturnController.js';

router.post('/returns', requireCustomerAuth, submitReturnEndpoint);
router.get('/returns', requireCustomerAuth, listCustomerReturnsEndpoint);
router.get('/returns/:returnReference', requireCustomerAuth, getCustomerReturnDetailEndpoint);
router.get('/returns/:returnReference/evidence/:evidenceId', requireCustomerAuth, downloadCustomerEvidenceEndpoint);

export default router;
