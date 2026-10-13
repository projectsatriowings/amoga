import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listCollections(req, res) {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const orderMap = { food: 1, tea: 2, sarees: 3, jewellery: 4 };
    collections.sort((a, b) => {
      const rankA = orderMap[a.id] || 99;
      const rankB = orderMap[b.id] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
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
    const {
      name,
      slug,
      tagline,
      heroHeading,
      heroSubheading,
      description,
      shortDescription,
      heroImage,
      cardImage,
      theme,
      accentColor,
      themeConfig,
      isActive = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Collection name is required' });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'A valid URL slug could not be generated' });
    }

    // Check if ID or Slug already exists
    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ id: cleanSlug }, { slug: cleanSlug }],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: `Collection with slug '${cleanSlug}' already exists. Please choose a unique name or slug.`,
      });
    }

    // Validate themeConfig if provided
    let cleanThemeConfig = null;
    if (themeConfig && typeof themeConfig === 'object') {
      cleanThemeConfig = themeConfig;
    }

    const created = await prisma.collection.create({
      data: {
        id: cleanSlug,
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline ? tagline.trim() : null,
        heroHeading: heroHeading ? heroHeading.trim() : name.trim(),
        heroSubheading: heroSubheading ? heroSubheading.trim() : null,
        description: description ? description.trim() : null,
        shortDescription: shortDescription ? shortDescription.trim() : null,
        heroImage: heroImage ? heroImage.trim() : null,
        cardImage: cardImage ? cardImage.trim() : null,
        theme: theme ? theme.trim() : 'custom',
        accentColor: accentColor ? accentColor.trim() : '#722F37',
        themeConfig: cleanThemeConfig,
        isActive: Boolean(isActive),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: 'COLLECTION_CREATE',
      entityType: 'Collection',
      entityId: created.id,
      details: { name: created.name, slug: created.slug },
    });

    return res.status(201).json({
      success: true,
      collection: {
        ...created,
        productCount: created._count?.products || 0,
      },
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
    const {
      name,
      slug,
      tagline,
      heroHeading,
      heroSubheading,
      description,
      shortDescription,
      heroImage,
      cardImage,
      theme,
      accentColor,
      themeConfig,
      isActive,
    } = req.body;

    const existing = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Collection not found',
      });
    }

    // Slug validation if altered
    let cleanSlug = undefined;
    if (slug !== undefined) {
      cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!cleanSlug) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Slug cannot be empty' });
      }

      if (cleanSlug !== existing.slug) {
        const conflict = await prisma.collection.findFirst({
          where: {
            slug: cleanSlug,
            NOT: { id: existing.id },
          },
        });
        if (conflict) {
          return res.status(409).json({
            error: 'CONFLICT',
            message: `Slug '${cleanSlug}' is already in use by another collection`,
          });
        }
      }
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug: cleanSlug !== undefined ? cleanSlug : undefined,
        tagline: tagline !== undefined ? (tagline ? tagline.trim() : null) : undefined,
        heroHeading: heroHeading !== undefined ? (heroHeading ? heroHeading.trim() : null) : undefined,
        heroSubheading: heroSubheading !== undefined ? (heroSubheading ? heroSubheading.trim() : null) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        shortDescription: shortDescription !== undefined ? (shortDescription ? shortDescription.trim() : null) : undefined,
        heroImage: heroImage !== undefined ? (heroImage ? heroImage.trim() : null) : undefined,
        cardImage: cardImage !== undefined ? (cardImage ? cardImage.trim() : null) : undefined,
        theme: theme !== undefined ? theme : undefined,
        accentColor: accentColor !== undefined ? accentColor : undefined,
        themeConfig: themeConfig !== undefined ? themeConfig : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: 'COLLECTION_UPDATE',
      entityType: 'Collection',
      entityId: id,
      details: { name: updated.name, isActive: updated.isActive },
    });

    return res.status(200).json({
      success: true,
      collection: {
        ...updated,
        productCount: updated._count?.products || 0,
      },
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
    const existing = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Collection not found' });
    }

    const newStatus = !existing.isActive;
    const updated = await prisma.collection.update({
      where: { id },
      data: { isActive: newStatus },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
      action: newStatus ? 'COLLECTION_ACTIVATE' : 'COLLECTION_DEACTIVATE',
      entityType: 'Collection',
      entityId: id,
      details: { name: updated.name, isActive: newStatus },
    });

    return res.status(200).json({
      success: true,
      collection: {
        ...updated,
        productCount: updated._count?.products || 0,
      },
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

    // Protect canonical foundation collections
    const protectedIds = ['food', 'tea', 'sarees', 'jewellery'];
    if (protectedIds.includes(id)) {
      return res.status(403).json({
        error: 'PROTECTED_COLLECTION',
        message: `Foundational collection '${existing.name}' is system-protected and cannot be permanently deleted. You can deactivate it instead.`,
      });
    }

    await prisma.collection.delete({ where: { id } });

    await logAdminAction({
      adminId: req.admin?.id,
      adminEmail: req.admin?.email || 'admin@amoga.com',
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
