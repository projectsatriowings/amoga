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

    // Safely persist inquiry in audit_logs for staff without changing core commerce schema
    try {
      await prisma.auditLog.create({
        data: {
          adminEmail: email,
          action: 'CUSTOMER_INQUIRY',
          entityType: 'ContactInquiry',
          entityId: inquiryReference,
          details: {
            inquiryReference,
            fullName,
            email,
            phone: phone || null,
            subject,
            message,
            collectionId: collectionId || 'general',
            userAgent: req.headers['user-agent']?.slice(0, 200) || 'unknown',
            ip: req.ip || 'unknown',
            submittedAt: new Date().toISOString(),
          },
        },
      });
    } catch (dbErr) {
      // Non-fatal logging to ensure contact submission response succeeds even if audit logging encounters an issue
      console.warn('[Contact] Inquiry persistence warning:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out. Your enquiry has been received by our concierge desk.',
      inquiryReference,
    });
  } catch (error) {
    next(error);
  }
};
