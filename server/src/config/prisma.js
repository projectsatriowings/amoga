import './env.js';
import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Gracefully handle Neon serverless connection pooler (PgBouncer) idle timeouts & connection resets
basePrisma.$on('error', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  // When Neon suspends or PgBouncer drops idle TCP connections, Prisma logs:
  // - Linux/macOS: 'kind: Closed', 'Connection closed', 'Broken pipe'
  // - Windows: '10054', 'ConnectionReset', 'forcibly closed by the remote host', 'ECONNRESET'
  // - Neon pooler recycling: "Can't reach database server"
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

basePrisma.$on('warn', (e) => {
  const msg = typeof e === 'string' ? e : (e?.message || '');
  console.warn('[DATABASE WARNING]:', msg || e);
});

// Automatic retry extension for Neon serverless cold-start wakeups and pooled disconnects
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            lastError = err;
            const isTransient =
              err?.code === 'P1001' || // Can't reach database server (Neon cold-start waking up)
              err?.code === 'P1017' || // Server closed the connection
              err?.code === 'P2024' || // Timed out fetching a new connection from pool
              err?.message?.includes("Can't reach database server") ||
              err?.message?.includes('Connection closed') ||
              err?.message?.includes('10054') ||
              err?.message?.includes('ECONNRESET') ||
              err?.message?.includes('ConnectionReset') ||
              err?.message?.includes('Broken pipe');

            if (isTransient && attempt < 3) {
              console.warn(
                `[NEON DB COLD-START RECOVERY]: ${model}.${operation} encountered ${err.code || 'transient sleep'}. Retrying attempt ${attempt + 1}/3...`
              );
              await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
              continue;
            }
            throw err;
          }
        }
        throw lastError;
      },
    },
  },
});

export async function checkDatabaseHealth(maxRetries = 5, delayMs = 1500) {
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
