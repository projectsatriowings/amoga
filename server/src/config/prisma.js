import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Gracefully handle Neon serverless connection pooler (PgBouncer) idle timeouts
prisma.$on('error', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  // When Neon suspends or PgBouncer drops idle TCP connections, Prisma logs 'kind: Closed'.
  // Prisma automatically creates a fresh connection on the next query, so this is non-fatal.
  if (msg.includes('kind: Closed') || msg.includes('Connection closed') || msg.includes('Broken pipe')) {
    return;
  }
  console.error('[DATABASE ERROR]:', msg || e);
});

prisma.$on('warn', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  console.warn('[DATABASE WARNING]:', msg || e);
});

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}
