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

export async function createCollection(req, res) {
  try {
    const { name, slug, tagline, description, theme, accentColor } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Collection name is required' });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Valid slug could not be generated' });
    }

    // Check if ID or Slug already exists
    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ id: cleanSlug }, { slug: cleanSlug }],
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'CONFLICT', message: `Collection with slug '${cleanSlug}' already exists` });
    }

    const created = await prisma.collection.create({
      data: {
        id: cleanSlug,
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline ? tagline.trim() : null,
        description: description ? description.trim() : null,
        theme: theme ? theme.trim() : 'custom',
        accentColor: accentColor ? accentColor.trim() : '#722F37',
        isActive: true,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'COLLECTION_CREATE',
      entityType: 'Collection',
      entityId: created.id,
      details: { name: created.name, slug: created.slug },
    });

    return res.status(201).json({
      success: true,
      collection: created,
    });
  } catch (err) {
    console.error('[ADMIN CREATE COLLECTION ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create collection',
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

export async function deleteCollection(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Collection not found' });
    }

    if (existing._count.products > 0) {
      return res.status(400).json({
        error: 'HAS_PRODUCTS',
        message: `Cannot delete collection containing ${existing._count.products} products. Delete or reassign its products first.`,
      });
    }

    await prisma.collection.delete({ where: { id } });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'COLLECTION_DELETE',
      entityType: 'Collection',
      entityId: id,
      details: { name: existing.name },
    });

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (err) {
    console.error('[ADMIN DELETE COLLECTION ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete collection',
    });
  }
}
