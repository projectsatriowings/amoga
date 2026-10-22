import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/adminAuth.js';

async function seedAdmin() {
  console.log('--- SEEDING ADMIN USERS & STORE DEFAULTS ---');

  const defaultAdmins = [
    {
      email: 'admin@amoga.com',
      name: 'Amoga Super Admin',
      password: 'Admin@Amoga2026!',
      role: 'SUPER_ADMIN',
    },
  ];

  for (const admin of defaultAdmins) {
    const passwordHash = hashPassword(admin.password);
    const user = await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: admin.role,
        isActive: true,
      },
      create: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        role: admin.role,
        isActive: true,
      },
    });
    console.log(`✓ Admin user configured: ${user.email} (${user.role})`);
  }

  // 2. Default Store Settings
  const settings = await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {
      contactEmail: 'amogastores05@gmail.com',
    },
    create: {
      id: 'default',
      storeName: 'Amoga Luxury Atelier',
      contactEmail: 'amogastores05@gmail.com',
      contactPhone: '+91 98200 12345',
      shippingStandardRate: 0.0,
      freeShippingThreshold: 2500.0,
      taxPercentage: 5.0,
      enableOrderNotifications: true,
      enableInventoryAlerts: true,
    },
  });
  console.log(`✓ Store settings initialized: ${settings.storeName}`);

  console.log('--- ADMIN SEED COMPLETE ---');
}

seedAdmin()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
