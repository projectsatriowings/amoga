import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

const reviewSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().min(5, 'Review must be at least 5 characters').max(2000, 'Review cannot exceed 2000 characters'),
  authorName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  orderReference: z.string().trim().optional(),
});

function sanitizeAuthorName(name) {
  if (!name || typeof name !== 'string') return 'Verified Patron';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Recalculate average rating and review count from approved reviews and update Product record
 */
async function updateProductRatingAggregate(productId) {
  try {
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      select: { rating: true },
    });

    const total = approvedReviews.length;
    let avg = null;
    if (total > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Math.round((sum / total) * 10) / 10;
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avg,
        reviewCount: total,
      },
    });
  } catch (err) {
    console.error(`Failed to update rating aggregate for product ${productId}:`, err);
  }
}

/**
 * GET /api/reviews/product/:productId
 * Public endpoint to retrieve approved reviews, rating aggregates, and authenticated customer's own review
 */
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;

    // Find product by id, sourceId, or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { sourceId: productId }, { slug: productId }],
      },
      select: { id: true, name: true, slug: true, rating: true, reviewCount: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    // Fetch approved reviews
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        content: true,
        isVerifiedBuyer: true,
        createdAt: true,
      },
    });

    // Rating breakdown distribution
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach((r) => {
      if (ratingBreakdown[r.rating] !== undefined) {
        ratingBreakdown[r.rating] += 1;
      }
    });

    const totalReviews = approvedReviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Math.round((sum / totalReviews) * 10) / 10;
    }

    // Format reviews for public consumption (sanitized author names)
    const formattedReviews = approvedReviews.map((r) => ({
      id: r.id,
      authorName: sanitizeAuthorName(r.authorName),
      rating: r.rating,
      title: r.title,
      content: r.content,
      isVerifiedBuyer: r.isVerifiedBuyer,
      createdAt: r.createdAt,
    }));

    // If customer is signed in, check if they have submitted a review
    let myReview = null;
    if (req.customer) {
      const existing = await prisma.review.findFirst({
        where: {
          productId: product.id,
          customerId: req.customer.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        myReview = {
          id: existing.id,
          authorName: existing.authorName,
          rating: existing.rating,
          title: existing.title,
          content: existing.content,
          status: existing.status,
          isVerifiedBuyer: existing.isVerifiedBuyer,
          moderationNotes: existing.moderationNotes,
          createdAt: existing.createdAt,
        };
      }
    }

    return res.status(200).json({
      success: true,
      aggregate: {
        averageRating,
        totalReviews,
        ratingBreakdown,
      },
      reviews: formattedReviews,
      myReview,
    });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve product reviews',
    });
  }
}

/**
 * POST /api/reviews/product/:productId
 * Submit a customer review
 */
export async function submitProductReview(req, res) {
  try {
    const { productId } = req.params;

    const parseResult = reviewSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid review data',
      });
    }

    const { rating, title, content, authorName, orderReference } = parseResult.data;

    // Resolve real product in database
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { sourceId: productId }, { slug: productId }],
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    const customerId = req.customer?.id || null;

    // Check duplicate review policy: one review per customer per product
    if (customerId) {
      const existing = await prisma.review.findFirst({
        where: {
          productId: product.id,
          customerId,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_REVIEW',
          message: 'You have already submitted a review for this piece. Your review status is currently: ' + existing.status,
          reviewId: existing.id,
        });
      }
    }

    // Verify buyer status: check if customer has confirmed/dispatched/delivered order with this product
    let isVerifiedBuyer = false;
    if (customerId) {
      const customerOrdersWithProduct = await prisma.order.findFirst({
        where: {
          customerId,
          status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] },
          items: {
            some: { productId: product.id },
          },
        },
      });
      if (customerOrdersWithProduct) isVerifiedBuyer = true;
    }

    // If order reference is supplied, verify it
    if (!isVerifiedBuyer && orderReference) {
      const order = await prisma.order.findFirst({
        where: {
          orderReference: orderReference.trim(),
          status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] },
          items: {
            some: { productId: product.id },
          },
        },
      });
      if (order) isVerifiedBuyer = true;
    }

    // Create review with PENDING status for moderation
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        customerId,
        authorName: authorName.trim(),
        rating,
        title: title ? title.trim() : null,
        content: content.trim(),
        status: 'PENDING',
        isVerifiedBuyer,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you. Your review has been submitted for verification and will appear after moderation.',
      review: {
        id: review.id,
        rating: review.rating,
        status: review.status,
        isVerifiedBuyer: review.isVerifiedBuyer,
        createdAt: review.createdAt,
      },
    });
  } catch (err) {
    console.error('Error submitting product review:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to submit product review',
    });
  }
}

/**
 * GET /api/admin/reviews
 * Admin endpoint to list and search all reviews
 */
export async function adminListReviews(req, res) {
  try {
    const { status = 'ALL', page = '1', limit = '20', q } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (q && q.trim()) {
      const search = q.trim();
      where.OR = [
        { authorName: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, slug: true, collectionId: true, image: true },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error in adminListReviews:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve reviews for administration',
    });
  }
}

/**
 * PATCH /api/admin/reviews/:id/status
 * Admin moderation endpoint to approve or reject a review
 */
export async function adminModerateReview(req, res) {
  try {
    const { id } = req.params;
    const { status, moderationNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Status must be APPROVED, REJECTED, or PENDING',
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'REVIEW_NOT_FOUND',
        message: 'Review record not found',
      });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status,
        moderationNotes: moderationNotes !== undefined ? moderationNotes : review.moderationNotes,
      },
    });

    // Update aggregate on product
    await updateProductRatingAggregate(review.productId);

    // Audit log
    await logAdminAction(
      req,
      'MODERATE_REVIEW',
      'Review',
      id,
      { previousStatus: review.status, newStatus: status, moderationNotes },
      `Review ${status.toLowerCase()} by admin staff`
    );

    return res.status(200).json({
      success: true,
      message: `Review has been marked as ${status}`,
      review: updated,
    });
  } catch (err) {
    console.error('Error in adminModerateReview:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update review moderation status',
    });
  }
}
