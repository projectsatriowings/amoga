import './env.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Gracefully handle Neon serverless connection pooler (PgBouncer) idle timeouts & connection resets
prisma.$on('error', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  // When Neon suspends or PgBouncer drops idle TCP connections, Prisma logs:
  // - Linux/macOS: 'kind: Closed', 'Connection closed', 'Broken pipe'
  // - Windows: '10054', 'ConnectionReset', 'forcibly closed by the remote host', 'ECONNRESET'
  // - Neon pooler recycling: "Can't reach database server"
  // Prisma automatically re-establishes a fresh connection on the next query, so these are non-fatal.
  const isTransientDisconnect =
    msg.includes('kind: Closed') ||
    msg.includes('Connection closed') ||
    msg.includes('Broken pipe') ||
    msg.includes('10054') ||
    msg.includes('ConnectionReset') ||
    msg.includes('forcibly closed by the remote host') ||
    msg.includes('ECONNRESET') ||
    msg.includes("Can't reach database server");

  if (isTransientDisconnect) {
    return;
  }
  console.error('[DATABASE ERROR]:', msg || e);
});

prisma.$on('warn', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  console.warn('[DATABASE WARNING]:', msg || e);
});

export async function checkDatabaseHealth(maxRetries = 4, delayMs = 1200) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      if (attempt < maxRetries) {
        // Neon pooler / serverless instance waking up or recycling TCP socket after server restart
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      console.error('Database health check failed after retries:', error.message);
      return false;
    }
  }
  return false;
}
