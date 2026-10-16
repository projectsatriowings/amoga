import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import { handleOrderCancellation, commitReservation, confirmOrderReservation } from '../services/inventoryService.js';

// Enforce valid finite-state machine transitions for orders
const VALID_TRANSITIONS = {
  PENDING_PAYMENT: ['CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'DISPATCHED', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export async function listOrders(req, res) {
  try {
    const {
      q,
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
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

    if (q && q.trim()) {
      const search = q.trim();
      where.OR = [
        { orderReference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sortField = ['createdAt', 'totalAmount', 'orderReference'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentReference: true,
              provider: true,
              amount: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        shippingAmount: Number(o.shippingAmount),
        taxAmount: Number(o.taxAmount),
        discountAmount: Number(o.discountAmount),
        totalAmount: Number(o.totalAmount),
        items: o.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
        payments: o.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST ORDERS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve orders list',
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { slug: true, collectionId: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        subtotal: Number(order.subtotal),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
        payments: order.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        trackingEvents: order.trackingEvents || [],
      },
      allowedNextStatuses: VALID_TRANSITIONS[order.status] || [],
    });
  } catch (err) {
    console.error('[ADMIN GET ORDER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve order details',
    });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status: targetStatus, reason } = req.body;

    if (!targetStatus) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Target status is required',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      return res.status(422).json({
        error: 'INVALID_TRANSITION',
        message: `Cannot transition order from "${currentStatus}" to "${targetStatus}". Allowed next states: ${allowedTransitions.join(', ') || 'None (terminal)'}`,
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: targetStatus },
    });

    if (targetStatus === 'CONFIRMED') {
      await confirmOrderReservation({
        orderId: order.id,
        orderReference: order.orderReference,
        actor: req.admin ? `ADMIN: ${req.admin.email}` : 'SYSTEM',
      }).catch((err) => console.warn('[INVENTORY ORDER CONFIRMATION ERROR]:', err.message));
    }

    if (targetStatus === 'DISPATCHED') {
      await commitReservation({
        orderId: order.id,
        orderReference: order.orderReference,
        actor: req.admin ? `ADMIN: ${req.admin.email}` : 'SYSTEM',
        type: 'FULFILMENT',
      }).catch((err) => console.warn('[INVENTORY ORDER DISPATCH FULFILLMENT ERROR]:', err.message));
    }

    if (targetStatus === 'CANCELLED') {
      await handleOrderCancellation({
        orderId: order.id,
        admin: req.admin,
        reason: reason?.trim() || 'Admin cancelled order',
        restockPhysical: req.body.restockPhysical === true || currentStatus === 'DISPATCHED' || currentStatus === 'DELIVERED',
      }).catch((err) => console.warn('[INVENTORY ORDER CANCELLATION ERROR]:', err.message));
    }

    const statusTitles = {
      CONFIRMED: 'Order Confirmed',
      PROCESSING: 'Processing at Atelier',
      DISPATCHED: 'Dispatched with Logistics Partner',
      DELIVERED: 'Delivered to Customer',
      CANCELLED: 'Order Cancelled',
    };

    // Record formal tracking event in database
    await prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        status: targetStatus,
        title: statusTitles[targetStatus] || `Order ${targetStatus}`,
        description: reason?.trim() || `Status updated to ${targetStatus} by concierge staff.`,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        actor: req.admin.email,
      },
    }).catch((err) => console.warn('[ADMIN ORDER TRACKING EVENT ERROR]:', err.message));

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'ORDER_STATUS_CHANGE',
      entityType: 'Order',
      entityId: order.orderReference,
      details: {
        from: currentStatus,
        to: targetStatus,
        reason: reason || 'Operational status progression',
      },
    });

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderReference} moved to ${targetStatus}`,
      order: {
        id: updated.id,
        orderReference: updated.orderReference,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error('[ADMIN UPDATE ORDER STATUS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update order status',
    });
  }
}

export async function updateOrderTracking(req, res) {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, trackingUrl } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        carrier: carrier !== undefined ? (carrier ? carrier.trim() : null) : order.carrier,
        trackingNumber: trackingNumber !== undefined ? (trackingNumber ? trackingNumber.trim() : null) : order.trackingNumber,
        trackingUrl: trackingUrl !== undefined ? (trackingUrl ? trackingUrl.trim() : null) : order.trackingUrl,
      },
    });

    // Record tracking update event
    await prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        status: order.status,
        title: 'Logistics Details Updated',
        description: `Carrier set to ${carrier || order.carrier || 'Unassigned'}, Waybill: ${trackingNumber || order.trackingNumber || 'Unassigned'}`,
        carrier: updated.carrier,
        trackingNumber: updated.trackingNumber,
        actor: req.admin.email,
      },
    }).catch(() => {});

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'ORDER_TRACKING_UPDATE',
      entityType: 'Order',
      entityId: order.orderReference,
      details: { carrier: updated.carrier, trackingNumber: updated.trackingNumber, trackingUrl: updated.trackingUrl },
    });

    return res.status(200).json({
      success: true,
      message: 'Tracking details updated',
      order: {
        id: updated.id,
        carrier: updated.carrier,
        trackingNumber: updated.trackingNumber,
        trackingUrl: updated.trackingUrl,
      },
    });
  } catch (err) {
    console.error('[ADMIN UPDATE TRACKING ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update order tracking',
    });
  }
}

export async function getOrderInvoice(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderReference: id }],
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const { renderInvoiceHtml } = await import('../services/invoiceService.js');
    const html = renderInvoiceHtml(order);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[ADMIN GET INVOICE ERROR]:', err);
    return res.status(500).send('Failed to generate invoice');
  }
}

