import {
  submitCustomerReturnRequest,
  listCustomerReturns,
  getReturnRequestByRef,
} from '../services/returnService.js';
import { getEvidenceFilePath } from '../services/evidenceStorageService.js';
import { prisma } from '../config/prisma.js';
import fs from 'fs';

/**
 * Customer Endpoint: Submit Return or Replacement Request
 */
export async function submitReturnEndpoint(req, res, next) {
  try {
    const customerId = req.customer?.id || null;
    const customerEmail = req.customer?.email || req.body.customerEmail;

    const {
      orderReference,
      reason,
      resolutionPreference,
      resolutionType,
      description,
      customerNote,
      items,
      evidenceFiles,
      evidence,
    } = req.body || {};

    const createdReturn = await submitCustomerReturnRequest({
      orderReference,
      customerId,
      customerEmail,
      reason,
      resolutionPreference: resolutionPreference || resolutionType || 'REPLACEMENT',
      description: customerNote || description || '',
      items,
      evidenceFiles: evidenceFiles || evidence || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Return and replacement request submitted successfully for atelier review.',
      returnRequest: createdReturn,
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message && !err.message.includes('Internal') ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      error: err.code || 'BAD_REQUEST',
      message: err.message,
    });
  }
}

/**
 * Customer Endpoint: List All Returns for Authenticated Customer
 */
export async function listCustomerReturnsEndpoint(req, res, next) {
  try {
    const customerId = req.customer?.id;
    const customerEmail = req.customer?.email;

    const returns = await listCustomerReturns({ customerId, customerEmail });
    return res.status(200).json({
      success: true,
      returns,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer Endpoint: Get Return Details by Reference
 */
export async function getCustomerReturnDetailEndpoint(req, res, next) {
  try {
    const { returnReference } = req.params;
    const customerId = req.customer?.id;
    const customerEmail = req.customer?.email;

    const returnReq = await getReturnRequestByRef(returnReference, {
      customerId,
      customerEmail,
      isAdmin: false,
    });

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Return request ${returnReference} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      returnRequest: returnReq,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: 'FORBIDDEN',
        message: err.message,
      });
    }
    next(err);
  }
}

/**
 * Customer Endpoint: Secure Evidence File Streaming
 * Verifies customer owns the request before streaming private photo/video bytes
 */
export async function downloadCustomerEvidenceEndpoint(req, res, next) {
  try {
    const { returnReference, evidenceId } = req.params;
    const customerId = req.customer?.id;
    const customerEmail = req.customer?.email;

    // 1. Ownership check on ReturnRequest
    const returnReq = await getReturnRequestByRef(returnReference, {
      customerId,
      customerEmail,
      isAdmin: false,
    });

    if (!returnReq) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Return request not found' });
    }

    // 2. Fetch evidence metadata
    const evidence = await prisma.returnEvidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence || evidence.returnRequestId !== returnReq.id) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Evidence file not found' });
    }

    // 3. Resolve private disk path safely
    const filePath = getEvidenceFilePath(evidence.storageKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND', message: 'Stored evidence file is missing' });
    }

    // 4. Stream response with private headers
    res.setHeader('Content-Type', evidence.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${evidence.fileName}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: 'FORBIDDEN', message: err.message });
    }
    next(err);
  }
}
