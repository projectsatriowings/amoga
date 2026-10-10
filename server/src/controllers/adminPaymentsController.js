import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listPayments(req, res) {
  try {
    const {
      status,
      provider,
      orderReference,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (provider && provider !== 'ALL') where.provider = provider;
    if (orderReference && orderReference.trim()) {
      where.order = {
        orderReference: { contains: orderReference.trim(), mode: 'insensitive' },
      };
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderReference: true,
              customerName: true,
              customerEmail: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST PAYMENTS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve payments list',
    });
  }
}

export async function getPaymentById(req, res) {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    // Retrieve associated webhook events
    const events = await prisma.paymentEvent.findMany({
      where: {
        OR: [
          { paymentId: payment.id },
          { orderId: payment.orderId },
          { orderReference: payment.order?.orderReference },
        ],
      },
      orderBy: { receivedAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      payment: {
        ...payment,
        amount: Number(payment.amount),
        order: payment.order
          ? {
              ...payment.order,
              totalAmount: Number(payment.order.totalAmount),
              subtotal: Number(payment.order.subtotal),
            }
          : null,
      },
      events,
    });
  } catch (err) {
    console.error('[ADMIN GET PAYMENT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve payment details',
    });
  }
}

export async function listPaymentEvents(req, res) {
  try {
    const { page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [total, events] = await Promise.all([
      prisma.paymentEvent.count(),
      prisma.paymentEvent.findMany({
        skip,
        take: limitNum,
        orderBy: { receivedAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST PAYMENT EVENTS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve payment events',
    });
  }
}
