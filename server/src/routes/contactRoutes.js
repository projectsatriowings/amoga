import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController.js';
import { contactRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', contactRateLimiter, submitContactForm);

export default router;
