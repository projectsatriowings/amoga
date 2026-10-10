import { prisma } from '../config/prisma.js';

export async function listCustomers(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Group orders by customerEmail to derive customer profiles
    const emailGroups = await prisma.order.groupBy({
      by: ['customerEmail'],
      _count: { id: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
      _min: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
    });

    let customers = [];

    // For each customer group, fetch the most recent customer details
    for (const group of emailGroups) {
      const latestOrder = await prisma.order.findFirst({
        where: { customerEmail: group.customerEmail },
        orderBy: { createdAt: 'desc' },
        select: {
          customerName: true,
          customerPhone: true,
          city: true,
          state: true,
          pincode: true,
        },
      });

      if (latestOrder) {
        customers.push({
          email: group.customerEmail,
          name: latestOrder.customerName,
          phone: latestOrder.customerPhone,
          city: latestOrder.city,
          state: latestOrder.state,
          pincode: latestOrder.pincode,
          totalOrders: group._count.id,
          totalSpent: group._sum.totalAmount ? Number(group._sum.totalAmount) : 0,
          firstOrderAt: group._min.createdAt,
          lastOrderAt: group._max.createdAt,
        });
      }
    }

    // Filter by search query if present
    if (q && q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm) ||
          c.phone.toLowerCase().includes(searchTerm) ||
          c.city.toLowerCase().includes(searchTerm)
      );
    }

    const total = customers.length;
    const paginated = customers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      customers: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST CUSTOMERS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve customers list',
    });
  }
}

export async function getCustomerByEmail(req, res) {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Email is required' });
    }

    const cleanEmail = decodeURIComponent(email).trim().toLowerCase();

    const orders = await prisma.order.findMany({
      where: { customerEmail: { equals: cleanEmail, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: true,
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No orders found for this customer email',
      });
    }

    const latest = orders[0];
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return res.status(200).json({
      success: true,
      customer: {
        email: cleanEmail,
        name: latest.customerName,
        phone: latest.customerPhone,
        addressLine1: latest.addressLine1,
        addressLine2: latest.addressLine2,
        city: latest.city,
        state: latest.state,
        pincode: latest.pincode,
        totalOrders: orders.length,
        totalSpent: Number(totalSpent.toFixed(2)),
        orders: orders.map((o) => ({
          id: o.id,
          orderReference: o.orderReference,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalAmount: Number(o.totalAmount),
          createdAt: o.createdAt,
          itemsCount: o.items.length,
        })),
      },
    });
  } catch (err) {
    console.error('[ADMIN GET CUSTOMER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve customer details',
    });
  }
}
