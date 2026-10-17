import { Router } from 'express';
import { getPublicReceiptEndpoint } from '../controllers/adminPosController.js';

const router = Router();

// Publicly accessible customer receipt endpoint by cryptographically unguessable token
router.get('/receipt/:token', getPublicReceiptEndpoint);

export default router;
