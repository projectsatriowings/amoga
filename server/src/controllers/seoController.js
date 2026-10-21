import { prisma } from '../config/prisma.js';

// Canonical domain configuration for SEO
const CANONICAL_DOMAIN = 'https://amogastores.com';

export function getRobotsTxt(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
  
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /stall
Disallow: /receipt/
Disallow: /api/

Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml
`;
  return res.status(200).send(content);
}

export async function getSitemapXml(req, res, next) {
  try {
    const [collections, products] = await Promise.all([
      prisma.collection.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, collectionId: true, updatedAt: true },
      }),
    ]);

    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/food', priority: '0.9', changefreq: 'daily' },
      { loc: '/tea', priority: '0.9', changefreq: 'daily' },
      { loc: '/sarees', priority: '0.9', changefreq: 'daily' },
      { loc: '/jewellery', priority: '0.9', changefreq: 'daily' },
      { loc: '/food/products', priority: '0.8', changefreq: 'daily' },
      { loc: '/tea/products', priority: '0.8', changefreq: 'daily' },
      { loc: '/sarees/products', priority: '0.8', changefreq: 'daily' },
      { loc: '/jewellery/products', priority: '0.8', changefreq: 'daily' },
      { loc: '/shipping-policy', priority: '0.5', changefreq: 'monthly' },
      { loc: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
      { loc: '/terms-and-conditions', priority: '0.3', changefreq: 'monthly' },
      { loc: '/refund-policy', priority: '0.3', changefreq: 'monthly' },
      { loc: '/cancellation-policy', priority: '0.3', changefreq: 'monthly' },
    ];

    const nowIso = new Date().toISOString().split('T')[0];

    const xmlUrls = [];

    // Static routes
    for (const route of staticRoutes) {
      xmlUrls.push(`  <url>
    <loc>${CANONICAL_DOMAIN}${route.loc}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
    }

    // Dynamic Collections (custom / admin created collections)
    const knownStatic = new Set(['food', 'tea', 'sarees', 'jewellery']);
    for (const col of collections) {
      if (!knownStatic.has(col.id) && !knownStatic.has(col.slug)) {
        const lastmod = col.updatedAt ? col.updatedAt.toISOString().split('T')[0] : nowIso;
        xmlUrls.push(`  <url>
    <loc>${CANONICAL_DOMAIN}/collections/${col.slug || col.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }

    // Dynamic Products
    for (const prod of products) {
      const col = prod.collectionId || 'food';
      const lastmod = prod.updatedAt ? prod.updatedAt.toISOString().split('T')[0] : nowIso;
      xmlUrls.push(`  <url>
    <loc>${CANONICAL_DOMAIN}/${col}/products/${encodeURIComponent(prod.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
}
