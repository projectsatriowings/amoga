import { prisma } from '../src/config/prisma.js';

async function audit() {
  console.log('=== AMOGA DATABASE AUDIT — STARTING ===');

  const models = [
    'collection',
    'product',
    'productVariant',
    'order',
    'orderItem',
    'orderTrackingEvent',
    'customer',
    'customerSession',
    'customerAddress',
    'payment',
    'paymentEvent',
    'adminUser',
    'adminSession',
    'auditLog',
    'customerInquiry',
    'inventoryLog',
    'storeSetting',
    'inventoryReservation',
    'restockSubscription',
    'inventoryAlert',
    'restockNotificationJob',
    'review',
    'skuSequence',
    'hsnReference',
    'gstRateMaster',
    'stallEvent',
    'posSale',
    'posSaleItem',
    'posPaymentRecord',
    'posSequence',
    'posSetting',
    'stockLocation',
    'locationInventory',
    'stockTransfer',
    'stockTransferItem',
    'locationMovementLog',
    'passwordResetToken'
  ];

  const counts = {};
  for (const m of models) {
    try {
      if (prisma[m] && typeof prisma[m].count === 'function') {
        counts[m] = await prisma[m].count();
      } else {
        counts[m] = 'N/A';
      }
    } catch (err) {
      counts[m] = `Error: ${err.message}`;
    }
  }

  console.log('--- BASELINE TABLE RECORD COUNTS ---');
  console.log(JSON.stringify(counts, null, 2));

  // 1. Detailed breakdown of Collections
  const collections = await prisma.collection.findMany();
  console.log('\n--- COLLECTIONS DETAIL ---');
  for (const c of collections) {
    const prodCount = await prisma.product.count({ where: { collectionId: c.id } });
    console.log(`Collection: id="${c.id}", name="${c.name}", slug="${c.slug}", isActive=${c.isActive}, productCount=${prodCount}`);
  }

  // 2. Detailed breakdown of Products per Collection & sourceCatalogue
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sourceId: true,
      collectionId: true,
      name: true,
      category: true,
      price: true,
      stockQuantity: true,
      sourceCatalogue: true,
      verified: true,
      isActive: true,
      createdAt: true
    }
  });
  console.log(`\n--- PRODUCTS BREAKDOWN (Total: ${products.length}) ---`);
  const byCollection = {};
  for (const p of products) {
    byCollection[p.collectionId] = (byCollection[p.collectionId] || 0) + 1;
  }
  console.log('Products by Collection:', byCollection);

  // 3. Detailed breakdown of Orders & Payments
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      payments: true
    }
  });
  console.log(`\n--- ORDERS DETAIL (Total: ${orders.length}) ---`);
  for (const o of orders) {
    console.log(`Order: ref=${o.orderReference}, status=${o.status}, paymentStatus=${o.paymentStatus}, total=${o.totalAmount}, isDemo=${o.isDemo}, customer=${o.customerEmail}, items=${o.items.length}, payments=${o.payments.length}, created=${o.createdAt.toISOString()}`);
  }

  // 4. Payments detail
  const payments = await prisma.payment.findMany();
  console.log(`\n--- PAYMENTS DETAIL (Total: ${payments.length}) ---`);
  for (const pay of payments) {
    console.log(`Payment: ref=${pay.paymentReference}, provider=${pay.provider}, status=${pay.status}, amount=${pay.amount}, providerOrderId=${pay.providerOrderId}, providerPaymentId=${pay.providerPaymentId}, created=${pay.createdAt.toISOString()}`);
  }

  // 5. Payment Events detail
  const paymentEvents = await prisma.paymentEvent.findMany();
  console.log(`\n--- PAYMENT EVENTS DETAIL (Total: ${paymentEvents.length}) ---`);
  for (const pe of paymentEvents) {
    console.log(`PaymentEvent: id=${pe.id}, provider=${pe.provider}, eventType=${pe.eventType}, status=${pe.status}, orderRef=${pe.orderReference}, received=${pe.receivedAt.toISOString()}`);
  }

  // 6. Customers detail
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      isActive: true,
      createdAt: true
    }
  });
  console.log(`\n--- CUSTOMERS DETAIL (Total: ${customers.length}) ---`);
  for (const cust of customers) {
    console.log(`Customer: email=${cust.email}, name="${cust.name}", phone=${cust.phone}, isActive=${cust.isActive}, created=${cust.createdAt.toISOString()}`);
  }

  // 7. Admin & Staff accounts
  const adminUsers = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true
    }
  });
  console.log(`\n--- ADMIN & STAFF USERS DETAIL (Total: ${adminUsers.length}) ---`);
  for (const u of adminUsers) {
    console.log(`Admin/Staff: id=${u.id}, email=${u.email}, name="${u.name}", role=${u.role}, active=${u.isActive}, lastLogin=${u.lastLoginAt}`);
  }

  // 8. Reviews, Inquiries, StockLocations
  const reviews = await prisma.review.findMany();
  console.log(`\n--- REVIEWS (Total: ${reviews.length}) ---`);
  for (const r of reviews) {
    console.log(`Review: id=${r.id}, product=${r.productId}, author="${r.authorName}", rating=${r.rating}, status=${r.status}, isVerifiedBuyer=${r.isVerifiedBuyer}`);
  }

  const inquiries = await prisma.customerInquiry.findMany();
  console.log(`\n--- CUSTOMER INQUIRIES (Total: ${inquiries.length}) ---`);
  for (const inq of inquiries) {
    console.log(`Inquiry: ref=${inq.reference}, from=${inq.email}, subject="${inq.subject}", status=${inq.status}, created=${inq.createdAt.toISOString()}`);
  }

  const locations = await prisma.stockLocation.findMany();
  console.log(`\n--- STOCK LOCATIONS (Total: ${locations.length}) ---`);
  for (const loc of locations) {
    console.log(`Location: code=${loc.code}, name="${loc.name}", type=${loc.type}, active=${loc.isActive}`);
  }

  const stallEvents = await prisma.stallEvent.findMany();
  console.log(`\n--- STALL EVENTS (Total: ${stallEvents.length}) ---`);
  for (const se of stallEvents) {
    console.log(`StallEvent: code=${se.code}, name="${se.name}", venue="${se.venue}", status=${se.status}`);
  }

  const posSales = await prisma.posSale.findMany({
    select: {
      id: true,
      billNumber: true,
      customerName: true,
      totalAmount: true,
      status: true,
      createdAt: true
    }
  });
  console.log(`\n--- POS SALES (Total: ${posSales.length}) ---`);
  for (const ps of posSales) {
    console.log(`PosSale: bill=${ps.billNumber}, customer="${ps.customerName}", total=${ps.totalAmount}, status=${ps.status}, created=${ps.createdAt.toISOString()}`);
  }

  console.log('\n=== AUDIT COMPLETE ===');
  await prisma.$disconnect();
}

audit().catch(async (e) => {
  console.error('Audit failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
