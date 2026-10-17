import { prisma, checkDatabaseHealth } from '../src/config/prisma.js';

async function seedLocations() {
  console.log('Connecting to database...');
  const healthy = await checkDatabaseHealth();
  if (!healthy) {
    throw new Error('Database is not healthy');
  }
  console.log('✓ Database connected.');

  // Initialize Default Stock Locations if not present
  console.log('Verifying default stock locations...');
  const mainWarehouse = await prisma.stockLocation.upsert({
    where: { code: 'MAIN-WAREHOUSE' },
    update: {},
    create: {
      code: 'MAIN-WAREHOUSE',
      name: 'Amoga Central Warehouse',
      type: 'WAREHOUSE',
      city: 'Chennai',
      state: 'Tamil Nadu',
      isDefault: true,
      isActive: true,
    },
  });
  console.log(`✓ Main Warehouse: ${mainWarehouse.code} (${mainWarehouse.id})`);

  const onlineStore = await prisma.stockLocation.upsert({
    where: { code: 'ONLINE-STORE' },
    update: {},
    create: {
      code: 'ONLINE-STORE',
      name: 'Online Storefront Allocation Pool',
      type: 'ONLINE',
      city: 'Chennai',
      state: 'Tamil Nadu',
      isDefault: false,
      isActive: true,
    },
  });
  console.log(`✓ Online Store Location: ${onlineStore.code} (${onlineStore.id})`);

  // Auto-link existing Stall Events with a dedicated StockLocation
  const stallEvents = await prisma.stallEvent.findMany();
  for (const event of stallEvents) {
    const locCode = `STALL-${event.code}`;
    const loc = await prisma.stockLocation.upsert({
      where: { code: locCode },
      update: {
        stallEventId: event.id,
        name: `${event.name} Inventory`,
      },
      create: {
        code: locCode,
        name: `${event.name} Inventory`,
        type: 'STALL',
        stallEventId: event.id,
        city: event.city || 'Chennai',
        state: event.state || 'Tamil Nadu',
        isActive: event.status === 'ACTIVE',
      },
    });
    console.log(`✓ Stall Event Location linked: ${event.name} -> ${loc.code}`);
  }

  // Seed sample opening balance for the active stall if empty
  const activeStall = await prisma.stockLocation.findFirst({
    where: { type: 'STALL', isActive: true },
  });

  if (activeStall) {
    const existingCount = await prisma.locationInventory.count({
      where: { locationId: activeStall.id },
    });
    if (existingCount === 0) {
      console.log(`Allocating opening stall stock for ${activeStall.name}...`);
      const products = await prisma.product.findMany({
        take: 12,
        include: { variants: true },
      });
      for (const p of products) {
        if (p.variants && p.variants.length > 0) {
          for (const v of p.variants) {
            await prisma.locationInventory.create({
              data: {
                locationId: activeStall.id,
                productId: p.id,
                variantId: v.id,
                onHandQuantity: 15,
                reorderThreshold: 3,
                lastMovementAt: new Date(),
              },
            });
            await prisma.locationMovementLog.create({
              data: {
                locationId: activeStall.id,
                productId: p.id,
                variantId: v.id,
                previousQuantity: 0,
                newQuantity: 15,
                delta: 15,
                movementType: 'OPENING_BALANCE',
                reference: 'INIT-OPENING-BAL',
                actorEmail: 'admin@amoga.com',
                reason: 'Initial Stall Allocation',
              },
            });
          }
        } else {
          await prisma.locationInventory.create({
            data: {
              locationId: activeStall.id,
              productId: p.id,
              variantId: null,
              onHandQuantity: 20,
              reorderThreshold: 5,
              lastMovementAt: new Date(),
            },
          });
          await prisma.locationMovementLog.create({
            data: {
              locationId: activeStall.id,
              productId: p.id,
              variantId: null,
              previousQuantity: 0,
              newQuantity: 20,
              delta: 20,
              movementType: 'OPENING_BALANCE',
              reference: 'INIT-OPENING-BAL',
              actorEmail: 'admin@amoga.com',
              reason: 'Initial Stall Allocation',
            },
          });
        }
      }
      console.log('✓ Initial stall inventory allocated.');
    }
  }

  console.log('--- STOCK LOCATIONS SEEDING COMPLETED ---');
  await prisma.$disconnect();
  process.exit(0);
}

seedLocations().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
