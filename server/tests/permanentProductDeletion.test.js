import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword, hashSessionToken, generateAdminSessionToken } from '../src/utils/adminAuth.js';

let server;
let baseUrl;
let catalogueToken;
let cashierToken;
let superAdminToken;

describe('Permanent Product Deletion & Archive Integrity Test Suite', () => {
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // 1. Authenticate or create Catalogue Manager
    const catalogueAdmin = await prisma.adminUser.upsert({
      where: { email: 'catalogue@amoga.com' },
      update: { role: 'CATALOGUE_MANAGER', isActive: true },
      create: {
        email: 'catalogue@amoga.com',
        name: 'Amoga Catalogue Manager',
        passwordHash: hashPassword('Catalogue@Amoga2026!'),
        role: 'CATALOGUE_MANAGER',
        isActive: true,
      },
    });

    const rawCatalogueToken = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: catalogueAdmin.id,
        tokenHash: hashSessionToken(rawCatalogueToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    catalogueToken = rawCatalogueToken;

    // 2. Create Stall Cashier (unauthorized staff)
    const cashierAdmin = await prisma.adminUser.upsert({
      where: { email: 'cashier_test_del@amoga.com' },
      update: { role: 'STALL_CASHIER', isActive: true },
      create: {
        email: 'cashier_test_del@amoga.com',
        name: 'Stall Cashier Test',
        passwordHash: hashPassword('Cashier@Amoga2026!'),
        role: 'STALL_CASHIER',
        isActive: true,
      },
    });

    const rawCashierToken = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: cashierAdmin.id,
        tokenHash: hashSessionToken(rawCashierToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    cashierToken = rawCashierToken;

    // 3. Super Admin token
    const superAdmin = await prisma.adminUser.upsert({
      where: { email: 'admin@amoga.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        email: 'admin@amoga.com',
        name: 'Super Admin',
        passwordHash: hashPassword('Admin@Amoga2026!'),
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    const rawSuperToken = generateAdminSessionToken();
    await prisma.adminSession.create({
      data: {
        adminId: superAdmin.id,
        tokenHash: hashSessionToken(rawSuperToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    superAdminToken = rawSuperToken;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. Unauthenticated DELETE /api/admin/products/:id is rejected with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/dummy-id`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'UNAUTHORIZED');
  });

  it('2. Unauthorized staff (STALL_CASHIER) is rejected with HTTP 403 FORBIDDEN', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/dummy-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'FORBIDDEN');
  });

  it('3. Deleting non-existent product ID returns HTTP 404 NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'NOT_FOUND');
  });

  it('4. Authorized Catalogue Manager permanently deletes an eligible test product and cleans PostgreSQL atomically', async () => {
    const testSlug = `eligible-del-tea-${Date.now().toString(36)}`;
    const testSourceId = `src-del-tea-${Date.now().toString(36)}`;

    // Create an isolated test product with variant, review, alert, and location inventory
    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Ephemeral Test Tea Leaf',
        collectionId: 'tea',
        category: 'Single Estate Leaf',
        description: 'Test product created specifically for permanent deletion verification.',
        price: 950.0,
        currency: 'INR',
        image: '/images/test-tea.jpg',
        stockQuantity: 20,
        inStock: true,
        sku: `DEL-${Date.now().toString(36).toUpperCase()}`,
        variants: {
          create: [
            {
              sourceId: `v-${testSourceId}-50g`,
              name: '50g Tester',
              price: 950.0,
              stockQuantity: 20,
              inStock: true,
              sku: `DEL-VAR-${Date.now().toString(36).toUpperCase()}`,
            },
          ],
        },
      },
      include: { variants: true },
    });

    const productId = product.id;
    const variantId = product.variants[0].id;

    // Attach eligible dependent records (review, restockSubscription, alert, inventoryLog)
    await prisma.review.create({
      data: {
        productId,
        authorName: 'Test Reviewer',
        rating: 5,
        content: 'Eligible review for deletion testing',
      },
    });

    await prisma.restockSubscription.create({
      data: {
        productId,
        variantId,
        destination: 'test_subscriber@example.com',
        channel: 'EMAIL',
      },
    });

    await prisma.inventoryAlert.create({
      data: {
        productId,
        variantId,
        alertType: 'LOW_STOCK',
        stockQuantity: 20,
        threshold: 5,
      },
    });

    await prisma.inventoryLog.create({
      data: {
        productId,
        variantId,
        previousStock: 0,
        adjustedStock: 20,
        delta: 20,
        reason: 'Initial test setup',
        adminEmail: 'catalogue@amoga.com',
      },
    });

    // Execute DELETE /api/admin/products/:id
    const deleteRes = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(deleteRes.status, 200);
    const deleteJson = await deleteRes.json();
    assert.equal(deleteJson.success, true);
    assert.equal(deleteJson.deletedProductId, productId);

    // Direct PostgreSQL Verification 1: Product row MUST NOT exist
    const dbProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    assert.equal(dbProduct, null, 'Product row must be completely removed from PostgreSQL');

    // Direct PostgreSQL Verification 2: Child variants MUST NOT exist
    const dbVariants = await prisma.productVariant.findMany({
      where: { productId },
    });
    assert.equal(dbVariants.length, 0, 'Associated variants must be completely removed');

    // Direct PostgreSQL Verification 3: Child reviews, subscriptions, alerts removed
    const dbReviews = await prisma.review.findMany({ where: { productId } });
    assert.equal(dbReviews.length, 0);

    const dbSubs = await prisma.restockSubscription.findMany({ where: { productId } });
    assert.equal(dbSubs.length, 0);

    const dbAlerts = await prisma.inventoryAlert.findMany({ where: { productId } });
    assert.equal(dbAlerts.length, 0);

    // Direct PostgreSQL Verification 4: Audit log MUST record PRODUCT_DELETE
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: 'PRODUCT_DELETE',
        entityId: productId,
        status: 'SUCCESS',
      },
    });
    assert.ok(auditRecord, 'Audit trail must record PRODUCT_DELETE action');
    assert.equal(auditRecord.adminEmail, 'catalogue@amoga.com');

    // Storefront Verification: Querying deleted product by slug must return 404
    const sfRes = await fetch(`${baseUrl}/api/products/tea/${testSlug}`);
    assert.equal(sfRes.status, 404, 'Storefront must return 404 for deleted product');
  });

  it('5. Safeguard: Product with historical customer OrderItem CANNOT be permanently deleted', async () => {
    const testSlug = `order-protected-${Date.now().toString(36)}`;
    const testSourceId = `src-order-${Date.now().toString(36)}`;

    // Create test product
    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Protected Vintage Heritage Tea',
        collectionId: 'tea',
        category: 'Single Estate Leaf',
        description: 'Test product referenced by customer order.',
        price: 1200.0,
        currency: 'INR',
        image: '/images/test-tea.jpg',
        stockQuantity: 15,
        inStock: true,
        sku: `ORD-PROT-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    // Create a mock order containing this product
    const order = await prisma.order.create({
      data: {
        orderReference: `AMOGA-TEST-${Date.now().toString(36).toUpperCase()}`,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCEEDED',
        subtotal: 1200.0,
        totalAmount: 1200.0,
        customerName: 'Test Customer',
        customerEmail: 'test_order_cust@example.com',
        customerPhone: '9876543210',
        addressLine1: '123 Atelier Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        isDemo: true,
        items: {
          create: [
            {
              productId: product.id,
              collectionId: 'tea',
              productName: product.name,
              unitPrice: 1200.0,
              quantity: 1,
              lineTotal: 1200.0,
              sku: product.sku,
            },
          ],
        },
      },
    });

    // Attempt permanent deletion
    const delRes = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(delRes.status, 409, 'Must return 409 Conflict when product is in historical order');
    const delJson = await delRes.json();
    assert.equal(delJson.error, 'PROTECTED_HISTORICAL_RECORD');
    assert.equal(delJson.canArchive, true);
    assert.ok(delJson.message.includes('cannot be permanently deleted because it is referenced in past customer orders'));

    // Verify product STILL exists in PostgreSQL
    const dbProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.ok(dbProduct, 'Product must NOT be deleted from PostgreSQL');

    // Verify audit log recorded PRODUCT_DELETE_BLOCKED
    const blockedLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PRODUCT_DELETE_BLOCKED',
        entityId: product.id,
        status: 'FAILURE',
      },
    });
    assert.ok(blockedLog, 'Audit trail must record blocked deletion attempt');

    // Clean up test order and product
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });

  it('6. Safeguard: Product with historical POS Sale CANNOT be permanently deleted', async () => {
    const testSlug = `pos-protected-${Date.now().toString(36)}`;
    const testSourceId = `src-pos-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Protected Stall Silver Spoon',
        collectionId: 'jewellery',
        category: 'Silverware',
        description: 'Test product referenced by POS stall bill.',
        price: 2500.0,
        currency: 'INR',
        image: '/images/test-pos.jpg',
        stockQuantity: 10,
        inStock: true,
        sku: `POS-PROT-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    const posSale = await prisma.posSale.create({
      data: {
        billNumber: `AMOGA-POS-TEST-${Date.now().toString(36).toUpperCase()}`,
        publicReceiptToken: `receipt_${Date.now().toString(36)}`,
        staffEmail: 'cashier@amoga.com',
        amountPaid: 2500.0,
        subtotal: 2500.0,
        taxableAmount: 2380.95,
        totalTaxAmount: 119.05,
        totalAmount: 2500.0,
        items: {
          create: [
            {
              productId: product.id,
              collectionId: 'jewellery',
              productName: product.name,
              sku: product.sku,
              gstRate: 5.0,
              unitPrice: 2500.0,
              quantity: 1,
              lineTotal: 2500.0,
              taxableAmount: 2380.95,
              totalTax: 119.05,
            },
          ],
        },
      },
    });

    // Attempt permanent deletion
    const delRes = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(delRes.status, 409);
    const delJson = await delRes.json();
    assert.equal(delJson.error, 'PROTECTED_HISTORICAL_RECORD');
    assert.equal(delJson.canArchive, true);

    // Verify product STILL exists
    const dbProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.ok(dbProduct);

    // Clean up
    await prisma.posSaleItem.deleteMany({ where: { posSaleId: posSale.id } });
    await prisma.posSale.delete({ where: { id: posSale.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });

  it('7. Safeguard: Product with active Inventory Reservation CANNOT be deleted', async () => {
    const testSlug = `res-protected-${Date.now().toString(36)}`;
    const testSourceId = `src-res-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Active Reserved Silk Scarf',
        collectionId: 'sarees',
        category: 'Silk Accessories',
        description: 'Test product with active reservation.',
        price: 3200.0,
        currency: 'INR',
        image: '/images/test-scarf.jpg',
        stockQuantity: 5,
        inStock: true,
        sku: `RES-PROT-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    const reservation = await prisma.inventoryReservation.create({
      data: {
        orderId: `temp_order_${Date.now()}`,
        orderReference: `REF-TEMP-${Date.now()}`,
        productId: product.id,
        quantity: 2,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // active in future
      },
    });

    // Attempt permanent deletion
    const delRes = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(delRes.status, 409);
    const delJson = await delRes.json();
    assert.equal(delJson.error, 'ACTIVE_RESERVATION');

    // Clean up
    await prisma.inventoryReservation.delete({ where: { id: reservation.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });

  it('8. Archive and Restore functionality continue to work seamlessly without data loss', async () => {
    const testSlug = `arch-rest-${Date.now().toString(36)}`;
    const testSourceId = `src-arch-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Cardamom Infused Black Tea',
        collectionId: 'tea',
        category: 'Spiced Blends',
        description: 'Test product for archive and restore verification.',
        price: 650.0,
        currency: 'INR',
        image: '/images/test-tea.jpg',
        stockQuantity: 40,
        inStock: true,
        isActive: true,
        sku: `ARCH-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    // 1. Archive Product
    const archRes = await fetch(`${baseUrl}/api/admin/products/${product.id}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(archRes.status, 200);

    // Verify in PostgreSQL: isActive is false, product record and ID retained
    const archivedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.ok(archivedProduct);
    assert.equal(archivedProduct.isActive, false);

    // Public listing query should not return archived product
    const pubRes = await fetch(`${baseUrl}/api/products/tea/${testSlug}`);
    assert.equal(pubRes.status, 404, 'Public storefront must not return archived product');

    // 2. Restore Product
    const restRes = await fetch(`${baseUrl}/api/admin/products/${product.id}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });
    assert.equal(restRes.status, 200);

    // Verify in PostgreSQL: isActive is true again, no duplicate created
    const restoredProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.ok(restoredProduct);
    assert.equal(restoredProduct.isActive, true);

    const countWithSlug = await prisma.product.count({
      where: { slug: testSlug },
    });
    assert.equal(countWithSlug, 1, 'Restore must not duplicate products');

    // Clean up
    await prisma.product.delete({ where: { id: product.id } });
  });

  it('9. Restore rejects unpriced products with HTTP 400 INVALID_PRICE', async () => {
    const testSlug = `unpriced-arch-${Date.now().toString(36)}`;
    const testSourceId = `src-unpriced-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        sourceId: testSourceId,
        slug: testSlug,
        name: 'Unpriced Artisanal Loom',
        collectionId: 'sarees',
        category: 'Silk Accessories',
        description: 'Unpriced bespoke product.',
        price: null, // unpriced
        currency: 'INR',
        image: '/images/test-saree.jpg',
        stockQuantity: 10,
        inStock: true,
        isActive: false,
        sku: `UNPR-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    const restRes = await fetch(`${baseUrl}/api/admin/products/${product.id}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${catalogueToken}` },
    });

    assert.equal(restRes.status, 400);
    const restJson = await restRes.json();
    assert.equal(restJson.error, 'INVALID_PRICE');

    // Clean up
    await prisma.product.delete({ where: { id: product.id } });
  });
});
