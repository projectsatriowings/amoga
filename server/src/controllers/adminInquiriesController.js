import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

/**
 * List customer inquiries with comprehensive search, status filtering, and pagination
 */
export async function listInquiries(req, res) {
  try {
    const {
      status,
      collectionId,
      search,
      startDate,
      endDate,
      sort = 'desc',
      page = 1,
      limit = 15,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (collectionId && collectionId !== 'ALL') {
      where.collectionId = collectionId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.createdAt.lte = e;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, inquiries, newCount, inProgressCount, resolvedCount] = await Promise.all([
      prisma.customerInquiry.count({ where }),
      prisma.customerInquiry.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
      }),
      prisma.customerInquiry.count({ where: { status: 'NEW' } }),
      prisma.customerInquiry.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.customerInquiry.count({ where: { status: 'RESOLVED' } }),
    ]);

    return res.status(200).json({
      success: true,
      inquiries,
      stats: {
        totalAllTime: newCount + inProgressCount + resolvedCount,
        newCount,
        inProgressCount,
        resolvedCount,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST INQUIRIES ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve customer inquiries',
    });
  }
}

/**
 * Get single inquiry by ID with its audit history
 */
export async function getInquiryById(req, res) {
  try {
    const { id } = req.params;
    const inquiry = await prisma.customerInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Inquiry not found' });
    }

    // Fetch related audit log entries for this inquiry
    const history = await prisma.auditLog.findMany({
      where: {
        entityType: 'CustomerInquiry',
        entityId: inquiry.reference,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.status(200).json({
      success: true,
      inquiry,
      history,
    });
  } catch (err) {
    console.error('[ADMIN GET INQUIRY ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve inquiry details',
    });
  }
}

/**
 * Update inquiry status with server validation and Audit Trail logging
 */
export async function updateInquiryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.customerInquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Inquiry not found' });
    }

    const previousStatus = existing.status;
    const resolvedAt = status === 'RESOLVED' ? new Date() : null;

    const updated = await prisma.customerInquiry.update({
      where: { id },
      data: {
        status,
        resolvedAt,
      },
    });

    // Record status transition in AuditLog
    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: 'INQUIRY_STATUS_CHANGE',
      entityType: 'CustomerInquiry',
      entityId: existing.reference,
      details: {
        inquiryId: existing.id,
        inquiryReference: existing.reference,
        customerName: existing.fullName,
        previousStatus,
        newStatus: status,
        changedAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      inquiry: updated,
      message: `Inquiry marked as ${status.replace('_', ' ')}`,
    });
  } catch (err) {
    console.error('[ADMIN UPDATE INQUIRY STATUS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update inquiry status',
    });
  }
}

/**
 * Add or update internal staff notes on an inquiry
 */
export async function updateInquiryNotes(req, res) {
  try {
    const { id } = req.params;
    const { internalNotes } = req.body;

    const existing = await prisma.customerInquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Inquiry not found' });
    }

    const updated = await prisma.customerInquiry.update({
      where: { id },
      data: {
        internalNotes: internalNotes ? internalNotes.trim() : null,
      },
    });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: 'INQUIRY_NOTES_UPDATE',
      entityType: 'CustomerInquiry',
      entityId: existing.reference,
      details: {
        inquiryId: existing.id,
        inquiryReference: existing.reference,
        hasNotes: Boolean(updated.internalNotes),
      },
    });

    return res.status(200).json({
      success: true,
      inquiry: updated,
      message: 'Internal notes saved',
    });
  } catch (err) {
    console.error('[ADMIN UPDATE INQUIRY NOTES ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update internal notes',
    });
  }
}

/**
 * Assign staff member to inquiry
 */
export async function assignInquiry(req, res) {
  try {
    const { id } = req.params;
    const { assignedAdminId, assignedAdminEmail } = req.body;

    const existing = await prisma.customerInquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Inquiry not found' });
    }

    const updated = await prisma.customerInquiry.update({
      where: { id },
      data: {
        assignedAdminId: assignedAdminId || null,
        assignedAdminEmail: assignedAdminEmail ? assignedAdminEmail.trim() : null,
      },
    });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: 'INQUIRY_ASSIGNMENT',
      entityType: 'CustomerInquiry',
      entityId: existing.reference,
      details: {
        inquiryId: existing.id,
        inquiryReference: existing.reference,
        assignedAdminEmail: updated.assignedAdminEmail,
      },
    });

    return res.status(200).json({
      success: true,
      inquiry: updated,
      message: 'Inquiry assignment updated',
    });
  } catch (err) {
    console.error('[ADMIN ASSIGN INQUIRY ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to assign inquiry',
    });
  }
}
