import { z } from 'zod';

export const contactSubmissionSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Please enter a valid email address')
    .max(120, 'Email address cannot exceed 120 characters'),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const cleaned = val.replace(/[\s\-()]/g, '');
        return /^(?:\+?\d{1,3})?[6-9]\d{9}$|^\+?\d{7,15}$/.test(cleaned);
      },
      {
        message: 'Please provide a valid contact phone number',
      }
    ),
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(150, 'Subject cannot exceed 150 characters'),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
  collectionId: z.string().trim().max(50).optional().nullable(),
});
