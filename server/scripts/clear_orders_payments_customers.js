import { prisma } from '../src/config/prisma.js';

async function clearOrdersPaymentsCustomers() {
  console.log('--- STARTING TRANSACTIONAL DATA CLEANUP ---');

  const beforeCounts = {
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    orderTrackingEvents: await prisma.orderTrackingEvent.count(),
    payments: await prisma.payment.count(),
    paymentEvents: await prisma.paymentEvent.count(),
    customers: await prisma.customer.count(),
    customerSessions: await prisma.customerSession.count(),
    customerAddresses: await prisma.customerAddress.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
    reviews: await prisma.review.count(),
    inventoryReservations: await prisma.inventoryReservation.count(),
    posSales: await prisma.posSale.count(),
  };

  console.log('[BEFORE COUNTS]:', JSON.stringify(beforeCounts, null, 2));

  // 1. Payment events and payments
  const deletedPaymentEvents = await prisma.paymentEvent.deleteMany({});
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✓ Deleted ${deletedPaymentEvents.count} payment events and ${deletedPayments.count} payments`);

  // 2. Order tracking events and order items
  const deletedTrackingEvents = await prisma.orderTrackingEvent.deleteMany({});
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${deletedTrackingEvents.count} tracking events and ${deletedOrderItems.count} order items`);

  // 3. Inventory reservations tied to orders
  const deletedReservations = await prisma.inventoryReservation.deleteMany({});
  console.log(`✓ Deleted ${deletedReservations.count} inventory reservations`);

  // 4. Orders
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} orders`);

  // 5. Customer sessions, addresses, reset tokens, reviews, restock subscriptions
  const deletedSessions = await prisma.customerSession.deleteMany({});
  const deletedAddresses = await prisma.customerAddress.deleteMany({});
  const deletedResetTokens = await prisma.passwordResetToken.deleteMany({});
  const deletedReviews = await prisma.review.deleteMany({});
  const deletedRestockSubs = await prisma.restockSubscription.deleteMany({});
  console.log(`✓ Deleted ${deletedSessions.count} customer sessions, ${deletedAddresses.count} addresses, and ${deletedResetTokens.count} reset tokens`);

  // 6. Customers
  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`✓ Deleted ${deletedCustomers.count} customers`);

  // 7. POS Sales (if any)
  const deletedPosPayments = await prisma.posPaymentRecord.deleteMany({});
  const deletedPosItems = await prisma.posSaleItem.deleteMany({});
  const deletedPosSales = await prisma.posSale.deleteMany({});
  console.log(`✓ Deleted ${deletedPosSales.count} POS sales`);

  const afterCounts = {
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    orderTrackingEvents: await prisma.orderTrackingEvent.count(),
    payments: await prisma.payment.count(),
    paymentEvents: await prisma.paymentEvent.count(),
    customers: await prisma.customer.count(),
    customerSessions: await prisma.customerSession.count(),
    customerAddresses: await prisma.customerAddress.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
    reviews: await prisma.review.count(),
    inventoryReservations: await prisma.inventoryReservation.count(),
    posSales: await prisma.posSale.count(),
    // Preserved tables
    adminUsersPreserved: await prisma.adminUser.count(),
    productsPreserved: await prisma.product.count(),
    collectionsPreserved: await prisma.collection.count(),
    gstRateMasterPreserved: await prisma.gstRateMaster.count(),
  };

  console.log('[AFTER COUNTS]:', JSON.stringify(afterCounts, null, 2));
  console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

clearOrdersPaymentsCustomers().catch((err) => {
  console.error('[CLEANUP ERROR]:', err);
  process.exit(1);
});
