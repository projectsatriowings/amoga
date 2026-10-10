import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';

export async function listBanners(req, res) {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return res.status(200).json({
      success: true,
      banners,
    });
  } catch (err) {
    console.error('[ADMIN LIST BANNERS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve banners',
    });
  }
}

export async function listPublicBanners(req, res) {
  try {
    const banners = await prisma.banner.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
    });

    return res.status(200).json({
      success: true,
      banners,
    });
  } catch (err) {
    console.error('[PUBLIC LIST BANNERS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve published banners',
    });
  }
}

export async function createBanner(req, res) {
  try {
    const {
      title,
      subtitle,
      imageUrl,
      mobileImageUrl,
      ctaLabel,
      ctaLink,
      displayOrder = 0,
      isPublished = true,
    } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Title and image URL are required',
      });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl ? mobileImageUrl.trim() : null,
        ctaLabel: ctaLabel ? ctaLabel.trim() : null,
        ctaLink: ctaLink ? ctaLink.trim() : null,
        displayOrder: parseInt(displayOrder, 10) || 0,
        isPublished: Boolean(isPublished),
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'BANNER_CREATE',
      entityType: 'Banner',
      entityId: banner.id,
      details: { title: banner.title },
    });

    return res.status(201).json({
      success: true,
      banner,
    });
  } catch (err) {
    console.error('[ADMIN CREATE BANNER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create banner',
    });
  }
}

export async function updateBanner(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      imageUrl,
      mobileImageUrl,
      ctaLabel,
      ctaLink,
      displayOrder,
      isPublished,
    } = req.body;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Banner not found' });
    }

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        subtitle: subtitle !== undefined ? subtitle?.trim() : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
        mobileImageUrl: mobileImageUrl !== undefined ? mobileImageUrl?.trim() : undefined,
        ctaLabel: ctaLabel !== undefined ? ctaLabel?.trim() : undefined,
        ctaLink: ctaLink !== undefined ? ctaLink?.trim() : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'BANNER_UPDATE',
      entityType: 'Banner',
      entityId: id,
      details: { title: updated.title },
    });

    return res.status(200).json({
      success: true,
      banner: updated,
    });
  } catch (err) {
    console.error('[ADMIN UPDATE BANNER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update banner',
    });
  }
}

export async function toggleBanner(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Banner not found' });
    }

    const newPublished = !existing.isPublished;
    const updated = await prisma.banner.update({
      where: { id },
      data: { isPublished: newPublished },
    });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: newPublished ? 'BANNER_PUBLISH' : 'BANNER_UNPUBLISH',
      entityType: 'Banner',
      entityId: id,
      details: { title: updated.title, isPublished: newPublished },
    });

    return res.status(200).json({
      success: true,
      banner: updated,
    });
  } catch (err) {
    console.error('[ADMIN TOGGLE BANNER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to toggle banner status',
    });
  }
}

export async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Banner not found' });
    }

    await prisma.banner.delete({ where: { id } });

    await logAdminAction({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'BANNER_DELETE',
      entityType: 'Banner',
      entityId: id,
      details: { title: existing.title },
    });

    return res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (err) {
    console.error('[ADMIN DELETE BANNER ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete banner',
    });
  }
}
