import { prisma } from '../config/prisma.js';
import { getSalesReportMetrics } from '../services/adminAnalyticsService.js';

export async function getSalesReport(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const report = await getSalesReportMetrics({ startDate, endDate });

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (err) {
    console.error('[ADMIN SALES REPORT ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate sales report',
    });
  }
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function exportCsv(req, res) {
  try {
    const { type = 'orders' } = req.query;

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'Order Reference',
        'Date',
        'Customer Name',
        'Customer Email',
        'Phone',
        'City',
        'State',
        'Pincode',
        'Status',
        'Payment Status',
        'Subtotal (INR)',
        'Shipping (INR)',
        'Total (INR)',
      ];

      const rows = orders.map((o) => [
        escapeCsvField(o.orderReference),
        escapeCsvField(o.createdAt.toISOString()),
        escapeCsvField(o.customerName),
        escapeCsvField(o.customerEmail),
        escapeCsvField(o.customerPhone),
        escapeCsvField(o.city),
        escapeCsvField(o.state),
        escapeCsvField(o.pincode),
        escapeCsvField(o.status),
        escapeCsvField(o.paymentStatus),
        escapeCsvField(Number(o.subtotal).toFixed(2)),
        escapeCsvField(Number(o.shippingAmount).toFixed(2)),
        escapeCsvField(Number(o.totalAmount).toFixed(2)),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="amoga-orders.csv"');
      return res.status(200).send(csvContent);
    } else if (type === 'inventory') {
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: { collection: true },
      });

      const headers = [
        'Product Name',
        'Collection',
        'Slug',
        'Price (INR)',
        'Stock Quantity',
        'In Stock',
        'Active',
      ];

      const rows = products.map((p) => [
        escapeCsvField(p.name),
        escapeCsvField(p.collection.name),
        escapeCsvField(p.slug),
        escapeCsvField(p.price ? Number(p.price).toFixed(2) : 'N/A'),
        escapeCsvField(p.stockQuantity),
        escapeCsvField(p.inStock ? 'YES' : 'NO'),
        escapeCsvField(p.isActive ? 'YES' : 'NO'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="amoga-inventory.csv"');
      return res.status(200).send(csvContent);
    }

    return res.status(400).json({ error: 'INVALID_TYPE', message: 'Supported types: orders, inventory' });
  } catch (err) {
    console.error('[ADMIN EXPORT CSV ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to export CSV report',
    });
  }
}
