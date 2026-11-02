import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/adminAuth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedAdmin() {
  console.log('--- SEEDING ADMIN USERS & STORE DEFAULTS ---');

  // Super Admin credentials sourced from environment variables with safe defaults
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@amoga.com').trim().toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@Amoga2026!';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Amoga Super Admin';

  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.warn('⚠️  [SECURITY WARNING]: SUPER_ADMIN_PASSWORD is not set in .env. Using default fallback password.');
  }

  // 1. Seed exclusively the Super Admin
  const passwordHash = hashPassword(superAdminPassword);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordHash,
    },
    create: {
      email: superAdminEmail,
      name: superAdminName,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Super Admin configured: ${superAdmin.email} (${superAdmin.role})`);

  // 2. Remove all non-super-admin accounts from the database
  try {
    // Delete sessions for any other accounts
    await prisma.$executeRawUnsafe(
      `DELETE FROM admin_sessions WHERE "adminId" NOT IN ('${superAdmin.id}')`
    );
    // Unlink audit logs
    await prisma.$executeRawUnsafe(
      `UPDATE audit_logs SET "adminId" = NULL WHERE "adminId" NOT IN ('${superAdmin.id}')`
    );
    // Delete all other admin users
    const removedCount = await prisma.$executeRawUnsafe(
      `DELETE FROM admin_users WHERE id != '${superAdmin.id}'`
    );
    if (removedCount > 0) {
      console.log(`✓ Removed ${removedCount} non-super-admin user(s) from database.`);
    }
  } catch (err) {
    console.warn('Notice during non-super-admin cleanup:', err.message);
  }

  // 3. Default Store Settings
  const settings = await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Amoga Luxury Atelier',
      contactEmail: 'concierge@amoga.com',
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
