import { prisma } from '../config/prisma.js';
import {
  hashPassword,
  verifyPassword,
  generateCustomerSessionToken,
  hashCustomerSessionToken,
} from '../utils/customerAuth.js';

const SESSION_DURATION_DAYS = 30;

function getSessionExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DURATION_DAYS);
  return d;
}

/**
 * Register a new customer
 */
export async function registerCustomer(req, res) {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'A valid email address is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters in length.',
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'NAME_REQUIRED',
        message: 'Full customer name is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    const passwordHash = hashPassword(password);
    const customer = await prisma.customer.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    // Auto-link any prior orders made with this email address
    await prisma.order
      .updateMany({
        where: { customerEmail: cleanEmail, customerId: null },
        data: { customerId: customer.id },
      })
      .catch((err) => console.warn('[CUSTOMER REGISTER] Order backlink warning:', err.message));

    // Create session
    const rawToken = generateCustomerSessionToken();
    const tokenHash = hashCustomerSessionToken(rawToken);

    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt: getSessionExpiryDate(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token: rawToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });
  } catch (err) {
    console.error('[CUSTOMER REGISTER ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create customer account',
    });
  }
}

/**
 * Log in an existing customer
 */
export async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Invalid email or password.',
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact concierge support.',
      });
    }

    const isValid = verifyPassword(password, customer.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Invalid email or password.',
      });
    }

    // Link any previously unlinked guest orders matching this email
    await prisma.order
      .updateMany({
        where: { customerEmail: cleanEmail, customerId: null },
        data: { customerId: customer.id },
      })
      .catch(() => {});

    // Create session
    const rawToken = generateCustomerSessionToken();
    const tokenHash = hashCustomerSessionToken(rawToken);

    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt: getSessionExpiryDate(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token: rawToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });
  } catch (err) {
    console.error('[CUSTOMER LOGIN ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to sign in',
    });
  }
}

/**
 * Log out active customer session
 */
export async function logoutCustomer(req, res) {
  try {
    if (req.customerSessionId) {
      await prisma.customerSession.delete({
        where: { id: req.customerSessionId },
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (err) {
    console.error('[CUSTOMER LOGOUT ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to sign out',
    });
  }
}

/**
 * Get current customer profile with order metrics
 */
export async function getCustomerProfile(req, res) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer record not found',
      });
    }

    // Calculate customer metrics
    const orderStats = await prisma.order.aggregate({
      where: {
        OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        totalOrders: orderStats._count.id || 0,
        totalSpent: orderStats._sum.totalAmount ? Number(orderStats._sum.totalAmount) : 0,
      },
    });
  } catch (err) {
    console.error('[CUSTOMER GET PROFILE ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve profile',
    });
  }
}

/**
 * Update customer profile details
 */
export async function updateCustomerProfile(req, res) {
  try {
    const { name, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Name is required.',
      });
    }

    const updated = await prisma.customer.update({
      where: { id: req.customerId },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      customer: updated,
    });
  } catch (err) {
    console.error('[CUSTOMER UPDATE PROFILE ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update profile',
    });
  }
}

/**
 * List saved addresses for customer
 */
export async function listAddresses(req, res) {
  try {
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: req.customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (err) {
    console.error('[CUSTOMER LIST ADDRESSES ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load addresses',
    });
  }
}

/**
 * Create a new address for customer
 */
export async function createAddress(req, res) {
  try {
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } =
      req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Full name, phone, address line 1, city, state, and pincode are required.',
      });
    }

    // Check count of existing addresses
    const existingCount = await prisma.customerAddress.count({
      where: { customerId: req.customerId },
    });

    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: req.customerId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: req.customerId,
        label: label ? label.trim() : 'Home',
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault: shouldBeDefault,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address,
    });
  } catch (err) {
    console.error('[CUSTOMER CREATE ADDRESS ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create address',
    });
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(req, res) {
  try {
    const { id } = req.params;
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } =
      req.body;

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: req.customerId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ADDRESS_NOT_FOUND',
        message: 'Address not found or not owned by you',
      });
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: req.customerId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.customerAddress.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : existing.label,
        fullName: fullName ? fullName.trim() : existing.fullName,
        phone: phone ? phone.trim() : existing.phone,
        addressLine1: addressLine1 ? addressLine1.trim() : existing.addressLine1,
        addressLine2: addressLine2 !== undefined ? (addressLine2 ? addressLine2.trim() : null) : existing.addressLine2,
        city: city ? city.trim() : existing.city,
        state: state ? state.trim() : existing.state,
        pincode: pincode ? pincode.trim() : existing.pincode,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: updated,
    });
  } catch (err) {
    console.error('[CUSTOMER UPDATE ADDRESS ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update address',
    });
  }
}

/**
 * Delete a customer address
 */
export async function deleteAddress(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: req.customerId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }

    await prisma.customerAddress.delete({ where: { id } });

    // If deleted address was default, make the most recent remaining address default
    if (existing.isDefault) {
      const remaining = await prisma.customerAddress.findFirst({
        where: { customerId: req.customerId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.customerAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Address removed successfully',
    });
  } catch (err) {
    console.error('[CUSTOMER DELETE ADDRESS ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete address',
    });
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: req.customerId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }

    await prisma.customerAddress.updateMany({
      where: { customerId: req.customerId },
      data: { isDefault: false },
    });

    const updated = await prisma.customerAddress.update({
      where: { id },
      data: { isDefault: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Default address updated',
      address: updated,
    });
  } catch (err) {
    console.error('[CUSTOMER SET DEFAULT ADDRESS ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to set default address',
    });
  }
}

/**
 * List orders for the authenticated customer only
 */
export async function listCustomerOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: req.customerId },
          { customerEmail: { equals: req.customer.email, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: {
          select: {
            paymentReference: true,
            status: true,
            provider: true,
            amount: true,
            createdAt: true,
          },
        },
        trackingEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderReference: o.orderReference,
      status: o.status,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      subtotal: Number(o.subtotal),
      shippingAmount: Number(o.shippingAmount),
      taxAmount: Number(o.taxAmount),
      discountAmount: Number(o.discountAmount),
      totalAmount: Number(o.totalAmount),
      carrier: o.carrier,
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        collectionId: i.collectionId,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        image: i.image,
      })),
      latestTrackingEvent: o.trackingEvents[0] || null,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error('[CUSTOMER LIST ORDERS ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve order history',
    });
  }
}

/**
 * Get a specific order belonging strictly to the authenticated customer
 */
export async function getCustomerOrder(req, res) {
  try {
    const { orderReference } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderReference },
      include: {
        items: true,
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
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    // STRICT AUTHORIZATION: Customer can ONLY access their own order
    const isOwner =
      order.customerId === req.customerId ||
      order.customerEmail.toLowerCase() === req.customer.email.toLowerCase();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You are not authorized to view this order.',
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderReference: order.orderReference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        currency: order.currency,
        subtotal: Number(order.subtotal),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        deliveryInstructions: order.deliveryInstructions,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
        payments: order.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        trackingEvents: order.trackingEvents,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('[CUSTOMER GET ORDER ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve order details',
    });
  }
}
