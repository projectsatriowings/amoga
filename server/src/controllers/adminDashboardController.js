import { getDashboardMetrics } from '../services/adminAnalyticsService.js';

/**
 * Controller to serve executive admin dashboard metrics & live telemetry
 * Supports range query parameter ('today', '7d', '14d', '30d', 'all') or custom startDate/endDate
 */
export async function getDashboardStats(req, res) {
  try {
    const { range, startDate, endDate } = req.query;
    const metricsData = await getDashboardMetrics({
      range,
      startDate,
      endDate,
    });

    return res.status(200).json(metricsData);
  } catch (err) {
    console.error('[ADMIN DASHBOARD STATS ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to compute dashboard metrics from database',
    });
  }
}
