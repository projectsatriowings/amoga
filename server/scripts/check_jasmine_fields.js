import { prisma } from '../src/config/prisma.js';

async function main() {
  const jasmine = await prisma.product.findMany({
    where: { name: { contains: 'Jasmine', mode: 'insensitive' } }
  });
  console.log('Jasmine products:', JSON.stringify(jasmine, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
