import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth, prisma } from './config/prisma.js';

// Server instance entry point
async function startServer() {
  console.log('--- STARTING AMOGA E-COMMERCE SERVER ---');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Target Port: ${env.PORT}`);

  const host = '0.0.0.0';
  let dbConnected = false;

  // Bind and start listening immediately so clients do not encounter ECONNREFUSED during restarts
  const server = app.listen(env.PORT, host, () => {
    console.log(`✓ Amoga Server is listening on http://${host}:${env.PORT}`);
    console.log(`✓ API Health Endpoint: http://${host}:${env.PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${env.PORT} is already in use by another running process.`);
      console.error(`To resolve this, terminate the conflicting process or run:`);
      console.error(`  Get-Process -Id (Get-NetTCPConnection -LocalPort ${env.PORT}).OwningProcess | Stop-Process -Force\n`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  // Verify database connectivity in background without delaying server binding
  try {
    dbConnected = await checkDatabaseHealth();
    if (dbConnected) {
      console.log('✓ PostgreSQL database connected successfully.');
    } else {
      console.warn('⚠️ WARNING: Initial connection to PostgreSQL database was not established.');
    }
  } catch (err) {
    console.error('Database connection attempt error:', err.message);
  }

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
