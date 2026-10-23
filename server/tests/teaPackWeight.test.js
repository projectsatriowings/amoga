import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword, generateAdminSessionToken, hashSessionToken } from '../src/utils/adminAuth.js';
import { validateAndFormatTeaPackWeight } from '../src/controllers/adminProductsController.js';
import { validateProductImportWorkbook } from '../src/services/productImportService.js';
import ExcelJS from 'exceljs';

describe('Wellness Tea 25 g Standardization & RBAC Weight Modification Test Suite', () => {
  let server;
  let baseUrl;
  let superAdminToken;
  let catalogueManagerToken;
  let cashierToken;
  let superAdminUser;
  let catalogueManagerUser;
  let cashierUser;

  const createdProductIds = [];

  before(async () => {
    // 1. Start test server on dynamic port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 2. Set up authenticated test admins
    const passwordHash = await hashPassword('AmogaTeaTest2026!');

    superAdminUser = await prisma.adminUser.upsert({
      where: { email: 'superadmin.tea@amogatest.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        email: 'superadmin.tea@amogatest.com',
        name: 'Super Admin Tester',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    catalogueManagerUser = await prisma.adminUser.upsert({
      where: { email: 'catalogue.tea@amogatest.com' },
      update: { role: 'CATALOGUE_MANAGER', isActive: true },
      create: {
        email: 'catalogue.tea@amogatest.com',
        name: 'Catalogue Manager Tester',
        passwordHash,
        role: 'CATALOGUE_MANAGER',
        isActive: true,
      },
    });

    cashierUser = await prisma.adminUser.upsert({
      where: { email: 'cashier.tea@amogatest.com' },
      update: { role: 'STALL_CASHIER', isActive: true },
      create: {
        email: 'cashier.tea@amogatest.com',
        name: 'Stall Cashier Tester',
        passwordHash,
        role: 'STALL_CASHIER',
        isActive: true,
      },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const token1 = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: superAdminUser.id,
        tokenHash: hashSessionToken(token1),
        expiresAt,
      },
    });
    superAdminToken = token1;

    const token2 = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: catalogueManagerUser.id,
        tokenHash: hashSessionToken(token2),
        expiresAt,
      },
    });
    catalogueManagerToken = token2;

    const token3 = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: cashierUser.id,
        tokenHash: hashSessionToken(token3),
        expiresAt,
      },
    });
    cashierToken = token3;
  });

  after(async () => {
    // Clean up created test products
    for (const pid of createdProductIds) {
      try {
        await prisma.product.delete({ where: { id: pid } });
      } catch (_) {}
    }

    // Clean up test sessions & admin users
    try {
      await prisma.adminSession.deleteMany({
        where: { adminId: { in: [superAdminUser.id, catalogueManagerUser.id, cashierUser.id] } },
      });
      await prisma.adminUser.deleteMany({
        where: { id: { in: [superAdminUser.id, catalogueManagerUser.id, cashierUser.id] } },
      });
    } catch (_) {}

    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  });

  test('Unit: validateAndFormatTeaPackWeight helper handles defaults, valid weights and rejects malformed values', () => {
    // Omitted or empty with default flag
    assert.deepStrictEqual(validateAndFormatTeaPackWeight(undefined, true), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight(null, true), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight('', true), { isValid: true, formatted: '25 g' });

    // Numeric weights
    assert.deepStrictEqual(validateAndFormatTeaPackWeight(25), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight(50), { isValid: true, formatted: '50 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight(100), { isValid: true, formatted: '100 g' });

    // String formatted weights
    assert.deepStrictEqual(validateAndFormatTeaPackWeight('25'), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight('25g'), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight('25 g'), { isValid: true, formatted: '25 g' });
    assert.deepStrictEqual(validateAndFormatTeaPackWeight('50 grams'), { isValid: true, formatted: '50 g' });

    // Invalid weights
    assert.strictEqual(validateAndFormatTeaPackWeight(-10).isValid, false);
    assert.strictEqual(validateAndFormatTeaPackWeight(0).isValid, false);
    assert.strictEqual(validateAndFormatTeaPackWeight('abc').isValid, false);
    assert.strictEqual(validateAndFormatTeaPackWeight(10000).isValid, false);
  });

  test('1. Creating a new tea product without specifying weight defaults to 25 g', async () => {
    const slug = `tea-test-default-${Date.now().toString(36)}`;
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Himalayan Holy Basil Tisane',
        slug,
        collectionId: 'tea',
        category: 'Herbal Leaf Brews',
        categoryName: 'Medicinal Leaf Brews',
        description: 'Rare organic wild holy basil harvested from high Himalayan slopes.',
        price: 249,
        // packSize omitted
        stockQuantity: 30,
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.product.collectionId, 'tea');
    assert.strictEqual(body.product.packSize, '25 g', 'Expected packSize to default to "25 g"');

    createdProductIds.push(body.product.id);
  });

  test('2. Saving a new tea product with explicit packWeight: 25 persists 25 g', async () => {
    const slug = `tea-test-explicit-25-${Date.now().toString(36)}`;
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Lemongrass Citrus Tisane',
        slug,
        collectionId: 'tea',
        category: 'Botanical Infusions',
        description: 'Hand-picked tender lemongrass stalks.',
        price: 219,
        packSize: '25 g',
        stockQuantity: 25,
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.product.packSize, '25 g');

    createdProductIds.push(body.product.id);
  });

  test('3 & 4. An authorized admin can change one product weight to 50 g, persists upon re-fetching', async () => {
    // First create a 25g tea
    const slug = `tea-test-edit-target-${Date.now().toString(36)}`;
    const createRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Wild Chamomile & Lavender',
        slug,
        collectionId: 'tea',
        category: 'Botanical Infusions',
        description: 'Calming bedtime blend.',
        price: 299,
        stockQuantity: 20,
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });
    const createBody = await createRes.json();
    const productId = createBody.product.id;
    createdProductIds.push(productId);
    assert.strictEqual(createBody.product.packSize, '25 g');

    // Update weight to 50 g
    const updateRes = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        packSize: '50 g',
      }),
    });

    assert.strictEqual(updateRes.status, 200);
    const updateBody = await updateRes.json();
    assert.strictEqual(updateBody.success, true);
    assert.strictEqual(updateBody.product.packSize, '50 g');

    // 4. Verify GET /api/admin/products/:id returns the updated 50 g
    const getRes = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${catalogueManagerToken}` },
    });
    assert.strictEqual(getRes.status, 200);
    const getBody = await getRes.json();
    assert.strictEqual(getBody.product.packSize, '50 g');
  });

  test('5 & 6. Product-specific change: modifying one tea product does NOT alter other tea products', async () => {
    // Create Tea Product A
    const slugA = `tea-test-iso-a-${Date.now().toString(36)}`;
    const resA = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Single Estate Blue Pea A',
        slug: slugA,
        collectionId: 'tea',
        category: 'flower',
        description: 'Test tea A',
        price: 199,
        stockQuantity: 15,
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });
    const bodyA = await resA.json();
    createdProductIds.push(bodyA.product.id);

    // Create Tea Product B
    const slugB = `tea-test-iso-b-${Date.now().toString(36)}`;
    const resB = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Single Estate Moringa B',
        slug: slugB,
        collectionId: 'tea',
        category: 'leaf',
        description: 'Test tea B',
        price: 219,
        stockQuantity: 15,
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });
    const bodyB = await resB.json();
    createdProductIds.push(bodyB.product.id);

    assert.strictEqual(bodyA.product.packSize, '25 g');
    assert.strictEqual(bodyB.product.packSize, '25 g');

    // Update Product A to 75 g
    const updateResA = await fetch(`${baseUrl}/api/admin/products/${bodyA.product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        packSize: '75 g',
      }),
    });
    assert.strictEqual(updateResA.status, 200);

    // Verify Product A is 75 g, Product B remains 25 g
    const checkA = await prisma.product.findUnique({ where: { id: bodyA.product.id } });
    const checkB = await prisma.product.findUnique({ where: { id: bodyB.product.id } });

    assert.strictEqual(checkA.packSize, '75 g', 'Product A must be 75 g');
    assert.strictEqual(checkB.packSize, '25 g', 'Product B must remain 25 g without being overwritten');
  });

  test('8. Unauthorized roles (cashiers, stall managers, unauthenticated) cannot modify weight via API', async () => {
    // Unauthenticated request receives 401
    const unauthRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacked Tea',
        collectionId: 'tea',
        price: 199,
      }),
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated user must be rejected with 401');

    // Cashier / stall role receives 403 Forbidden
    const cashierRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        name: 'Cashier Created Tea',
        collectionId: 'tea',
        price: 199,
      }),
    });
    assert.strictEqual(cashierRes.status, 403, 'Stall Cashier must be rejected with 403 Forbidden');

    // Invalid weight validation (negative or malformed) returns 400
    const invalidWeightRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Negative Weight Tea',
        slug: `tea-test-neg-${Date.now().toString(36)}`,
        collectionId: 'tea',
        price: 199,
        packSize: '-50 g',
        hsnCode: '0902',
        gstRate: 5,
        status: 'draft',
      }),
    });
    assert.strictEqual(invalidWeightRes.status, 400, 'Invalid weight must be rejected with 400');
    const invalidBody = await invalidWeightRes.json();
    assert.strictEqual(invalidBody.error, 'INVALID_PACK_WEIGHT');
  });

  test('9. Excel Import defaults omitted tea weight to 25 g, respects explicit valid weight, and rejects invalid weight', async () => {
    // Build test workbook in memory
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');

    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
      { header: 'Product Name*', key: 'name' },
      { header: 'Category Code*', key: 'cat' },
      { header: 'Description*', key: 'desc' },
      { header: 'Primary Image URL*', key: 'img' },
      { header: 'Pack Size / Weight', key: 'pack' },
      { header: 'Selling Price (INR)', key: 'price' },
      { header: 'Publication Status', key: 'status' },
      { header: 'HSN Code *', key: 'hsn' },
      { header: 'GST Rate % *', key: 'gst' },
      { header: 'Stock Quantity', key: 'stock' },
    ];

    // Row 1: Tea with omitted weight -> should default to 25 g
    sheet.addRow([
      'tea',
      `tea-imp-blank-${Date.now().toString(36)}`,
      'Import Blank Tea',
      'flower',
      'Delicate flower tea test with blank pack weight.',
      '/images/tea-blank.jpg',
      '', // Blank packSize
      299,
      'Draft',
      '0902',
      5,
      20,
    ]);

    // Row 2: Tea with explicit valid weight 50 g -> should respect 50 g
    sheet.addRow([
      'tea',
      `tea-imp-50g-${Date.now().toString(36)}`,
      'Import 50g Tea',
      'leaf',
      'Special 50g tin pack.',
      '/images/tea-50g.jpg',
      '50 g',
      349,
      'Draft',
      '0902',
      5,
      20,
    ]);

    // Row 3: Tea with invalid weight -20g -> should fail validation with error
    sheet.addRow([
      'tea',
      `tea-imp-invalid-${Date.now().toString(36)}`,
      'Import Invalid Weight Tea',
      'flower',
      'Tea with bad weight.',
      '/images/tea-inv.jpg',
      '-20 g',
      199,
      'Draft',
      '0902',
      5,
      20,
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const parseResult = await validateProductImportWorkbook(buffer);

    // Verify Row 1: defaulted to 25 g
    const row1 = parseResult.parsedProducts.find((p) => p.name === 'Import Blank Tea');
    assert.ok(row1, 'Row 1 should be parsed');
    assert.strictEqual(row1.packSize, '25 g', 'Omitted tea weight in Excel must default to "25 g"');

    // Verify Row 2: respected 50 g
    const row2 = parseResult.parsedProducts.find((p) => p.name === 'Import 50g Tea');
    assert.ok(row2, 'Row 2 should be parsed');
    assert.strictEqual(row2.packSize, '50 g', 'Explicit tea weight in Excel must be respected');

    // Verify Row 3: error logged for invalid weight
    const weightError = parseResult.errors.find((e) => e.code === 'INVALID_TEA_WEIGHT');
    assert.ok(weightError, 'Invalid tea pack weight in Excel must generate an INVALID_TEA_WEIGHT error');
  });

  test('10. Non-tea products are completely unaffected by tea pack weight logic', async () => {
    // Create food product with custom pack size
    const slugFood = `food-test-unaffected-${Date.now().toString(36)}`;
    const resFood = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueManagerToken}`,
      },
      body: JSON.stringify({
        name: 'Millet Idli Mix',
        slug: slugFood,
        collectionId: 'food',
        category: 'millets',
        description: 'Nutritious traditional mix.',
        price: 180,
        packSize: '500g Pouch',
        hsnCode: '1008',
        gstRate: 5,
        status: 'draft',
      }),
    });

    assert.strictEqual(resFood.status, 201);
    const bodyFood = await resFood.json();
    assert.strictEqual(bodyFood.product.collectionId, 'food');
    assert.strictEqual(bodyFood.product.packSize, '500g Pouch', 'Non-tea product packSize must be preserved exactly as entered');

    createdProductIds.push(bodyFood.product.id);
  });
});
