import {
  listAdminReturnRequests,
  getReturnRequestByRef,
  updateAdminReturnWorkflow,
} from '../services/returnService.js';
import { getEvidenceFilePath } from '../services/evidenceStorageService.js';
import { prisma } from '../config/prisma.js';
import fs from 'fs';

/**
 * Admin: List return and replacement requests
 */
export async function listAdminReturnsEndpoint(req, res, next) {
  try {
    const { status, reason, search, page = 1, limit = 25 } = req.query;

    const result = await listAdminReturnRequests({
      status,
      reason,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
      returnRequests: result.requests || [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get single return request by reference or ID
 */
export async function getAdminReturnDetailEndpoint(req, res, next) {
  try {
    const { refOrId } = req.params;

    let returnReq = await prisma.returnRequest.findFirst({
      where: {
        OR: [{ id: refOrId }, { returnReference: refOrId }],
      },
      include: {
        order: {
          include: {
            items: true,
            trackingEvents: { orderBy: { createdAt: 'desc' } },
          },
        },
        items: {
          include: {
            orderItem: true,
          },
        },
        evidences: {
          select: {
            id: true,
            fileType: true,
            mimeType: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Return request ${refOrId} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      returnRequest: returnReq,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Advance return workflow state (approve, reject, schedule pickup, inspect, refund, restock)
 */
export async function updateAdminReturnWorkflowEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const adminUser = req.admin;

    const updated = await updateAdminReturnWorkflow(id, adminUser, req.body);

    return res.status(200).json({
      success: true,
      message: `Return request status updated to ${updated.status}`,
      returnRequest: updated,
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message && !err.message.includes('Internal') ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
    });
  }
}

/**
 * Admin: Securely download/view evidence file
 */
export async function downloadAdminEvidenceEndpoint(req, res, next) {
  try {
    const { id, evidenceId } = req.params;

    const evidence = await prisma.returnEvidence.findUnique({
      where: { id: evidenceId },
      include: { returnRequest: true },
    });

    if (!evidence || (evidence.returnRequestId !== id && evidence.returnRequest?.returnReference !== id)) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Evidence attachment not found for this return request',
      });
    }

    const filePath = getEvidenceFilePath(evidence.storageKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'Evidence file is missing on server storage',
      });
    }

    res.setHeader('Content-Type', evidence.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${evidence.fileName}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}
