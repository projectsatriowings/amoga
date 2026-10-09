import { checkDatabaseHealth } from '../config/prisma.js';

export async function getHealth(req, res) {
  const dbHealthy = await checkDatabaseHealth();

  if (!dbHealthy) {
    return res.status(503).json({
      status: 'degraded',
      message: 'Database connectivity failure',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'Amoga E-Commerce API',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
}
