import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth, prisma } from './config/prisma.js';

async function startServer() {
  console.log('--- STARTING AMOGA E-COMMERCE SERVER ---');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Target Port: ${env.PORT}`);

  // Check database connectivity
  let dbConnected = false;
  try {
    dbConnected = await checkDatabaseHealth();
  } catch (err) {
    console.error('Database connection attempt error:', err.message);
  }

  if (!dbConnected) {
    console.warn('⚠️ WARNING: Initial connection to PostgreSQL database was not established.');
    console.warn('⚠️ Serving frontend and static endpoints. Configure DATABASE_URL in environment to activate full database capabilities.');
  } else {
    console.log('✓ PostgreSQL database connected successfully.');
  }

  const host = '0.0.0.0';
  const server = app.listen(env.PORT, host, () => {
    console.log(`✓ Amoga Server is listening on http://${host}:${env.PORT}`);
    console.log(`✓ API Health Endpoint: http://${host}:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down Amoga Server...`);
    server.close(async () => {
      if (dbConnected) {
        await prisma.$disconnect();
        console.log('✓ Database disconnected.');
      }
      console.log('✓ Process exiting.');
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
// Synchronized collection schema with heroHeading and themeConfig
