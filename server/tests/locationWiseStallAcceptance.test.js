import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  createStockLocation,
  updateStockLocation,
  toggleStockLocationActive,
  getLocationInventory,
  adjustLocationStock,
  executeStockTransfer,
  listStockTransfers,
  listLocationMovementLogs,
  getStallInventoryReport,
} from '../src/services/stallInventoryService.js';
import { finalizePosSale } from '../src/services/posService.js';

describe('Location-Wise Stall Inventory Management — Acceptance Criteria', async () => {
  let warehouseLocation = null;
  let stallA = null; // Chennai Exhibition Stall
  let stallB = null; // Coimbatore Exhibition Stall
  let testProduct = null;
  const initialOnlineStock = 50;

  before(async () => {
    // 1. Ensure or find Central Warehouse
    warehouseLocation = await prisma.stockLocation.findFirst({
      where: { code: 'MAIN-WAREHOUSE' },
    });
    if (!warehouseLocation) {
      warehouseLocation = await prisma.stockLocation.create({
        data: {
          code: 'MAIN-WAREHOUSE',
          name: 'Central Warehouse Chennai',
          type: 'WAREHOUSE',
          city: 'Chennai',
          state: 'Tamil Nadu',
          isDefault: true,
          isActive: true,
        },
      });
    }

    // 2. Create a clean test product for isolated testing
    const collection = await prisma.collection.findFirst();
    const collectionId = collection ? collection.id : 'tea';

    testProduct = await prisma.product.create({
      data: {
        sourceId: `TEST-TEA-${Date.now().toString().slice(-4)}`,
        name: 'Nilgiri Silver Tips Tea Test',
        slug: `test-nilgiri-tea-${Date.now()}`,
        description: 'Single-estate white tea hand-plucked from the high-altitude peaks of the Nilgiris.',
        image: '/uploads/products/tea_test.jpg',
        sku: `AMOGA-TEA-${Date.now().toString().slice(-4)}`,
        collectionId,
        category: 'Single Estate',
        price: 450.0,
        stockQuantity: initialOnlineStock, // Isolated online stock
        hsnCode: '0902',
        gstRate: 5.0,
        isTaxInclusive: true,
        inStock: true,
      },
    });

    // 3. Set warehouse inventory for this test product to 100 units
    await adjustLocationStock({
      locationId: warehouseLocation.id,
      productId: testProduct.id,
      newQuantity: 100,
      reason: 'Initial central warehouse receipt for acceptance tests',
      actorEmail: 'admin@amoga.com',
    });
  });

  after(async () => {
    // Cleanup created test records
    try {
      if (stallA) {
        await prisma.locationMovementLog.deleteMany({ where: { locationId: stallA.id } });
        await prisma.locationInventory.deleteMany({ where: { locationId: stallA.id } });
        await prisma.stockTransferItem.deleteMany({ where: { transfer: { destinationLocationId: stallA.id } } });
        await prisma.stockTransfer.deleteMany({ where: { destinationLocationId: stallA.id } });
        await prisma.posSaleItem.deleteMany({ where: { posSale: { stockLocationId: stallA.id } } });
        await prisma.posSale.deleteMany({ where: { stockLocationId: stallA.id } });
        await prisma.stockLocation.delete({ where: { id: stallA.id } });
        if (stallA.stallEventId) {
          await prisma.stallEvent.delete({ where: { id: stallA.stallEventId } }).catch(() => {});
        }
      }
      if (stallB) {
        await prisma.locationMovementLog.deleteMany({ where: { locationId: stallB.id } });
        await prisma.locationInventory.deleteMany({ where: { locationId: stallB.id } });
        await prisma.stockTransferItem.deleteMany({ where: { transfer: { destinationLocationId: stallB.id } } });
        await prisma.stockTransfer.deleteMany({ where: { destinationLocationId: stallB.id } });
        await prisma.stockLocation.delete({ where: { id: stallB.id } });
        if (stallB.stallEventId) {
          await prisma.stallEvent.delete({ where: { id: stallB.stallEventId } }).catch(() => {});
        }
      }
      if (testProduct) {
        await prisma.locationMovementLog.deleteMany({ where: { productId: testProduct.id } });
        await prisma.locationInventory.deleteMany({ where: { productId: testProduct.id } });
        await prisma.product.delete({ where: { id: testProduct.id } });
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  });

  // Criteria 1: Create two or more stall locations
  test('1. Create two stall locations: Chennai and Coimbatore', async () => {
    stallA = await createStockLocation(
      {
        code: `STALL-CHN-${Date.now().toString().slice(-4)}`,
        name: 'Chennai Exhibition Stall',
        city: 'Chennai',
        venue: 'Chennai Trade Centre',
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 86400000),
        isActive: true,
        assignedStaffIds: ['chennai.staff@amoga.com'],
      },
      'admin@amoga.com'
    );

    stallB = await createStockLocation(
      {
        code: `STALL-CBE-${Date.now().toString().slice(-4)}`,
        name: 'Coimbatore Exhibition Stall',
        city: 'Coimbatore',
        venue: 'CODISSIA Trade Fair Complex',
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 86400000),
        isActive: true,
        assignedStaffIds: ['coimbatore.staff@amoga.com'],
      },
      'admin@amoga.com'
    );

    assert.ok(stallA.id, 'Stall A should have a unique UUID');
    assert.ok(stallB.id, 'Stall B should have a unique UUID');
    assert.equal(stallA.city, 'Chennai');
    assert.equal(stallB.city, 'Coimbatore');
    assert.notEqual(stallA.id, stallB.id);
  });

  // Criteria 2 & 3: Transfer 30 units to Stall A and 10 units to Stall B, verify balances
  test('2 & 3. Transfer 30 units to Stall A and 10 units to Stall B, then verify balances', async () => {
    // Transfer 30 units to Stall A
    const transfer1 = await executeStockTransfer({
      sourceLocationId: warehouseLocation.id,
      destinationLocationId: stallA.id,
      items: [{ productId: testProduct.id, quantity: 30 }],
      reason: 'Opening stock for Chennai Exhibition',
      actorEmail: 'admin@amoga.com',
    });
    assert.equal(transfer1.transfer.status, 'COMPLETED');

    // Transfer 10 units to Stall B
    const transfer2 = await executeStockTransfer({
      sourceLocationId: warehouseLocation.id,
      destinationLocationId: stallB.id,
      items: [{ productId: testProduct.id, quantity: 10 }],
      reason: 'Opening stock for Coimbatore Exhibition',
      actorEmail: 'admin@amoga.com',
    });
    assert.equal(transfer2.transfer.status, 'COMPLETED');

    // Verify Stall A inventory
    const invA = await getLocationInventory({ locationId: stallA.id });
    const itemA = invA.items.find((i) => i.productId === testProduct.id);
    assert.ok(itemA, 'Product should exist in Stall A inventory');
    assert.equal(itemA.onHandQuantity, 30);
    assert.equal(itemA.availableQuantity, 30);

    // Verify Stall B inventory
    const invB = await getLocationInventory({ locationId: stallB.id });
    const itemB = invB.items.find((i) => i.productId === testProduct.id);
    assert.ok(itemB, 'Product should exist in Stall B inventory');
    assert.equal(itemB.onHandQuantity, 10);
    assert.equal(itemB.availableQuantity, 10);

    // Verify Warehouse inventory: 100 - 30 - 10 = 60
    const invWh = await getLocationInventory({ locationId: warehouseLocation.id });
    const itemWh = invWh.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemWh.onHandQuantity, 60, 'Warehouse stock should be exactly 60');
  });

  // Criteria 4 & 5: Sell 5 units at Stall A, verify only Stall A decreases to 25
  test('4 & 5. Sell 5 units at Stall A: Stall A decreases to 25, Stall B stays 10, Warehouse stays 60', async () => {
    const saleResult = await finalizePosSale({
      stockLocationId: stallA.id,
      staffEmail: 'admin@amoga.com',
      staffRole: 'SUPER_ADMIN',
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          quantity: 5,
          unitPrice: 450.0,
          gstRate: 5,
          isTaxInclusive: true,
        },
      ],
      paymentMethod: 'CASH',
      amountPaid: 2250.0,
      idempotencyKey: `TEST-SALE-A-${Date.now()}`,
    });

    assert.ok(saleResult.sale.id, 'Sale must be finalized');
    assert.equal(saleResult.sale.stockLocationId, stallA.id, 'Sale must record Stall A location');

    // Verify Stall A: 30 - 5 = 25
    const invA = await getLocationInventory({ locationId: stallA.id });
    const itemA = invA.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemA.onHandQuantity, 25, 'Stall A must decrease to exactly 25');
    assert.equal(itemA.availableQuantity, 25);

    // Verify Stall B: remains untouched at 10
    const invB = await getLocationInventory({ locationId: stallB.id });
    const itemB = invB.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemB.onHandQuantity, 10, 'Stall B must remain at 10');

    // Verify Warehouse: remains untouched at 60
    const invWh = await getLocationInventory({ locationId: warehouseLocation.id });
    const itemWh = invWh.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemWh.onHandQuantity, 60, 'Central Warehouse must remain at 60');

    // Verify Online stock in product table: completely untouched at initial 50
    const onlineProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert.equal(onlineProduct.stockQuantity, initialOnlineStock, 'Online stock must remain isolated and untouched');
  });

  // Criteria 6: Prevent sales beyond a stall's available stock
  test('6. Prevent sales beyond a stall available stock', async () => {
    // Stall A now has 25 units. Attempting to sell 26 must be rejected with 422.
    await assert.rejects(
      async () => {
        await finalizePosSale({
          stockLocationId: stallA.id,
          staffEmail: 'admin@amoga.com',
          staffRole: 'SUPER_ADMIN',
          items: [
            {
              productId: testProduct.id,
              productName: testProduct.name,
              quantity: 26, // exceeds 25
              unitPrice: 450.0,
            },
          ],
        });
      },
      (err) => {
        assert.ok(err.message.includes('Insufficient stall stock'), 'Should throw insufficient stock error');
        return true;
      }
    );

    // Stall A must still be 25
    const invA = await getLocationInventory({ locationId: stallA.id });
    const itemA = invA.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemA.onHandQuantity, 25, 'Stock must not change on rejected sale');
  });

  // Criteria 7: Prevent duplicate deductions on repeated requests (Idempotency)
  test('7. Prevent duplicate deductions on repeated requests with same idempotencyKey', async () => {
    const key = `IDEMP-KEY-${Date.now()}`;

    // First request
    const first = await finalizePosSale({
      stockLocationId: stallA.id,
      staffEmail: 'admin@amoga.com',
      staffRole: 'SUPER_ADMIN',
      idempotencyKey: key,
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          quantity: 2,
          unitPrice: 450.0,
        },
      ],
      amountPaid: 900.0,
    });
    assert.equal(first.isDuplicate, false);

    // Second request with same key
    const second = await finalizePosSale({
      stockLocationId: stallA.id,
      staffEmail: 'admin@amoga.com',
      staffRole: 'SUPER_ADMIN',
      idempotencyKey: key,
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          quantity: 2,
          unitPrice: 450.0,
        },
      ],
      amountPaid: 900.0,
    });
    assert.equal(second.isDuplicate, true, 'Second call must be flagged as duplicate');
    assert.equal(second.sale.id, first.sale.id, 'Should return the identical sale record');

    // Balance should only have decreased by 2 (25 - 2 = 23), NOT by 4
    const invA = await getLocationInventory({ locationId: stallA.id });
    const itemA = invA.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemA.onHandQuantity, 23, 'Duplicate request must not deduct stock twice');
  });

  // Criteria 8: Audited stock adjustments
  test('8. Record audited stock adjustments with mandatory reason', async () => {
    // Record adjustment of +5 at Stall B (10 -> 15)
    const adjustResult = await adjustLocationStock({
      locationId: stallB.id,
      productId: testProduct.id,
      newQuantity: 15,
      reason: 'Physical inventory recount at exhibition opening',
      actorEmail: 'auditor@amoga.com',
    });

    assert.equal(adjustResult.inventory.onHandQuantity, 15);
    assert.equal(adjustResult.delta, 5);
    assert.equal(adjustResult.newQuantity, 15);

    const log = await prisma.locationMovementLog.findFirst({
      where: { locationId: stallB.id, movementType: 'ADJUSTMENT' },
    });
    assert.ok(log, 'Adjustment log must exist');
    assert.equal(log.delta, 5);
    assert.equal(log.reason, 'Physical inventory recount at exhibition opening');

    // Verify Stall B is now 15
    const invB = await getLocationInventory({ locationId: stallB.id });
    const itemB = invB.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemB.onHandQuantity, 15);
  });

  // Criteria 9: Staff stall authorization enforcement
  test('9. Restrict assigned staff from billing at unauthorized stalls', async () => {
    // A staff member assigned only to Chennai Stall attempts to bill at Coimbatore Stall
    await assert.rejects(
      async () => {
        await finalizePosSale({
          stockLocationId: stallB.id, // Coimbatore
          staffEmail: 'chennai.staff@amoga.com', // assigned to Chennai
          staffRole: 'ORDER_MANAGER', // Non-superadmin
          items: [
            {
              productId: testProduct.id,
              productName: testProduct.name,
              quantity: 1,
              unitPrice: 450.0,
            },
          ],
        });
      },
      (err) => {
        assert.ok(
          err.message.includes('Staff authorization restricted') || err.status === 403,
          'Non-superadmin staff must be restricted to their assigned stall'
        );
        return true;
      }
    );
  });

  // Criteria 10: Stall renaming and deactivation safety
  test('10. Stall renaming and deactivation preserves all historical records', async () => {
    // Rename Stall A
    const renamed = await updateStockLocation(
      stallA.id,
      { name: 'Chennai Grand Exhibition Stall (Renamed)' },
      'admin@amoga.com'
    );
    assert.equal(renamed.name, 'Chennai Grand Exhibition Stall (Renamed)');

    // Historical sales and balances are intact
    const invA = await getLocationInventory({ locationId: stallA.id });
    const itemA = invA.items.find((i) => i.productId === testProduct.id);
    assert.equal(itemA.onHandQuantity, 23, 'Inventory balance must be unchanged after renaming');

    // Toggle active state to inactive
    const toggled = await toggleStockLocationActive(stallA.id, 'admin@amoga.com');
    assert.equal(toggled.isActive, false, 'Location should be deactivated');

    // Movement logs still exist
    const logs = await listLocationMovementLogs({ locationId: stallA.id });
    assert.ok(logs.logs.length > 0, 'Movement audit ledger must be completely preserved');
  });

  // Criteria 11: Combined view query across all stalls
  test('11. Consolidated view across all stalls retrieves isolated balances', async () => {
    // Reactivate stall A for query
    await toggleStockLocationActive(stallA.id, 'admin@amoga.com');

    const consolidated = await getLocationInventory({
      locationId: 'all',
      query: testProduct.name,
    });
    assert.ok(consolidated.items.length > 0, 'Consolidated inventory must return items');

    const productRecords = consolidated.items.filter((i) => i.productId === testProduct.id);
    // Should have records for warehouse (60), Stall A (23), and Stall B (15)
    assert.ok(productRecords.length >= 2, 'Should return separate balance records per location');

    const chennaiRec = productRecords.find((r) => r.locationId === stallA.id);
    const cbeRec = productRecords.find((r) => r.locationId === stallB.id);

    assert.ok(chennaiRec, 'Must have Chennai balance');
    assert.ok(cbeRec, 'Must have Coimbatore balance');
    assert.equal(chennaiRec.onHandQuantity, 23);
    assert.equal(cbeRec.onHandQuantity, 15);
  });

  // Criteria 12: Stall Dashboard inventory report
  test('12. Stall inventory report returns correct quantities held by location', async () => {
    const report = await getStallInventoryReport();
    assert.ok(report.locationsSummary, 'Report must contain locationsSummary');

    const stallASummary = report.locationsSummary.find((s) => s.locationId === stallA.id);
    const stallBSummary = report.locationsSummary.find((s) => s.locationId === stallB.id);

    assert.ok(stallASummary, 'Summary must include Stall A');
    assert.ok(stallBSummary, 'Summary must include Stall B');
    assert.ok(stallASummary.totalUnitsOnHand >= 23, 'Stall A held units must match');
    assert.ok(stallBSummary.totalUnitsOnHand >= 15, 'Stall B held units must match');
  });
});
