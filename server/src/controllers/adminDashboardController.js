import { getDashboardMetrics } from '../services/adminAnalyticsService.js';
import { registerCatalogueInvalidation } from './productsController.js';

// High-performance controller cache for executive dashboard metrics
const dashboardControllerCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 25 * 1000; // 25 seconds TTL

export function invalidateDashboardStatsCache() {
  dashboardControllerCache.clear();
}
registerCatalogueInvalidation(invalidateDashboardStatsCache);

/**
 * Controller to serve executive admin dashboard metrics & live telemetry
 * Supports range query parameter ('today', '7d', '14d', '30d', 'all') or custom startDate/endDate
 */
export async function getDashboardStats(req, res) {
  try {
    const { range = '30d', startDate = '', endDate = '' } = req.query;
    const cacheKey = `${range}:${startDate}:${endDate}`;
    const now = Date.now();

    const cached = dashboardControllerCache.get(cacheKey);
    if (cached && now - cached.timestamp < DASHBOARD_CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=60');
      return res.status(200).json(cached.payload);
    }

    const metricsData = await getDashboardMetrics({
      range,
      startDate,
      endDate,
    });

    dashboardControllerCache.set(cacheKey, { payload: metricsData, timestamp: now });
    res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=60');
    return res.status(200).json(metricsData);
  } catch (err) {
    console.error('[ADMIN DASHBOARD STATS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to compute dashboard metrics from database',
    });
  }
}
