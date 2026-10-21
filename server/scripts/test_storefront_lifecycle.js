import { prisma } from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5016';

async function testLifecycle() {
  console.log('=== PRODUCT LIFECYCLE & ZERO-COUNT VERIFICATION ===');
  await prisma.product.deleteMany({ where: { slug: { contains: 'verification' } } });

  // 1. Initial State Check
  for (const col of ['tea', 'food', 'sarees', 'jewellery']) {
    const res = await fetch(`${BASE_URL}/api/products?collection=${col}`);
    const json = await res.json();
    console.log(`[Storefront API] Collection '${col}': count = ${json.data?.length ?? 0}, total = ${json.meta?.total ?? 0}`);
    if ((json.data?.length ?? 0) !== 0) {
      throw new Error(`Expected 0 products in collection ${col}, but found ${json.data?.length}`);
    }
  }

  // 2. Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: 'Admin@Amoga2026!',
    }),
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success || !loginJson.token) {
    throw new Error('Admin authentication failed');
  }
  const token = loginJson.token;
  console.log('✓ Admin authenticated successfully.');

  // 3. Admin Creates Product
  const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Verification Chamomile Tea',
      collectionId: 'tea',
      category: 'Flower & Herbal Infusions',
      categoryName: 'Botanical Infusions',
      price: 249,
      stockQuantity: 25,
      sku: 'AMOGA-TEA-VERIF-01',
      description: 'Single-harvest Egyptian chamomile blossoms for calming evening rituals.',
      isPublished: true,
      isActive: true,
      hsnCode: '0902',
      gstRate: 5,
    }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.product) {
    throw new Error(`Product creation failed: ${createJson.message || JSON.stringify(createJson)}`);
  }
  const createdProduct = createJson.product;
  console.log(`✓ Admin created product: "${createdProduct.name}" (ID: ${createdProduct.id}, Slug: ${createdProduct.slug})`);

  // 4. Verify Storefront API reflects the newly created product
  const storeRes = await fetch(`${BASE_URL}/api/products?collection=tea`);
  const storeJson = await storeRes.json();
  console.log('Returned item:', storeJson.data[0]);
  const found = (storeJson.data || []).find((p) => p.id === createdProduct.id || p.slug === createdProduct.slug);
  if (!found) {
    throw new Error('Newly created product was not returned by storefront API!');
  }
  console.log(`✓ Product correctly verified in storefront API: ${found.name} (₹${found.price})`);

  // 5. Verify Product Detail by slug
  const detailRes = await fetch(`${BASE_URL}/api/products/tea/${createdProduct.slug}`);
  const detailJson = await detailRes.json();
  if (!detailRes.ok || !detailJson.data) {
    throw new Error(`Product detail by slug failed: ${JSON.stringify(detailJson)}`);
  }
  console.log(`✓ Product detail verified by slug: "${detailJson.data.name}"`);

  // 6. Clean up: Delete verification product
  const deleteRes = await fetch(`${BASE_URL}/api/admin/products/${createdProduct.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteJson = await deleteRes.json();
  if (!deleteRes.ok) {
    throw new Error(`Product deletion failed: ${deleteJson.message}`);
  }
  console.log('✓ Verification product cleanly deleted via admin API.');

  // 7. Verify zero products again
  const finalRes = await fetch(`${BASE_URL}/api/products?collection=tea`);
  const finalJson = await finalRes.json();
  console.log(`✓ Final storefront tea count: ${finalJson.data?.length ?? 0}`);
  if ((finalJson.data?.length ?? 0) !== 0) {
    throw new Error('Tea collection not at 0 after deletion!');
  }

  console.log('=== ALL LIFECYCLE TESTS PASSED WITH 100% SUCCESS ===');
  await prisma.$disconnect();
}

testLifecycle().catch((err) => {
  console.error('LIFECYCLE TEST FAILED:', err);
  process.exit(1);
});
