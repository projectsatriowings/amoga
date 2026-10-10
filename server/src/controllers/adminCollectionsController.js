import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listCollections(req, res) {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      collections: collections.map((c) => ({
        ...c,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    console.error('[ADMIN LIST COLLECTIONS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve collections',
    });
  }
}

export async function updateCollection(req, res) {
  try {
    const { id } = req.params;
    const { name, tagline, description, theme, accentColor, isActive } = req.body;

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Collection not found',
      });
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        tagline: tagline !== undefined ? tagline : undefined,
        description: description !== undefined ? description : undefined,
        theme: theme !== undefined ? theme : undefined,
        accentColor: accentColor !== undefined ? accentColor : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'COLLECTION_UPDATE',
      entityType: 'Collection',
      entityId: id,
      details: { name: updated.name, isActive: updated.isActive },
    });

    return res.status(200).json({
      success: true,
      collection: updated,
    });
  } catch (err) {
    console.error('[ADMIN UPDATE COLLECTION ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update collection',
    });
  }
}

export async function toggleCollection(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Collection not found' });
    }

    const newStatus = !existing.isActive;
    const updated = await prisma.collection.update({
      where: { id },
      data: { isActive: newStatus },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: newStatus ? 'COLLECTION_ACTIVATE' : 'COLLECTION_DEACTIVATE',
      entityType: 'Collection',
      entityId: id,
      details: { name: updated.name, isActive: newStatus },
    });

    return res.status(200).json({
      success: true,
      collection: updated,
    });
  } catch (err) {
    console.error('[ADMIN TOGGLE COLLECTION ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to toggle collection status',
    });
  }
}
