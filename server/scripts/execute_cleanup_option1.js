import { prisma } from '../src/config/prisma.js';

/**
 * AMOGA E-COMMERCE: OPTION 1 FULL CATALOG RESET
 * Executes safe, transactional deletion in strict foreign-key order.
 * Can be run in DRY RUN mode or LIVE EXECUTION mode.
 */
export async function executeCleanup(dryRun = true) {
  console.log(`=== AMOGA CATALOG CLEANUP (MODE: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}) ===\n`);

  const results = {};

  const operations = [
    { name: 'order_tracking_events', fn: () => prisma.orderTrackingEvent.deleteMany() },
    { name: 'order_items', fn: () => prisma.orderItem.deleteMany() },
    { name: 'payment_events', fn: () => prisma.paymentEvent.deleteMany() },
    { name: 'payments', fn: () => prisma.payment.deleteMany() },
    { name: 'inventory_reservations', fn: () => prisma.inventoryReservation.deleteMany() },
    { name: 'inventory_logs', fn: () => prisma.inventoryLog.deleteMany() },
    { name: 'restock_notification_jobs', fn: () => prisma.restockNotificationJob.deleteMany() },
    { name: 'pos_sale_items', fn: () => prisma.posSaleItem.deleteMany() },
    { name: 'pos_payment_records', fn: () => prisma.posPaymentRecord.deleteMany() },
    { name: 'pos_sales', fn: () => prisma.posSale.deleteMany() },
    { name: 'orders', fn: () => prisma.order.deleteMany() },
    { name: 'customer_sessions', fn: () => prisma.customerSession.deleteMany() },
    { name: 'customer_addresses', fn: () => prisma.customerAddress.deleteMany() },
    { name: 'customer_inquiries', fn: () => prisma.customerInquiry.deleteMany() },
    { name: 'customers', fn: () => prisma.customer.deleteMany() },
    { name: 'stock_transfer_items', fn: () => prisma.stockTransferItem.deleteMany() },
    { name: 'stock_transfers', fn: () => prisma.stockTransfer.deleteMany() },
    { name: 'location_movement_logs', fn: () => prisma.locationMovementLog.deleteMany() },
    { name: 'location_inventories', fn: () => prisma.locationInventory.deleteMany() },
    { name: 'product_variants', fn: () => prisma.productVariant.deleteMany() },
    { name: 'products', fn: () => prisma.product.deleteMany() },
  ];

  if (dryRun) {
    console.log('[DRY RUN]: Simulating deletion counts based on existing records...');
    for (const op of operations) {
      let count = 0;
      switch (op.name) {
        case 'order_tracking_events': count = await prisma.orderTrackingEvent.count(); break;
        case 'order_items': count = await prisma.orderItem.count(); break;
        case 'payment_events': count = await prisma.paymentEvent.count(); break;
        case 'payments': count = await prisma.payment.count(); break;
        case 'inventory_reservations': count = await prisma.inventoryReservation.count(); break;
        case 'inventory_logs': count = await prisma.inventoryLog.count(); break;
        case 'restock_notification_jobs': count = await prisma.restockNotificationJob.count(); break;
        case 'pos_sale_items': count = await prisma.posSaleItem.count(); break;
        case 'pos_payment_records': count = await prisma.posPaymentRecord.count(); break;
        case 'pos_sales': count = await prisma.posSale.count(); break;
        case 'orders': count = await prisma.order.count(); break;
        case 'customer_sessions': count = await prisma.customerSession.count(); break;
        case 'customer_addresses': count = await prisma.customerAddress.count(); break;
        case 'customer_inquiries': count = await prisma.customerInquiry.count(); break;
        case 'customers': count = await prisma.customer.count(); break;
        case 'stock_transfer_items': count = await prisma.stockTransferItem.count(); break;
        case 'stock_transfers': count = await prisma.stockTransfer.count(); break;
        case 'location_movement_logs': count = await prisma.locationMovementLog.count(); break;
        case 'location_inventories': count = await prisma.locationInventory.count(); break;
        case 'product_variants': count = await prisma.productVariant.count(); break;
        case 'products': count = await prisma.product.count(); break;
      }
      results[op.name] = count;
      console.log(`  - Table "${op.name}": would delete ${count} records`);
    }

    console.log('\n[DRY RUN SUMMARY]:');
    console.log(JSON.stringify(results, null, 2));

    const preservedCollections = await prisma.collection.findMany({ select: { id: true, name: true, slug: true } });
    console.log('\n[VERIFIED PRESERVED COLLECTIONS]:');
    console.log(JSON.stringify(preservedCollections, null, 2));

    await prisma.$disconnect();
    return results;
  }

  // Live execution mode within transaction
  console.log('[LIVE EXECUTION]: Running atomic database transaction...');
  await prisma.$transaction(async (tx) => {
    for (const op of operations) {
      console.log(`[EXECUTING]: Deleting records from "${op.name}"...`);
      // Use tx directly
      let res;
      switch (op.name) {
        case 'order_tracking_events': res = await tx.orderTrackingEvent.deleteMany(); break;
        case 'order_items': res = await tx.orderItem.deleteMany(); break;
        case 'payment_events': res = await tx.paymentEvent.deleteMany(); break;
        case 'payments': res = await tx.payment.deleteMany(); break;
        case 'inventory_reservations': res = await tx.inventoryReservation.deleteMany(); break;
        case 'inventory_logs': res = await tx.inventoryLog.deleteMany(); break;
        case 'restock_notification_jobs': res = await tx.restockNotificationJob.deleteMany(); break;
        case 'pos_sale_items': res = await tx.posSaleItem.deleteMany(); break;
        case 'pos_payment_records': res = await tx.posPaymentRecord.deleteMany(); break;
        case 'pos_sales': res = await tx.posSale.deleteMany(); break;
        case 'orders': res = await tx.order.deleteMany(); break;
        case 'customer_sessions': res = await tx.customerSession.deleteMany(); break;
        case 'customer_addresses': res = await tx.customerAddress.deleteMany(); break;
        case 'customer_inquiries': res = await tx.customerInquiry.deleteMany(); break;
        case 'customers': res = await tx.customer.deleteMany(); break;
        case 'stock_transfer_items': res = await tx.stockTransferItem.deleteMany(); break;
        case 'stock_transfers': res = await tx.stockTransfer.deleteMany(); break;
        case 'location_movement_logs': res = await tx.locationMovementLog.deleteMany(); break;
        case 'location_inventories': res = await tx.locationInventory.deleteMany(); break;
        case 'product_variants': res = await tx.productVariant.deleteMany(); break;
        case 'products': res = await tx.product.deleteMany(); break;
      }
      results[op.name] = res.count;
    }
  }, {
    timeout: 60000 // 60s timeout for transaction
  });

  console.log('\n[LIVE CLEANUP COMPLETED SUCCESSFULLY]!');
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
  return results;
}

// CLI execution
const isLive = process.argv.includes('--execute-live');
executeCleanup(!isLive).catch(async (e) => {
  console.error('[CLEANUP ERROR]:', e);
  await prisma.$disconnect();
  process.exit(1);
});
