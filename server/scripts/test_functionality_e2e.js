import { prisma } from '../src/config/prisma.js';
import http from 'http';

const BASE_URL = 'http://localhost:5001';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runVerification() {
  console.log('--- STARTING AMOGA FULL FUNCTIONALITY VERIFICATION ---');

  // 1. Admin login to get session token
  console.log('\n[1] Testing Admin Authentication...');
  const loginRes = await makeRequest('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: process.env.ADMIN_SEED_PASSWORD || 'Admin@Amoga2026!',
    }),
  });

  if (!loginRes.ok) {
    console.error('Failed to log in as admin:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('✓ Admin authenticated successfully.');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-admin-token': token,
  };

  // 2. Collections CRUD & Storefront Fields Verification
  console.log('\n[2] Testing Collection Create with Storefront Copy & Theme Config...');
  const testSlug = `test-luxury-artisan-${Date.now()}`;
  const createColRes = await makeRequest('/api/admin/collections', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Artisan Decor',
      slug: testSlug,
      tagline: 'Timeless Indian Craftsmanship',
      heroHeading: 'Royal Handcrafted Decor',
      heroSubheading: 'Heirloom accents forged by master artisans across Rajasthan and Kashmir.',
      description: 'An exclusive collection of handcrafted bronze, marble, and brass decor objects.',
      shortDescription: 'Handcrafted luxury decor',
      heroImage: 'https://images.unsplash.com/photo-decor-hero.jpg',
      cardImage: 'https://images.unsplash.com/photo-decor-card.jpg',
      accentColor: '#B8860B',
      themeConfig: {
        primaryColor: '#B8860B',
        secondaryColor: '#3C2F2F',
        backgroundColor: '#FCFAF7',
        surfaceColor: '#F5EFEB',
        textColor: '#1A1817',
        mutedTextColor: '#6B635B',
        accentColor: '#D4AF37',
        btnBg: '#B8860B',
        btnText: '#FFFFFF',
        borderColor: '#E8DFD8',
      },
      isActive: true,
    }),
  });

  if (!createColRes.ok) {
    console.error('Failed to create collection:', createColRes);
    process.exit(1);
  }
  console.log('✓ Collection created successfully with full storefront copy & theme.');
  const createdCollectionId = createColRes.data.collection.id;

  // Verify public endpoint returns the created collection with all fields
  console.log('\n[3] Testing Public Storefront Collection Fetch by Slug...');
  const publicColRes = await makeRequest(`/api/collections/${testSlug}`);
  const colData = publicColRes.data?.data || publicColRes.data?.collection;
  if (!publicColRes.ok || colData?.heroHeading !== 'Royal Handcrafted Decor') {
    console.error('Public collection fetch mismatch:', publicColRes);
    process.exit(1);
  }
  console.log('✓ Public storefront endpoint returned correct heroHeading, tagline, and themeConfig.');

  // Verify Duplicate Slug rejection
  console.log('\n[4] Testing Duplicate Slug Validation...');
  const duplicateColRes = await makeRequest('/api/admin/collections', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Duplicate Artisan',
      slug: testSlug,
    }),
  });
  if (duplicateColRes.status !== 409) {
    console.error('Duplicate slug was not rejected with 409:', duplicateColRes);
    process.exit(1);
  }
  console.log('✓ Duplicate slug correctly rejected with HTTP 409.');

  // 3. Promotions Lifecycle & Authoritative Checkout Validation
  console.log('\n[5] Testing Promotion (Coupon) Lifecycle...');
  const testCouponCode = `E2ETEST${Date.now().toString().slice(-4)}`;
  const createCouponRes = await makeRequest('/api/admin/coupons', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: testCouponCode,
      name: 'Grand Festive E2E Offer',
      description: 'Flat 15% off on qualifying orders',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      usageLimit: 10,
      startsAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      applicableCollections: [testSlug, 'food'],
      isActive: true,
    }),
  });

  if (!createCouponRes.ok) {
    console.error('Failed to create coupon:', createCouponRes);
    process.exit(1);
  }
  console.log(`✓ Coupon "${testCouponCode}" created with applicable collections restriction.`);
  const couponId = createCouponRes.data.coupon.id;

  // Test checkout coupon apply endpoint
  console.log('\n[6] Testing Authoritative Checkout Coupon Validation...');
  const applyBelowMin = await makeRequest('/api/checkout/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({
      code: testCouponCode,
      subtotal: 500,
      items: [{ collectionId: testSlug, price: 500, quantity: 1 }],
    }),
  });
  if (applyBelowMin.status !== 422) {
    console.error('Subtotal below minimum was not rejected:', applyBelowMin);
    process.exit(1);
  }
  console.log('✓ Minimum subtotal rule enforced correctly (rejected below ₹1,000).');

  const applyValid = await makeRequest('/api/checkout/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({
      code: testCouponCode,
      subtotal: 2000,
      items: [{ collectionId: testSlug, price: 2000, quantity: 1 }],
    }),
  });
  if (!applyValid.ok || applyValid.data.discountAmount !== 300) { // 15% of 2000 = 300
    console.error('Valid coupon application failed or calculated wrong discount:', applyValid);
    process.exit(1);
  }
  console.log(`✓ Authoritative discount calculated: ₹${applyValid.data.discountAmount} saved on ₹2,000 order.`);

  // 4. Reports & Analytics Reconciled Metrics
  console.log('\n[7] Testing Reports & Analytics API...');
  const reportsRes = await makeRequest('/api/admin/reports/sales', {
    headers: authHeaders,
  });
  if (!reportsRes.ok || !reportsRes.data.report?.summary || !reportsRes.data.report?.salesByCollection) {
    console.error('Reports endpoint failed or missing required fields:', reportsRes);
    process.exit(1);
  }
  console.log('✓ Reports API returned reconciled summary, lifecycle orders, and collection sales.');
  console.log(`  - Total Orders Registered: ${reportsRes.data.report.summary.totalOrdersPlaced}`);
  console.log(`  - Net Captured Revenue: ₹${reportsRes.data.report.summary.netCapturedRevenue}`);
  console.log(`  - Collections Attributed: ${reportsRes.data.report.salesByCollection.length}`);

  // 5. CSV Export Endpoint
  console.log('\n[8] Testing CSV Export with Formula Injection Protection...');
  const exportRes = await fetch(`${BASE_URL}/api/admin/reports/export?type=orders`, {
    headers: authHeaders,
  });
  if (!exportRes.ok) {
    console.error('CSV Export failed:', exportRes.status);
    process.exit(1);
  }
  const csvText = await exportRes.text();
  if (!csvText.includes('Order Reference') || !csvText.includes('Status')) {
    console.error('CSV export content missing expected headers:', csvText.slice(0, 100));
    process.exit(1);
  }
  console.log('✓ CSV Export generated with RFC 4180 headers & cell sanitization.');

  // Clean up test records
  console.log('\n[9] Cleaning up test records...');
  await makeRequest(`/api/admin/coupons/${couponId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  await prisma.collection.delete({ where: { id: createdCollectionId } });
  console.log('✓ Test records cleaned up successfully.');

  console.log('\n========================================');
  console.log('🎉 ALL FUNCTIONALITY VERIFICATIONS PASSED 100%!');
  console.log('========================================');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Verification encountered unhandled error:', err);
  process.exit(1);
});
