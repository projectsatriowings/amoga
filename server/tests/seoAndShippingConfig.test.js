import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAdminSessionToken, hashSessionToken } from '../src/utils/adminAuth.js';

let server;
let origin;
const createdSessionIds = [];
const createdUserIds = [];

async function createTestAdminSession(role) {
  const email = `test_${role.toLowerCase()}_${Date.now()}@amoga.com`;
  const admin = await prisma.adminUser.create({
    data: {
      email,
      name: `Test ${role}`,
      passwordHash: 'dummy_hash',
      role,
      isActive: true,
    },
  });
  createdUserIds.push(admin.id);

  const rawToken = generateAdminSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  createdSessionIds.push(session.id);

  return rawToken;
}

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      origin = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (createdSessionIds.length > 0) {
    await prisma.adminSession.deleteMany({
      where: { id: { in: createdSessionIds } },
    }).catch(() => {});
  }
  if (createdUserIds.length > 0) {
    await prisma.adminUser.deleteMany({
      where: { id: { in: createdUserIds } },
    }).catch(() => {});
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

describe('SEO & Shipping Configuration Authoritative Endpoint Suite', () => {
  test('GET /robots.txt returns 200 with text/plain, crawler rules and canonical sitemap link', async () => {
    const res = await fetch(`${origin}/robots.txt`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/plain'));

    const text = await res.text();
    assert.ok(text.includes('User-agent: *'));
    assert.ok(text.includes('Disallow: /admin'));
    assert.ok(text.includes('Disallow: /stall'));
    assert.ok(text.includes('Disallow: /receipt/'));
    assert.ok(text.includes('Disallow: /api/'));
    assert.ok(text.includes('Sitemap: https://amogastores.com/sitemap.xml'));
  });

  test('GET /sitemap.xml returns 200 with application/xml, valid urlset, canonical domain and active products only', async () => {
    const res = await fetch(`${origin}/sitemap.xml`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('xml'));

    const xml = await res.text();
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(xml.includes('<loc>https://amogastores.com/</loc>'));
    assert.ok(xml.includes('<loc>https://amogastores.com/food</loc>'));
    assert.ok(xml.includes('<loc>https://amogastores.com/tea</loc>'));
    assert.ok(xml.includes('<loc>https://amogastores.com/sarees</loc>'));
    assert.ok(xml.includes('<loc>https://amogastores.com/jewellery</loc>'));
    assert.ok(xml.includes('<loc>https://amogastores.com/shipping-policy</loc>'));

    // Canonical active jasmine rice should exist in sitemap
    assert.ok(xml.includes('handcrafted-heritage-jasmine-rice'));
    // Inactive test duplicate should NOT appear in sitemap
    assert.ok(!xml.includes('test-pos-jasmine-rice-1792220723957'));
  });

  test('GET /api/checkout/shipping-config returns 200 with authoritative StoreSetting configuration', async () => {
    const res = await fetch(`${origin}/api/checkout/shipping-config`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.config);
    assert.strictEqual(body.config.freeShippingThreshold, 2000);
    assert.strictEqual(body.config.shippingThresholdOperator, 'GTE');
    assert.strictEqual(body.config.businessApprovalPending, true);
  });

  test('GET /api/admin/stall/locations without authentication returns HTTP 401', async () => {
    const res = await fetch(`${origin}/api/admin/stall/locations`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/admin/stall/locations with unauthorized role (CONTENT_MANAGER) returns HTTP 403', async () => {
    const token = await createTestAdminSession('CONTENT_MANAGER');

    const res = await fetch(`${origin}/api/admin/stall/locations`, {
      headers: {
        'x-admin-token': token,
        Authorization: `Bearer ${token}`,
      },
    });
    assert.strictEqual(res.status, 403);
  });

  test('GET /api/admin/stall/locations with authorized role (SUPER_ADMIN) returns HTTP 200', async () => {
    const token = await createTestAdminSession('SUPER_ADMIN');

    const res = await fetch(`${origin}/api/admin/stall/locations`, {
      headers: {
        'x-admin-token': token,
        Authorization: `Bearer ${token}`,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.locations));
  });
});
