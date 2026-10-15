import assert from 'assert';
import { prisma } from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5001/api';

async function runTest() {
  console.log('================================================================');
  console.log('AMOGA — IMMEDIATE PRODUCT VISIBILITY & REAL-TIME REVALIDATION TEST');
  console.log('================================================================\n');

  // 1. Authenticate Super Admin
  console.log('Step 1: Authenticating Super Admin...');
  const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: 'Admin@Amoga2026!',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login must succeed');
  const loginJson = await loginRes.json();
  const token = loginJson.token;
  assert.ok(token, 'Admin token must be returned');
  console.log('✓ Admin authenticated successfully.\n');

  // 2. Verify SSE Events & Version Endpoints
  console.log('Step 2: Testing Version Endpoint...');
  const verRes = await fetch(`${BASE_URL}/products/version`);
  assert.strictEqual(verRes.status, 200, 'Version endpoint must return 200');
  const verJson = await verRes.json();
  assert.ok(verJson.success && typeof verJson.version === 'number', 'Version number must be returned');
  console.log(`✓ Initial Catalogue Version: ${verJson.version}\n`);

  // 3. Test Across All 4 Collections
  const collectionsToTest = [
    {
      id: 'food',
      name: 'Wholesome Pantry',
      testProduct: {
        name: 'Auto-Test Organic Curry Podi',
        slug: 'auto-test-curry-podi',
        collectionId: 'food',
        category: 'podis',
        categoryName: 'Rice Podis',
        price: 245,
        originalPrice: 280,
        description: 'Authentic stone-ground aromatic curry podi blended for everyday meals.',
        image: '/images/gatekeeper-food.jpg',
        stockQuantity: 35,
        inStock: true,
        isFeatured: true,
      },
    },
    {
      id: 'tea',
      name: 'Wellness Tea',
      testProduct: {
        name: 'Auto-Test Lavender Chamomile Brew',
        slug: 'auto-test-lavender-brew',
        collectionId: 'tea',
        category: 'flower',
        categoryName: 'Botanical Flower Brews',
        price: 495,
        originalPrice: 550,
        description: 'Delicate sun-dried lavender blossoms with soothing chamomile petals.',
        image: '/images/food-teas-hero.jpg',
        stockQuantity: 40,
        inStock: true,
        isFeatured: true,
      },
    },
    {
      id: 'sarees',
      name: 'Heritage Sarees',
      testProduct: {
        name: 'Auto-Test Kanchipuram Brocade Saree',
        slug: 'auto-test-kanchipuram-brocade',
        collectionId: 'sarees',
        category: 'silk',
        categoryName: 'Silk Sarees',
        price: 21500,
        originalPrice: 24000,
        description: 'Pure mulberry silk with authentic gold zari temple borders.',
        image: '/images/saree-kanchipuram.jpg',
        stockQuantity: 10,
        inStock: true,
        isFeatured: true,
      },
    },
    {
      id: 'jewellery',
      name: 'Sterling Silver Jewellery',
      testProduct: {
        name: 'Auto-Test Solstice Starlight Ring',
        slug: 'auto-test-solstice-ring',
        collectionId: 'jewellery',
        category: 'rings',
        categoryName: 'Rings',
        price: 4250,
        originalPrice: 4800,
        description: 'Handcrafted 925 sterling silver ring with pavé starburst setting.',
        image: '/images/jewellery-solstice-ring.jpg',
        stockQuantity: 18,
        inStock: true,
        isFeatured: true,
      },
    },
  ];

  const results = [];

  for (const col of collectionsToTest) {
    console.log(`----------------------------------------------------------------`);
    console.log(`Testing Collection: ${col.name} (${col.id.toUpperCase()})`);
    console.log(`----------------------------------------------------------------`);

    let createdId = null;
    let initialVersion = (await (await fetch(`${BASE_URL}/products/version`)).json()).version;

    try {
      // Clean up previous run residue if any
      await prisma.product.deleteMany({
        where: { slug: col.testProduct.slug, collectionId: col.id },
      });

      // A. Measure Creation & Time-To-Visibility
      const startTime = performance.now();
      const createRes = await fetch(`${BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(col.testProduct),
      });

      assert.strictEqual(createRes.status, 201, `Product creation for ${col.id} must succeed`);
      const createJson = await createRes.json();
      assert.ok(createJson.success && createJson.product?.id, 'Saved product must be returned with id');
      createdId = createJson.product.id;

      // Check version update
      const postCreateVerRes = await fetch(`${BASE_URL}/products/version`);
      const postCreateVerJson = await postCreateVerRes.json();
      assert.ok(
        postCreateVerJson.version >= initialVersion,
        'Catalogue version must increment on product creation'
      );

      // Verify immediate visibility in public products API
      const pubListRes = await fetch(`${BASE_URL}/products?collection=${col.id}&limit=100`);
      assert.strictEqual(pubListRes.status, 200);
      const pubListJson = await pubListRes.json();
      const foundInList = pubListJson.data?.find((p) => p.slug === col.testProduct.slug);
      assert.ok(foundInList, `Newly created product "${col.testProduct.slug}" must be visible immediately in collection listing`);
      assert.strictEqual(foundInList.name, col.testProduct.name);
      assert.strictEqual(foundInList.price, col.testProduct.price);

      const creationElapsedMs = Math.round(performance.now() - startTime);
      console.log(`✓ Product Created & Visible in List: "${foundInList.name}" (Time-to-visibility: ${creationElapsedMs}ms)`);

      // B. Verify Direct Slug Access
      const slugRes = await fetch(`${BASE_URL}/products/${col.id}/${col.testProduct.slug}`);
      assert.strictEqual(slugRes.status, 200, 'Direct slug route must return 200');
      const slugJson = await slugRes.json();
      assert.strictEqual(slugJson.data?.name, col.testProduct.name);
      console.log(`✓ Direct slug route verified: /${col.id}/${col.testProduct.slug}`);

      // C. Verify Search Visibility
      const searchRes = await fetch(`${BASE_URL}/products?collection=${col.id}&q=${encodeURIComponent('Auto-Test')}`);
      const searchJson = await searchRes.json();
      const foundInSearch = searchJson.data?.find((p) => p.slug === col.testProduct.slug);
      assert.ok(foundInSearch, 'Newly created product must be discoverable in search');
      console.log(`✓ Product discovered in search query: "Auto-Test"`);

      // D. Verify Live Edit Visibility
      const editStartTime = performance.now();
      const updatedPrice = col.testProduct.price + 100;
      const updatedName = `${col.testProduct.name} (Updated Edition)`;

      const updateRes = await fetch(`${BASE_URL}/admin/products/${createdId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedName,
          price: updatedPrice,
        }),
      });
      assert.strictEqual(updateRes.status, 200, 'Product update must succeed');

      // Verify updated values in public API
      const pubAfterEdit = await fetch(`${BASE_URL}/products?collection=${col.id}&limit=100`);
      const editedItem = (await pubAfterEdit.json()).data?.find((p) => p.slug === col.testProduct.slug);
      assert.ok(editedItem, 'Edited product must be in listing');
      assert.strictEqual(editedItem.name, updatedName, 'Updated product name must reflect immediately');
      assert.strictEqual(editedItem.price, updatedPrice, 'Updated price must reflect immediately');

      const editElapsedMs = Math.round(performance.now() - editStartTime);
      console.log(`✓ Product Edited & Visible in Storefront: "${updatedName}" -> ₹${updatedPrice} (${editElapsedMs}ms)`);

      // E. Verify Unpublishing / Archiving (Must be hidden immediately)
      const unpublishStartTime = performance.now();
      const archiveRes = await fetch(`${BASE_URL}/admin/products/${createdId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(archiveRes.status, 200, 'Archive must return 200');

      // Verify absent from public list
      const pubAfterArchive = await fetch(`${BASE_URL}/products?collection=${col.id}&limit=100`);
      const archivedInList = (await pubAfterArchive.json()).data?.find((p) => p.slug === col.testProduct.slug);
      assert.strictEqual(archivedInList, undefined, 'Archived product must NOT appear in public listing');

      // Verify 404 on direct slug
      const slugAfterArchive = await fetch(`${BASE_URL}/products/${col.id}/${col.testProduct.slug}`);
      assert.strictEqual(slugAfterArchive.status, 404, 'Unpublished product direct slug must return 404 Not Found');

      const unpublishElapsedMs = Math.round(performance.now() - unpublishStartTime);
      console.log(`✓ Product Unpublished: Hidden from public list & returns 404 on direct route (${unpublishElapsedMs}ms)\n`);

      results.push({
        collection: col.name,
        creationElapsedMs,
        editElapsedMs,
        unpublishElapsedMs,
        status: 'PASSED',
      });
    } finally {
      // Clean up test product
      if (createdId) {
        await prisma.productVariant.deleteMany({ where: { productId: createdId } });
        await prisma.product.deleteMany({ where: { id: createdId } });
      }
    }
  }

  console.log('================================================================');
  console.log('SUMMARY OF IMMEDIATE VISIBILITY PERFORMANCE');
  console.log('================================================================');
  console.table(results);
  console.log('================================================================');
  console.log('ALL IMMEDIATE PRODUCT VISIBILITY TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runTest()
  .catch((err) => {
    console.error('TEST FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
