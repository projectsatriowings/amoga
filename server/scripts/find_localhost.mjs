import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const prods = await p.product.findMany();
  for (const pr of prods) {
    if (pr.image && pr.image.includes('localhost')) {
      console.log('PRODUCT IMAGE HAS LOCALHOST:', pr.id, pr.name, pr.image);
    }
    if (Array.isArray(pr.gallery)) {
      for (const g of pr.gallery) {
        if (typeof g === 'string' && g.includes('localhost')) {
          console.log('GALLERY HAS LOCALHOST:', pr.id, pr.name, g);
        }
      }
    }
  }

  // Also check reviews, inquiries, collections
  const cols = await p.collection.findMany();
  for (const c of cols) {
    if (c.heroImage && c.heroImage.includes('localhost')) console.log('COL HERO:', c.id, c.heroImage);
    if (c.cardImage && c.cardImage.includes('localhost')) console.log('COL CARD:', c.id, c.cardImage);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
