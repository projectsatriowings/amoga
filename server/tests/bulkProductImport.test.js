import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import ExcelJS from 'exceljs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import {
  generateProductImportTemplate,
  validateProductImportWorkbook,
  executeProductImport,
  generateErrorReportExcel,
  TEMPLATE_VERSION,
} from '../src/services/productImportService.js';

let server;
let baseUrl;
let catalogueToken;

describe('AMOGA — Bulk Product Excel Import System Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Login as Catalogue Manager
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'catalogue@amoga.com',
        password: 'Catalogue@Amoga2026!',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    catalogueToken = body.token;
  });

  after(async () => {
    // Clean up test products created during tests
    const testSourceIds = [
      'f-test-ragi-dosa',
      'tea-test-hibiscus-glow',
      's-test-banarasi-gold',
      'j-test-aurora-silver-cuff',
      'f-sample-moringa-soup',
      'tea-sample-chamomile-calm',
      's-sample-royal-wine-silk',
      'j-sample-solstice-ring',
    ];

    try {
      await prisma.productVariant.deleteMany({
        where: {
          product: {
            sourceId: { in: testSourceIds },
          },
        },
      });
      await prisma.inventoryLog.deleteMany({
        where: {
          product: {
            sourceId: { in: testSourceIds },
          },
        },
      });
      await prisma.product.deleteMany({
        where: {
          sourceId: { in: testSourceIds },
        },
      });
    } catch {
      // Ignored during cleanup
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. Generates official multi-sheet Excel template matching AMOGA specification', async () => {
    const buffer = await generateProductImportTemplate();
    assert.ok(buffer);
    assert.ok(buffer.length > 5000, 'Template buffer should be substantial');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheets = workbook.worksheets.map((s) => s.name);
    assert.deepEqual(sheets, ['Read Me', 'Products', 'Variants', 'Inventory', 'Collections']);

    const readMe = workbook.getWorksheet('Read Me');
    assert.equal(readMe.getCell('B2').value, TEMPLATE_VERSION);

    const products = workbook.getWorksheet('Products');
    assert.ok(products.rowCount >= 5, 'Should have header + 4 sample products');
  });

  it('2. GET /api/admin/products/import/template returns downloadable spreadsheet', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/import/template`, {
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const arrayBuffer = await res.arrayBuffer();
    assert.ok(arrayBuffer.byteLength > 5000);
  });

  it('3. Validates workbook and detects missing required columns and values', async () => {
    const invalidWorkbook = new ExcelJS.Workbook();
    const sheet = invalidWorkbook.addWorksheet('Products');
    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
    ];
    sheet.addRow(['food', '']); // Missing product code and other required headers

    const buffer = await invalidWorkbook.xlsx.writeBuffer();
    const result = await validateProductImportWorkbook(buffer);

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    const missingColError = result.errors.find((e) => e.code === 'MISSING_REQUIRED_COLUMN');
    assert.ok(missingColError, 'Should detect missing required columns');
  });

  it('4. Validates prices and stock counts, preventing negative numbers or unpriced publication', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Products');
    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
      { header: 'Product Name*', key: 'name' },
      { header: 'Category Code*', key: 'cat' },
      { header: 'Description*', key: 'desc' },
      { header: 'Primary Image URL*', key: 'img' },
      { header: 'Selling Price (INR)', key: 'price' },
      { header: 'Stock Quantity', key: 'stock' },
      { header: 'Publication Status', key: 'status' },
    ];

    sheet.addRow([
      'food',
      'f-invalid-price',
      'Invalid Price Soup',
      'soups',
      'Good soup',
      '/images/soup.jpg',
      -150, // Negative price
      -10, // Negative stock
      'Published',
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const result = await validateProductImportWorkbook(buffer);

    assert.equal(result.valid, false);
    const negativePriceErr = result.errors.find((e) => e.code === 'NEGATIVE_PRICE');
    assert.ok(negativePriceErr, 'Should flag negative price');
    const negativeStockErr = result.errors.find((e) => e.code === 'NEGATIVE_STOCK');
    assert.ok(negativeStockErr, 'Should flag negative stock');
  });

  it('5. Successfully validates and previews a complete multi-collection workbook (Pantry, Tea, Sarees, Jewellery)', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Products');
    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
      { header: 'Product Name*', key: 'name' },
      { header: 'Category Code*', key: 'cat' },
      { header: 'Category Name', key: 'catName' },
      { header: 'Description*', key: 'desc' },
      { header: 'Primary Image URL*', key: 'img' },
      { header: 'Selling Price (INR)', key: 'price' },
      { header: 'Original Price / MRP (INR)', key: 'mrp' },
      { header: 'Stock Quantity', key: 'stock' },
      { header: 'Publication Status', key: 'status' },
      { header: 'In Stock', key: 'inStock' },
      { header: 'Pantry: Ingredients', key: 'food_ing' },
      { header: 'Tea: Form', key: 'tea_form' },
      { header: 'Sarees: Fabric', key: 'saree_fab' },
      { header: 'Jewellery: Metal Type', key: 'jewel_metal' },
    ];

    sheet.addRow([
      'food',
      'f-test-ragi-dosa',
      'Sprouted Ragi Dosa Crisps',
      'millets',
      'Millet Mixes',
      'Nutritious sprouted finger millet crisps seasoned with curry leaves and sea salt.',
      '/images/food/food-soups-hero.jpg',
      199,
      249,
      40,
      'Published',
      'Yes',
      'Sprouted Ragi, Urad Dal, Rice Flour, Cold-Pressed Groundnut Oil, Curry Leaves, Sea Salt',
      '',
      '',
      '',
    ]);

    sheet.addRow([
      'tea',
      'tea-test-hibiscus-glow',
      'Nilgiri Hibiscus Glow Infusion',
      'flower',
      'Botanical Flower Brews',
      'Sun-dried scarlet hibiscus calyces with dried orange peel and cinnamon.',
      '/images/tea/tea-chamomile.jpg',
      449,
      549,
      25,
      'Published',
      'Yes',
      '',
      'Whole Dried Calyces',
      '',
      '',
    ]);

    sheet.addRow([
      'sarees',
      's-test-banarasi-gold',
      'Banarasi Katan Silk Saree in Antique Gold',
      'silk',
      'Silk Sarees',
      'Heirloom pure Katan silk handwoven with authentic silver and gold zari kadwa motifs.',
      '/images/sarees/saree-kanchipuram.jpg',
      24500,
      28000,
      5,
      'Published',
      'Yes',
      '',
      '',
      'Pure Katan Silk',
      '',
    ]);

    sheet.addRow([
      'jewellery',
      'j-test-aurora-silver-cuff',
      'Aurora Sculptural Silver Wrist Cuff',
      'bracelets',
      'Bracelets & Cuffs',
      'Hand-forged 925 sterling silver cuff bracelet with fluid tapered contouring.',
      '/images/jewellery/jewellery-solstice-ring.jpg',
      5800,
      6500,
      12,
      'Published',
      'Yes',
      '',
      '',
      '',
      '925 Sterling Silver',
    ]);

    // Add Variants sheet
    const varSheet = wb.addWorksheet('Variants');
    varSheet.columns = [
      { header: 'Product Code*', key: 'pCode' },
      { header: 'Variant Name*', key: 'vName' },
      { header: 'Variant SKU*', key: 'sku' },
      { header: 'Variant Type', key: 'type' },
      { header: 'Option Value', key: 'val' },
      { header: 'Selling Price (INR)', key: 'price' },
      { header: 'Stock Quantity', key: 'stock' },
      { header: 'In Stock', key: 'inStock' },
    ];

    varSheet.addRow([
      's-test-banarasi-gold',
      'Standard (6.3m)',
      'TEST-SAR-GOLD-63',
      'size',
      '6.3m',
      24500,
      5,
      'Yes',
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const base64Data = buffer.toString('base64');

    // Test POST /api/admin/products/import/validate
    const valRes = await fetch(`${baseUrl}/api/admin/products/import/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        fileData: base64Data,
        mode: 'CREATE_NEW',
      }),
    });

    assert.equal(valRes.status, 200);
    const valJson = await valRes.json();
    assert.equal(valJson.valid, true);
    assert.equal(valJson.parsedProducts.length, 4);
    assert.equal(valJson.parsedVariants.length, 1);
    assert.equal(valJson.errors.length, 0);

    // 6. Test POST /api/admin/products/import/execute in CREATE_NEW mode
    const execRes = await fetch(`${baseUrl}/api/admin/products/import/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        validationResult: valJson,
        mode: 'CREATE_NEW',
      }),
    });

    assert.equal(execRes.status, 201);
    const execJson = await execRes.json();
    assert.equal(execJson.success, true);
    assert.equal(execJson.summary.productsCreated, 4);
    assert.equal(execJson.summary.variantsCreated, 1);
    assert.ok(execJson.summary.inventoryLogsCreated >= 4);

    // Verify in database
    const dbPantry = await prisma.product.findUnique({
      where: { sourceId: 'f-test-ragi-dosa' },
      include: { inventoryLogs: true },
    });
    assert.ok(dbPantry);
    assert.equal(dbPantry.name, 'Sprouted Ragi Dosa Crisps');
    assert.equal(Number(dbPantry.price), 199);
    assert.equal(dbPantry.stockQuantity, 40);
    assert.equal(dbPantry.inStock, true);
    assert.ok(dbPantry.inventoryLogs.length >= 1);
    assert.equal(dbPantry.inventoryLogs[0].type, 'RESTOCK');

    const dbSaree = await prisma.product.findUnique({
      where: { sourceId: 's-test-banarasi-gold' },
      include: { variants: true },
    });
    assert.ok(dbSaree);
    assert.equal(dbSaree.variants.length, 1);
    assert.equal(dbSaree.variants[0].sku, 'TEST-SAR-GOLD-63');
  });

  it('7. Rejects duplicate products when importing again in CREATE_NEW mode', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Products');
    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
      { header: 'Product Name*', key: 'name' },
      { header: 'Category Code*', key: 'cat' },
      { header: 'Description*', key: 'desc' },
      { header: 'Primary Image URL*', key: 'img' },
    ];
    sheet.addRow([
      'food',
      'f-test-ragi-dosa', // Already imported above
      'Duplicate Ragi Dosa',
      'millets',
      'Duplicate test item',
      '/images/soup.jpg',
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const result = await validateProductImportWorkbook(buffer, { mode: 'CREATE_NEW' });

    assert.equal(result.valid, false);
    const dupErr = result.errors.find((e) => e.code === 'PRODUCT_ALREADY_EXISTS');
    assert.ok(dupErr, 'Should catch duplicate product code in database');
  });

  it('8. Supports UPDATE_EXISTING mode to safely update prices and specs', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Products');
    sheet.columns = [
      { header: 'Collection Code*', key: 'col' },
      { header: 'Product Code*', key: 'code' },
      { header: 'Product Name*', key: 'name' },
      { header: 'Category Code*', key: 'cat' },
      { header: 'Description*', key: 'desc' },
      { header: 'Primary Image URL*', key: 'img' },
      { header: 'Selling Price (INR)', key: 'price' },
      { header: 'Publication Status', key: 'status' },
    ];
    sheet.addRow([
      'food',
      'f-test-ragi-dosa',
      'Sprouted Ragi Dosa Crisps (Updated)',
      'millets',
      'Updated crisp description with single-origin Himalayan pink salt.',
      '/images/food/food-soups-hero.jpg',
      219, // Updated price
      'Published',
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const valResult = await validateProductImportWorkbook(buffer, { mode: 'UPDATE_EXISTING' });
    assert.equal(valResult.valid, true);

    const execResult = await executeProductImport(
      valResult,
      { mode: 'UPDATE_EXISTING' },
      { email: 'catalogue@amoga.com', id: 'admin-1' }
    );

    assert.equal(execResult.summary.productsUpdated, 1);

    const updated = await prisma.product.findUnique({
      where: { sourceId: 'f-test-ragi-dosa' },
    });
    assert.equal(updated.name, 'Sprouted Ragi Dosa Crisps (Updated)');
    assert.equal(Number(updated.price), 219);
  });

  it('9. Supports INITIAL_INVENTORY mode with full audit ledger tracking', async () => {
    const wb = new ExcelJS.Workbook();
    const invSheet = wb.addWorksheet('Inventory');
    invSheet.columns = [
      { header: 'Product Code*', key: 'code' },
      { header: 'Variant SKU', key: 'sku' },
      { header: 'New Stock Quantity*', key: 'stock' },
      { header: 'Low Stock Threshold', key: 'thresh' },
      { header: 'Adjustment Reason*', key: 'reason' },
    ];

    invSheet.addRow([
      'f-test-ragi-dosa',
      '',
      75,
      8,
      'Festive Diwali Restock Batch 01',
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const valResult = await validateProductImportWorkbook(buffer, { mode: 'INITIAL_INVENTORY' });
    assert.equal(valResult.valid, true);

    const execResult = await executeProductImport(
      valResult,
      { mode: 'INITIAL_INVENTORY' },
      { email: 'catalogue@amoga.com', id: 'admin-1' }
    );

    assert.equal(execResult.summary.inventoryLogsCreated, 1);

    const updated = await prisma.product.findUnique({
      where: { sourceId: 'f-test-ragi-dosa' },
      include: {
        inventoryLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    assert.equal(updated.stockQuantity, 75);
    assert.equal(updated.lowStockThreshold, 8);
    assert.equal(updated.inventoryLogs[0].reason, 'Festive Diwali Restock Batch 01');
    assert.equal(updated.inventoryLogs[0].delta, 35); // 75 - 40
  });

  it('10. POST /api/admin/products/import/error-report generates downloadable error report', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/import/error-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${catalogueToken}`,
      },
      body: JSON.stringify({
        errors: [
          {
            sheet: 'Products',
            row: 4,
            column: 'Selling Price (INR)',
            code: 'NEGATIVE_PRICE',
            message: 'Price cannot be negative.',
          },
        ],
        warnings: [],
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const arrayBuffer = await res.arrayBuffer();
    assert.ok(arrayBuffer.byteLength > 2000);
  });
});
