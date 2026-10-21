import { prisma } from '../src/config/prisma.js';

async function classify() {
  console.log('=== DATA CLASSIFICATION & DRY RUN ANALYSIS ===\n');

  // 1. PRODUCTS
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sourceId: true,
      collectionId: true,
      name: true,
      sourceCatalogue: true,
      verified: true,
      isActive: true,
      price: true,
      stockQuantity: true,
      createdAt: true
    }
  });

  const productCatalogues = {};
  for (const p of products) {
    const cat = p.sourceCatalogue || 'UNSPECIFIED';
    productCatalogues[cat] = (productCatalogues[cat] || 0) + 1;
  }
  console.log('1. PRODUCTS BY SOURCE CATALOGUE:');
  console.log(JSON.stringify(productCatalogues, null, 2));

  // 2. CUSTOMERS
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          sessions: true
        }
      }
    }
  });

  const testCustomers = [];
  const realOrUncertainCustomers = [];

  for (const c of customers) {
    const isExampleDomain = c.email.endsWith('@example.com') || c.email.includes('test') || c.email.includes('demo');
    if (isExampleDomain) {
      testCustomers.push({ email: c.email, name: c.name, orders: c._count.orders });
    } else {
      realOrUncertainCustomers.push({ email: c.email, name: c.name, phone: c.phone, orders: c._count.orders, created: c.createdAt });
    }
  }

  console.log(`\n2. CUSTOMERS (Total: ${customers.length}):`);
  console.log(`- Confirmed Test (@example.com/test/demo): ${testCustomers.length}`);
  console.log(`- Real / Uncertain Domain Accounts: ${realOrUncertainCustomers.length}`);
  console.log('Real/Uncertain Customer Accounts:', JSON.stringify(realOrUncertainCustomers, null, 2));

  // 3. ORDERS
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderReference: true,
      customerEmail: true,
      customerName: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      isDemo: true,
      createdAt: true,
      _count: {
        select: {
          payments: true,
          items: true
        }
      }
    }
  });

  const confirmedTestOrders = [];
  const uncertainOrders = [];

  for (const o of orders) {
    const isExampleEmail = o.customerEmail.endsWith('@example.com') || o.customerEmail.includes('test');
    if (o.isDemo || isExampleEmail) {
      confirmedTestOrders.push(o.orderReference);
    } else {
      uncertainOrders.push({
        ref: o.orderReference,
        email: o.customerEmail,
        name: o.customerName,
        total: o.totalAmount,
        status: o.status,
        paymentStatus: o.paymentStatus,
        created: o.createdAt
      });
    }
  }

  console.log(`\n3. ORDERS (Total: ${orders.length}):`);
  console.log(`- Confirmed Test Orders (isDemo=true or @example.com): ${confirmedTestOrders.length}`);
  console.log(`- Non-example email Orders (Potential Real/User Test): ${uncertainOrders.length}`);
  console.log('Non-example email Orders:', JSON.stringify(uncertainOrders, null, 2));

  // 4. PAYMENTS
  const payments = await prisma.payment.findMany({
    select: {
      id: true,
      paymentReference: true,
      provider: true,
      status: true,
      amount: true,
      order: {
        select: {
          orderReference: true,
          customerEmail: true,
          isDemo: true
        }
      }
    }
  });

  let testPayments = 0;
  let uncertainPayments = 0;
  for (const p of payments) {
    if (p.provider === 'test' || p.order?.isDemo || p.order?.customerEmail.endsWith('@example.com')) {
      testPayments++;
    } else {
      uncertainPayments++;
    }
  }
  console.log(`\n4. PAYMENTS (Total: ${payments.length}):`);
  console.log(`- Confirmed Test Payments: ${testPayments}`);
  console.log(`- Uncertain Payments (linked to non-example customer emails): ${uncertainPayments}`);

  // 5. INVENTORIES & RESERVATIONS
  const reservations = await prisma.inventoryReservation.count();
  const alerts = await prisma.inventoryAlert.count();
  const logs = await prisma.inventoryLog.count();
  console.log(`\n5. INVENTORY & RESERVATIONS:`);
  console.log(`- Reservations: ${reservations}`);
  console.log(`- Alerts: ${alerts}`);
  console.log(`- Inventory Logs: ${logs}`);

  // 6. POS SALES
  const posSales = await prisma.posSale.findMany({
    select: {
      id: true,
      billNumber: true,
      customerName: true,
      customerPhone: true,
      totalAmount: true,
      status: true,
      createdAt: true
    }
  });
  console.log(`\n6. POS SALES (Total: ${posSales.length}):`);
  console.log(JSON.stringify(posSales, null, 2));

  // 7. INQUIRIES
  const inquiries = await prisma.customerInquiry.findMany({
    select: {
      id: true,
      reference: true,
      email: true,
      fullName: true,
      subject: true,
      createdAt: true
    }
  });
  const testInquiries = inquiries.filter((i) => i.email.endsWith('@example.com'));
  const nonExampleInquiries = inquiries.filter((i) => !i.email.endsWith('@example.com'));
  console.log(`\n7. INQUIRIES (Total: ${inquiries.length}):`);
  console.log(`- Confirmed Test Inquiries (@example.com): ${testInquiries.length}`);
  console.log(`- Non-example Inquiries: ${nonExampleInquiries.length}`);
  if (nonExampleInquiries.length > 0) {
    console.log(JSON.stringify(nonExampleInquiries, null, 2));
  }

  // 8. ADMIN USERS
  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true
    }
  });
  console.log(`\n8. ADMIN USERS (Total: ${admins.length}):`);
  console.log(JSON.stringify(admins, null, 2));

  await prisma.$disconnect();
}

classify().catch(async (e) => {
  console.error('Classification error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
