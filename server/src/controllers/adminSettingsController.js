import { prisma } from '../config/prisma.js';
import { hashPassword, logAdminAction } from '../utils/adminAuth.js';

export async function getStoreSettings(req, res) {
  try {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });

    return res.status(200).json({
      success: true,
      settings: settings
        ? {
            ...settings,
            shippingStandardRate: Number(settings.shippingStandardRate),
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            taxPercentage: Number(settings.taxPercentage),
          }
        : null,
      environment: {
        paymentProvider: process.env.PAYMENT_PROVIDER || 'test',
        paymentMode: 'sandbox/test',
        hasRazorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        databaseConnected: true,
      },
    });
  } catch (err) {
    console.error('[ADMIN GET SETTINGS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve store settings',
    });
  }
}

export async function updateStoreSettings(req, res) {
  try {
    const {
      storeName,
      contactEmail,
      contactPhone,
      shippingStandardRate,
      freeShippingThreshold,
      taxPercentage,
      enableOrderNotifications,
      enableInventoryAlerts,
    } = req.body;

    const updated = await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName !== undefined ? storeName.trim() : undefined,
        contactEmail: contactEmail !== undefined ? contactEmail.trim() : undefined,
        contactPhone: contactPhone !== undefined ? contactPhone.trim() : undefined,
        shippingStandardRate: shippingStandardRate !== undefined ? Number(shippingStandardRate) : undefined,
        freeShippingThreshold: freeShippingThreshold !== undefined ? Number(freeShippingThreshold) : undefined,
        taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : undefined,
        enableOrderNotifications: enableOrderNotifications !== undefined ? Boolean(enableOrderNotifications) : undefined,
        enableInventoryAlerts: enableInventoryAlerts !== undefined ? Boolean(enableInventoryAlerts) : undefined,
      },
      create: {
        id: 'default',
        storeName: storeName || 'Amoga Luxury',
        contactEmail: contactEmail || 'support@amoga.com',
        contactPhone: contactPhone || '+91 98765 43210',
        shippingStandardRate: Number(shippingStandardRate || 0),
        freeShippingThreshold: Number(freeShippingThreshold || 2000),
        taxPercentage: Number(taxPercentage || 5),
        enableOrderNotifications: Boolean(enableOrderNotifications ?? true),
        enableInventoryAlerts: Boolean(enableInventoryAlerts ?? true),
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'SETTINGS_UPDATE',
      entityType: 'StoreSetting',
      entityId: 'default',
      details: { storeName: updated.storeName },
    });

    return res.status(200).json({
      success: true,
      settings: {
        ...updated,
        shippingStandardRate: Number(updated.shippingStandardRate),
        freeShippingThreshold: Number(updated.freeShippingThreshold),
        taxPercentage: Number(updated.taxPercentage),
      },
    });
  } catch (err) {
    console.error('[ADMIN UPDATE SETTINGS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update store settings',
    });
  }
}

export async function listAdminUsers(req, res) {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error('[ADMIN LIST USERS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve admin users',
    });
  }
}

export async function createAdminUser(req, res) {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Email, name, password, and role are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_EMAIL',
        message: 'An admin user with this email already exists',
      });
    }

    const validRoles = ['SUPER_ADMIN', 'CATALOGUE_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'INVALID_ROLE',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.adminUser.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'ADMIN_USER_CREATE',
      entityType: 'AdminUser',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    return res.status(201).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('[ADMIN CREATE USER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create admin user',
    });
  }
}

export async function toggleAdminUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.admin.id) {
      return res.status(400).json({
        error: 'CANNOT_DEACTIVATE_SELF',
        message: 'You cannot deactivate your own account',
      });
    }

    const targetUser = await prisma.adminUser.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Admin user not found' });
    }

    const newStatus = !targetUser.isActive;
    const updated = await prisma.adminUser.update({
      where: { id },
      data: { isActive: newStatus },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // If deactivating, delete any active sessions
    if (!newStatus) {
      await prisma.adminSession.deleteMany({ where: { adminId: id } }).catch(() => {});
    }

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: newStatus ? 'ADMIN_USER_ACTIVATE' : 'ADMIN_USER_DEACTIVATE',
      entityType: 'AdminUser',
      entityId: id,
      details: { email: updated.email, isActive: newStatus },
    });

    return res.status(200).json({
      success: true,
      user: updated,
    });
  } catch (err) {
    console.error('[ADMIN TOGGLE USER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to toggle admin user status',
    });
  }
}

export async function listAuditLogs(req, res) {
  try {
    const { entityType, action, page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    if (action && action !== 'ALL') where.action = action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[ADMIN LIST AUDIT LOGS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve audit logs',
    });
  }
}
