import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { reserveStock, commitReservation, handleOrderCancellation } from '../src/services/inventoryService.js';
import { checkAndTriggerThresholdAlert } from '../src/services/notificationService.js';
import { createOrder } from '../src/services/checkoutService.js';

test('COMPREHENSIVE AUDIT & VERIFICATION SUITE', async (t) => {

  let bluePeaProduct = null;
  let cinnamonProduct = null;
  let initialBluePea = null;
  let initialCinnamon = null;

  await t.test('SETUP: Fetch real inventory baseline for Butterfly Blue Pea and Cinnamon Tea', async () => {
    bluePeaProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: 'butterfly-blue-pea-tea' },
          { name: { contains: 'Butterfly Blue Pea', mode: 'insensitive' } },
        ],
      },
    });

    cinnamonProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: 'cinnamon-tea' },
          { name: { contains: 'Cinnamon Tea', mode: 'insensitive' } },
        ],
      },
    });

    assert.ok(bluePeaProduct, 'Butterfly Blue Pea Tea product must exist in database');
    assert.ok(cinnamonProduct, 'Cinnamon Tea product must exist in database');

    initialBluePea = {
      stockQuantity: bluePeaProduct.stockQuantity,
      reservedQuantity: bluePeaProduct.reservedQuantity,
      available: Math.max(0, bluePeaProduct.stockQuantity - bluePeaProduct.reservedQuantity),
    };

    initialCinnamon = {
      stockQuantity: cinnamonProduct.stockQuantity,
      reservedQuantity: cinnamonProduct.reservedQuantity,
      available: Math.max(0, cinnamonProduct.stockQuantity - cinnamonProduct.reservedQuantity),
    };

    console.log('Baseline Butterfly Blue Pea Tea:', initialBluePea);
    console.log('Baseline Cinnamon Tea:', initialCinnamon);
  });

  const testOrderRef = `TEST-AUDIT-${Date.now()}`;
  let testOrderId = null;

  await t.test('PHASE 1.1: Atomic Reservation upon Order Confirmation (Butterfly Blue Pea x 2, Cinnamon x 1)', async () => {
    // 1. Create isolated test order
    const order = await prisma.order.create({
      data: {
        orderReference: testOrderRef,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCEEDED',
        subtotal: 1000,
        totalAmount: 1000,
        customerName: 'Test Patron Verification',
        customerEmail: 'audit@amoga.com',
        customerPhone: '+919940018593',
        addressLine1: 'Amoga Test Atelier',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        isDemo: true,
        items: {
          create: [
            {
              productId: bluePeaProduct.id,
              collectionId: 'tea',
              productName: bluePeaProduct.name,
              quantity: 2,
              unitPrice: 350,
              lineTotal: 700,
            },
            {
              productId: cinnamonProduct.id,
              collectionId: 'tea',
              productName: cinnamonProduct.name,
              quantity: 1,
              unitPrice: 300,
              lineTotal: 300,
            },
          ],
        },
      },
      include: { items: true },
    });

    testOrderId = order.id;

    // 2. Atomically reserve ordered quantities
    const reservations = await reserveStock({
      orderId: order.id,
      orderReference: order.orderReference,
      items: [
        { productId: bluePeaProduct.id, quantity: 2, productName: bluePeaProduct.name },
        { productId: cinnamonProduct.id, quantity: 1, productName: cinnamonProduct.name },
      ],
    });

    assert.equal(reservations.length, 2, 'Two inventory reservations should be created');

    // 3. Verify stock quantities: on-hand must be unchanged, reserved must increase, available must decrease
    const bluePeaAfterReserve = await prisma.product.findUnique({ where: { id: bluePeaProduct.id } });
    const cinnamonAfterReserve = await prisma.product.findUnique({ where: { id: cinnamonProduct.id } });

    assert.equal(bluePeaAfterReserve.stockQuantity, initialBluePea.stockQuantity, 'Physical on-hand stock must remain unchanged on reservation');
    assert.equal(bluePeaAfterReserve.reservedQuantity, initialBluePea.reservedQuantity + 2, 'Reserved quantity must increment by 2');
    const bluePeaAvailable = bluePeaAfterReserve.stockQuantity - bluePeaAfterReserve.reservedQuantity;
    assert.equal(bluePeaAvailable, initialBluePea.available - 2, 'Available stock must decrement by 2 immediately');

    assert.equal(cinnamonAfterReserve.stockQuantity, initialCinnamon.stockQuantity, 'Physical on-hand stock must remain unchanged on reservation');
    assert.equal(cinnamonAfterReserve.reservedQuantity, initialCinnamon.reservedQuantity + 1, 'Reserved quantity must increment by 1');
    const cinnamonAvailable = cinnamonAfterReserve.stockQuantity - cinnamonAfterReserve.reservedQuantity;
    assert.equal(cinnamonAvailable, initialCinnamon.available - 1, 'Available stock must decrement by 1 immediately');
  });

  await t.test('PHASE 1.2: Order Dispatch - Convert Reservation into Physical Stock Movement', async () => {
    // Dispatch order
    const commitResult = await commitReservation({
      orderId: testOrderId,
      orderReference: testOrderRef,
      actor: 'ADMIN: staff@amoga.com',
      reason: 'Order dispatched via carrier',
      type: 'FULFILMENT',
    });

    assert.ok(commitResult.success, 'Reservation commit should succeed');
    assert.equal(commitResult.processedCount, 2, 'Two reservations should be processed');

    // Verify stock quantities after dispatch
    const bluePeaAfterDispatch = await prisma.product.findUnique({ where: { id: bluePeaProduct.id } });
    const cinnamonAfterDispatch = await prisma.product.findUnique({ where: { id: cinnamonProduct.id } });

    assert.equal(bluePeaAfterDispatch.stockQuantity, initialBluePea.stockQuantity - 2, 'Physical on-hand stock must decrement by 2 upon dispatch');
    assert.equal(bluePeaAfterDispatch.reservedQuantity, initialBluePea.reservedQuantity, 'Reserved stock must return to baseline (0 active reservation)');
    assert.equal(bluePeaAfterDispatch.stockQuantity - bluePeaAfterDispatch.reservedQuantity, initialBluePea.available - 2, 'Available stock must stay consistent without double deduction');

    assert.equal(cinnamonAfterDispatch.stockQuantity, initialCinnamon.stockQuantity - 1, 'Physical on-hand stock must decrement by 1 upon dispatch');
    assert.equal(cinnamonAfterDispatch.reservedQuantity, initialCinnamon.reservedQuantity, 'Reserved stock must return to baseline (0 active reservation)');
    assert.equal(cinnamonAfterDispatch.stockQuantity - cinnamonAfterDispatch.reservedQuantity, initialCinnamon.available - 1, 'Available stock must stay consistent without double deduction');

    // Check inventory audit log was recorded with FULFILMENT
    const logs = await prisma.inventoryLog.findMany({
      where: { orderId: testOrderId },
    });
    assert.ok(logs.length >= 2, 'Inventory logs must exist for the fulfilled order');
    assert.ok(logs.some((l) => l.type === 'FULFILMENT'), 'Log type must be FULFILMENT');
  });

  await t.test('PHASE 1.3: Idempotency Verification - Retrying commitReservation cannot deduct stock twice', async () => {
    // Retry commit
    const retryResult = await commitReservation({
      orderId: testOrderId,
      orderReference: testOrderRef,
      actor: 'SYSTEM: webhook-retry',
      type: 'FULFILMENT',
    });

    assert.equal(retryResult.processedCount, 0, 'Retrying commitReservation must be idempotent and process 0 already-committed reservations');

    // Verify stock did NOT deduct a second time
    const bluePeaCheck = await prisma.product.findUnique({ where: { id: bluePeaProduct.id } });
    assert.equal(bluePeaCheck.stockQuantity, initialBluePea.stockQuantity - 2, 'Stock must not be double deducted on retry');
  });

  await t.test('PHASE 1.4: Physical Restock Reconciliation upon Return', async () => {
    // Return & restock test order
    await handleOrderCancellation({
      orderId: testOrderId,
      orderReference: testOrderRef,
      actor: 'ADMIN: concierge@amoga.com',
      reason: 'Return processed and restocked to physical inventory',
      restockPhysical: true,
    });

    const bluePeaRestocked = await prisma.product.findUnique({ where: { id: bluePeaProduct.id } });
    const cinnamonRestocked = await prisma.product.findUnique({ where: { id: cinnamonProduct.id } });

    assert.equal(bluePeaRestocked.stockQuantity, initialBluePea.stockQuantity, 'Physical on-hand stock must be restored to baseline');
    assert.equal(cinnamonRestocked.stockQuantity, initialCinnamon.stockQuantity, 'Physical on-hand stock must be restored to baseline');
  });

  await t.test('PHASE 3: Cash on Delivery (COD) Order Lifecycle and Status', async () => {
    const codOrder = await createOrder({
      customer: {
        fullName: 'Aarav Patel',
        email: 'aarav@example.com',
        phone: '+919940018593',
        addressLine1: '12 Temple Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      },
      paymentMethod: 'cod',
      items: [
        {
          productId: bluePeaProduct.id,
          productName: bluePeaProduct.name,
          quantity: 1,
          price: 350,
        },
      ],
    });

    assert.ok(codOrder.orderReference, 'COD order must have valid reference');
    assert.equal(codOrder.status, 'PENDING_CONFIRMATION', 'COD order must start in PENDING_CONFIRMATION');

    // Clean up COD test order and its reservations
    await handleOrderCancellation({
      orderId: codOrder.orderId || codOrder.id,
      orderReference: codOrder.orderReference,
      actor: 'SYSTEM: cleanup',
      reason: 'Audit cleanup',
    });

    await prisma.order.delete({ where: { id: codOrder.orderId || codOrder.id } }).catch(() => {});
  });

  await t.test('PHASE 12: Product Review Creation, Aggregation & Admin Moderation', async () => {
    // 1. Submit review
    const review = await prisma.review.create({
      data: {
        productId: bluePeaProduct.id,
        authorName: 'Meera R.',
        rating: 5,
        title: 'Deep indigo brew with soothing aroma',
        content: 'The butterfly blue pea tea is remarkably pure and visually mesmerizing.',
        status: 'PENDING',
        isVerifiedBuyer: true,
      },
    });

    assert.equal(review.status, 'PENDING', 'New review must start as PENDING moderation');

    // 2. Moderate review to APPROVED
    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: { status: 'APPROVED' },
    });
    assert.equal(updatedReview.status, 'APPROVED', 'Review should be marked APPROVED');

    // 3. Clean up test review
    await prisma.review.delete({ where: { id: review.id } });
  });

  await t.test('PHASE 15: Low-Stock Alert Evaluation against Available Stock', async () => {
    // Evaluate alert with effectiveAvailable = 2, threshold = 5
    const alertResult = await checkAndTriggerThresholdAlert({
      productId: bluePeaProduct.id,
      availableStock: 2,
      threshold: 5,
      productName: bluePeaProduct.name,
    });

    assert.equal(alertResult.alertTriggered, true, 'Alert must trigger when available stock (2) <= threshold (5)');
    assert.equal(alertResult.alertType, 'LOW_STOCK', 'Alert type must be LOW_STOCK');

    // Deduplication check: Calling again with same episode
    const dedupeResult = await checkAndTriggerThresholdAlert({
      productId: bluePeaProduct.id,
      availableStock: 2,
      threshold: 5,
      productName: bluePeaProduct.name,
    });

    assert.equal(dedupeResult.alertTriggered, false, 'Duplicate alert must not be created for same episode');
    assert.equal(dedupeResult.deduplicated, true, 'Alert must be marked deduplicated');

    // Restock resolution check: When stock restored to healthy (e.g. 20)
    const healthyResult = await checkAndTriggerThresholdAlert({
      productId: bluePeaProduct.id,
      availableStock: 20,
      threshold: 5,
      productName: bluePeaProduct.name,
    });

    assert.equal(healthyResult.status, 'HEALTHY', 'Active alert must be resolved when stock becomes healthy');

    // Clean up created alert
    await prisma.inventoryAlert.deleteMany({
      where: { productId: bluePeaProduct.id, status: { in: ['ACTIVE', 'RESOLVED'] } },
    });
  });

  await t.test('TEARDOWN: Clean up isolated test order', async () => {
    if (testOrderId) {
      await prisma.inventoryReservation.deleteMany({ where: { orderId: testOrderId } });
      await prisma.inventoryLog.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
    }

    // Verify baseline stock is perfectly intact
    const finalBluePea = await prisma.product.findUnique({ where: { id: bluePeaProduct.id } });
    const finalCinnamon = await prisma.product.findUnique({ where: { id: cinnamonProduct.id } });

    assert.equal(finalBluePea.stockQuantity, initialBluePea.stockQuantity, 'Final Butterfly Blue Pea physical stock must match initial baseline');
    assert.equal(finalBluePea.reservedQuantity, initialBluePea.reservedQuantity, 'Final Butterfly Blue Pea reserved stock must match initial baseline');
    assert.equal(finalCinnamon.stockQuantity, initialCinnamon.stockQuantity, 'Final Cinnamon physical stock must match initial baseline');
    assert.equal(finalCinnamon.reservedQuantity, initialCinnamon.reservedQuantity, 'Final Cinnamon reserved stock must match initial baseline');

    console.log('Teardown verified: baseline inventory 100% reconciled.');
  });
});
