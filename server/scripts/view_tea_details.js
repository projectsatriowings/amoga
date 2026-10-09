import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const teas = await prisma.product.findMany({
    where: { category: 'teas' },
    include: { variants: true }
  });
  console.log('COUNT:', teas.length);
  console.log(JSON.stringify(teas, null, 2));

  // Check if any order items reference these tea products
  const orderItemsWithTeas = await prisma.orderItem.findMany({
    where: {
      productId: { in: teas.map(t => t.id) }
    }
  });
  console.log('ORDER ITEMS REFERENCING TEAS:', orderItemsWithTeas.length);
}

main().finally(() => prisma.$disconnect());
