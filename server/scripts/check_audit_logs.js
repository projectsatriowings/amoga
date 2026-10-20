import { prisma } from '../src/config/prisma.js';

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: '8b5096d0-dc91-4e6a-a1be-2e3a28280e5f' },
        { action: { contains: 'PRODUCT' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Audit logs for products:', JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
