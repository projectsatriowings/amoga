import { contactSubmissionSchema } from '../schemas/contactSchemas.js';
import { prisma } from '../config/prisma.js';

/**
 * Handle public customer inquiry / contact form submission
 * Validates fields on server, records inquiry safely in AuditLog for staff review,
 * and returns success feedback with reference.
 */
export const submitContactForm = async (req, res, next) => {
  try {
    const parseResult = contactSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { fullName, email, phone, subject, message, collectionId } = parseResult.data;
    const inquiryReference = `INQ-${Date.now().toString(36).toUpperCase()}`;

    // 1. Persist directly in dedicated customer_inquiries database model
    const inquiry = await prisma.customerInquiry.create({
      data: {
        reference: inquiryReference,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
        collectionId: collectionId || 'general',
        status: 'NEW',
      },
    });

    // 2. Log in append-only AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          adminEmail: email.trim().toLowerCase(),
          action: 'CUSTOMER_INQUIRY',
          entityType: 'CustomerInquiry',
          entityId: inquiry.reference,
          status: 'SUCCESS',
          details: {
            inquiryReference: inquiry.reference,
            inquiryId: inquiry.id,
            fullName: inquiry.fullName,
            email: inquiry.email,
            phone: inquiry.phone,
            subject: inquiry.subject,
            collectionId: inquiry.collectionId,
            userAgent: req.headers['user-agent']?.slice(0, 200) || 'unknown',
            ip: req.ip || 'unknown',
            submittedAt: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr) {
      console.warn('[Contact] Audit logging warning:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out. Your enquiry has been received by our concierge desk.',
      inquiryReference: inquiry.reference,
      inquiryId: inquiry.id,
    });
  } catch (error) {
    next(error);
  }
};
