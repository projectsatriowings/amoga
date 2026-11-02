import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/adminAuth.js';

async function seedStallStaff() {
  console.log('--- SEEDING STALL STAFF ROLES ---');

  // Find active stall location to associate
  const stallLocation = await prisma.stockLocation.findFirst({
    where: { type: 'STALL', isActive: true },
  });

  const assignedLocationIds = stallLocation ? [stallLocation.id] : [];

  const defaultStallStaff = [
    {
      email: 'stallmanager@amoga.com',
      name: 'Karthik Raja (Stall Manager)',
      password: 'StallManager@Amoga2026!',
      role: 'STALL_MANAGER',
      assignedLocationIds,
    },
  ];

  for (const staff of defaultStallStaff) {
    const passwordHash = hashPassword(staff.password);
    const user = await prisma.adminUser.upsert({
      where: { email: staff.email },
      update: {
        role: staff.role,
        assignedLocationIds: staff.assignedLocationIds,
        isActive: true,
      },
      create: {
        email: staff.email,
        name: staff.name,
        passwordHash,
        role: staff.role,
        assignedLocationIds: staff.assignedLocationIds,
        isActive: true,
      },
    });
    console.log(`✓ Stall staff configured: ${user.email} (${user.role}) - Stalls:`, user.assignedLocationIds);
  }

  console.log('--- STALL STAFF SEED COMPLETE ---');
}

seedStallStaff()
  .catch((e) => {
    console.error('Error seeding stall staff:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
