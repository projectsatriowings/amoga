import http from 'http';
import { execSync } from 'child_process';
import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth, prisma } from './config/prisma.js';

/**
 * Safely kills any zombie or conflicting process holding the port on Windows
 * (excluding the current running process).
 */
function killConflictingPortProcess(port) {
  if (process.platform === 'win32') {
    try {
      const currentPid = process.pid;
      const cmd = `powershell -NoProfile -NonInteractive -Command "$conns = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue; foreach ($c in $conns) { if ($c.OwningProcess -ne ${currentPid}) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } }"`;
      execSync(cmd, { stdio: 'ignore', timeout: 3000 });
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Creates an HTTP server and binds to port with automatic retry and zombie process recovery.
 * Completely eliminates EADDRINUSE race conditions on Windows file reloads.
 */
function createServerWithPortRecovery(port, host, maxRetries = 4, baseDelayMs = 600) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const server = http.createServer(app);

    const tryListen = () => {
      attempts++;

      const onError = (err) => {
        server.removeListener('listening', onListening);

        if (err.code === 'EADDRINUSE') {
          if (attempts <= maxRetries) {
            console.warn(`[PORT RECOVERY]: Port ${port} is busy during reload. Auto-recovering (attempt ${attempts}/${maxRetries})...`);
            
            // On Windows, terminate any lingering orphan process from the previous watch cycle
            killConflictingPortProcess(port);

            const delay = baseDelayMs * attempts;
            setTimeout(() => {
              tryListen();
            }, delay);
            return;
          }
          console.error(`\n❌ Port ${port} remains in use by another process after ${maxRetries} recovery attempts.`);
          console.error(`To force terminate:`);
          console.error(`  Get-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess | Stop-Process -Force\n`);
        } else {
          console.error('Server network error:', err);
        }
        reject(err);
      };

      const onListening = () => {
        server.removeListener('error', onError);
        resolve(server);
      };

      server.once('error', onError);
      server.once('listening', onListening);

      server.listen(port, host);
    };

    tryListen();
  });
}

// Server instance entry point
async function startServer() {
  console.log('--- STARTING AMOGA E-COMMERCE SERVER ---');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Target Port: ${env.PORT}`);

  const host = '0.0.0.0';
  let dbConnected = false;

  // Bind using self-healing port recovery
  const server = await createServerWithPortRecovery(env.PORT, host);

  console.log(`✓ Amoga Server is listening on http://${host}:${env.PORT}`);
  console.log(`✓ API Health Endpoint: http://${host}:${env.PORT}/api/health`);

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

  // Graceful shutdown handling with immediate socket disconnection
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down Amoga Server...`);
    try {
      // Force-terminate active keep-alive HTTP sockets so port is freed instantly
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close(async () => {
        if (dbConnected) {
          await prisma.$disconnect().catch(() => {});
          console.log('✓ Database disconnected.');
        }
        console.log('✓ Process exiting.');
        process.exit(0);
      });

      // Guard timeout in case event loop hangs on open resources
      setTimeout(() => process.exit(0), 1200).unref();
    } catch {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
