import { prisma } from '../src/config/prisma.js';

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: { entityId: '8b5096d0-dc91-4e6a-a1be-2e3a28280e5f' },
    orderBy: { createdAt: 'asc' }
  });
  console.log('Logs for QA-TEST-DELETE-ME:', JSON.stringify(logs, null, 2));

  const prod = await prisma.product.findUnique({
    where: { id: '8b5096d0-dc91-4e6a-a1be-2e3a28280e5f' },
  });
  console.log('Product in DB:', JSON.stringify(prod, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
