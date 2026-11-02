import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const p = new PrismaClient();

async function main() {
  const prods = await p.product.findMany({ select: { id: true, name: true, image: true, gallery: true } });
  fs.writeFileSync('scratch_images.txt', JSON.stringify(prods, null, 2), 'utf8');
}

main().catch(console.error).finally(() => p.$disconnect());
