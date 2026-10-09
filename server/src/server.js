import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth, prisma } from './config/prisma.js';

async function startServer() {
  console.log('--- STARTING AMOGA E-COMMERCE BACKEND SERVER ---');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Target Port: ${env.PORT}`);

  // Check database connectivity
  const dbConnected = await checkDatabaseHealth();
  if (!dbConnected) {
    console.error('FATAL: Could not establish initial connection to PostgreSQL database.');
    console.error('Verify DATABASE_URL and network accessibility to Neon cluster.');
    process.exit(1);
  }
  console.log('✓ PostgreSQL database connected successfully.');

  const server = app.listen(env.PORT, () => {
    console.log(`✓ Amoga API Server is listening on http://localhost:${env.PORT}`);
    console.log(`✓ API Health Endpoint: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down Amoga API Server...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✓ Database disconnected. Process exiting.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
