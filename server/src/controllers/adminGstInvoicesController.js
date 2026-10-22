import { prisma } from '../config/prisma.js';
import {
  calculateMonthBoundaries,
  fetchGstMonthlyData,
  generateGstCsvString,
  generateGstPdfBuffer,
} from '../services/gstReportService.js';
import {
  generateInvoicePdfBuffer,
  createInvoicesZipArchive,
} from '../services/pdfInvoiceService.js';

/**
 * Escapes CSV field with RFC 4180 quotes and spreadsheet formula injection protection
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

/**
 * GET /api/admin/reports/gst
 * Monthly GST Report endpoint supporting:
 * - format=preview (JSON summary & preview)
 * - format=csv (Downloadable CSV)
 * - format=pdf (Downloadable PDF Summary)
 */
export async function getGstReportEndpoint(req, res) {
  try {
    const { month, year, format = 'preview' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'Both month (1-12) and year (e.g. 2026) are required.',
      });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({
        error: 'INVALID_MONTH',
        message: 'Month must be an integer between 1 and 12.',
      });
    }

    if (isNaN(y) || y < 2000 || y > 2100) {
      return res.status(400).json({
        error: 'INVALID_YEAR',
        message: 'Year must be a valid 4-digit year between 2000 and 2100.',
      });
    }

    const reportData = await fetchGstMonthlyData({ month: m, year: y });
    const filenameBase = `Amoga_GST_Report_${reportData.period.monthName}_${y}`;

    if (format === 'csv') {
      const csv = generateGstCsvString(reportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      return res.status(200).send(csv);
    }

    if (format === 'pdf') {
      const pdfBuffer = await generateGstPdfBuffer(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    // Default: Preview JSON
    return res.status(200).json({
      success: true,
      report: reportData,
    });
  } catch (err) {
    console.error('[ADMIN GST REPORT ERROR]:', err);
    return res.status(500).json({
      error: 'GST_REPORT_ERROR',
      message: err.message || 'Failed to generate monthly GST report',
    });
  }
}

/**
 * GET /api/admin/invoices
 * Retrieves invoices within an authoritative From/To date range
 */
export async function listInvoicesEndpoint(req, res) {
  try {
    const { fromDate, toDate, status, paymentStatus, search } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        error: 'MISSING_DATE_RANGE',
        message: 'Both From Date and To Date are required.',
      });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'INVALID_DATE_FORMAT',
        message: 'From Date and To Date must be valid dates (YYYY-MM-DD).',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'INVALID_DATE_RANGE',
        message: 'From Date cannot be later than To Date.',
      });
    }

    // Convert fromDate to 00:00:00 IST (UTC - 5.5h) and toDate to next day 00:00:00 IST (exclusive)
    const fromUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0) - (5.5 * 3600 * 1000));
    const toUtcNextDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1, 0, 0, 0) - (5.5 * 3600 * 1000));

    const where = {
      status: { not: 'CANCELLED' },
      OR: [
        { invoiceDate: { gte: fromUtc, lt: toUtcNextDay } },
        { invoiceDate: null, createdAt: { gte: fromUtc, lt: toUtcNextDay } },
      ],
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { orderReference: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerEmail: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoices = orders.map((o) => {
      const missingFields = [];
      if (!o.invoiceNumber) missingFields.push('Invoice Number');
      if (!o.customerName) missingFields.push('Customer Name');
      if (!o.items || o.items.length === 0) missingFields.push('Line Items');

      return {
        id: o.id,
        invoiceNumber: o.invoiceNumber || 'INV-PENDING',
        invoiceDate: o.invoiceDate || o.createdAt,
        orderReference: o.orderReference,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerGstin: o.customerGstin || 'URP',
        placeOfSupply: o.placeOfSupply || o.state,
        totalAmount: Number(o.totalAmount || 0),
        taxableAmount: Number(o.taxableAmount || 0),
        taxAmount: Number(o.taxAmount || 0),
        status: o.status,
        paymentStatus: o.paymentStatus,
        itemCount: o.items?.length || 0,
        isIssued: Boolean(o.invoiceNumber),
        isComplete: missingFields.length === 0,
        missingFields,
      };
    });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      dateRange: {
        fromDate,
        toDate,
      },
      invoices,
    });
  } catch (err) {
    console.error('[ADMIN LIST INVOICES ERROR]:', err);
    return res.status(500).json({
      error: 'INVOICE_LIST_ERROR',
      message: err.message || 'Failed to list tax invoices',
    });
  }
}

/**
 * GET /api/admin/invoices/:id/pdf
 * Generates and downloads an individual Tax Invoice PDF
 */
export async function downloadInvoicePdfEndpoint(req, res) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }, { orderReference: id }],
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'INVOICE_NOT_FOUND',
        message: 'Tax invoice or order not found.',
      });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(order);
    const safeInv = (order.invoiceNumber || order.orderReference || 'invoice').replace(/[/\\?%*:|"<>]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Tax_Invoice_${safeInv}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[ADMIN DOWNLOAD INVOICE PDF ERROR]:', err);
    return res.status(500).json({
      error: 'PDF_GEN_ERROR',
      message: 'Failed to generate tax invoice PDF',
    });
  }
}

/**
 * POST /api/admin/invoices/batch-pdf
 * Batch downloads selected invoices or all matching date-range invoices as a ZIP file
 */
export async function downloadBatchInvoicesZipEndpoint(req, res) {
  try {
    const { orderIds, fromDate, toDate } = req.body;

    let where = {};
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      where.id = { in: orderIds };
    } else if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (start > end) {
        return res.status(400).json({
          error: 'INVALID_DATE_RANGE',
          message: 'From Date cannot be later than To Date.',
        });
      }
      const fromUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0) - (5.5 * 3600 * 1000));
      const toUtcNextDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1, 0, 0, 0) - (5.5 * 3600 * 1000));
      where = {
        status: { not: 'CANCELLED' },
        OR: [
          { invoiceDate: { gte: fromUtc, lt: toUtcNextDay } },
          { invoiceDate: null, createdAt: { gte: fromUtc, lt: toUtcNextDay } },
        ],
      };
    } else {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Must supply either orderIds array or valid fromDate and toDate.',
      });
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Safe batch limit
    });

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'NO_INVOICES_FOUND',
        message: 'No invoices found matching the criteria to download.',
      });
    }

    // If only 1 order is requested, download directly as PDF for convenience
    if (orders.length === 1) {
      const pdfBuffer = await generateInvoicePdfBuffer(orders[0]);
      const safeInv = (orders[0].invoiceNumber || orders[0].orderReference || 'invoice').replace(/[/\\?%*:|"<>]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Tax_Invoice_${safeInv}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    const zipFilename = fromDate && toDate
      ? `Amoga_Tax_Invoices_${fromDate}_to_${toDate}.zip`
      : `Amoga_Tax_Invoices_Batch_${new Date().toISOString().split('T')[0]}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = await createInvoicesZipArchive(orders);
    archive.pipe(res);
  } catch (err) {
    console.error('[ADMIN BATCH INVOICES ZIP ERROR]:', err);
    return res.status(500).json({
      error: 'BATCH_ZIP_ERROR',
      message: 'Failed to create batch invoices ZIP archive',
    });
  }
}

/**
 * GET /api/admin/reports/payments-to-date
 * Generates CSV of all settled payments up to today
 */
export async function exportPaymentsToDateEndpoint(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCEEDED' },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = [
      'Payment Reference',
      'Order Reference',
      'Customer Name',
      'Customer Email',
      'Amount (INR)',
      'Gateway Provider',
      'Gateway Order ID',
      'Gateway Payment ID',
      'Status',
      'Paid Timestamp',
    ];

    const rows = payments.map((p) => [
      escapeCsv(p.paymentReference),
      escapeCsv(p.order?.orderReference || p.orderId),
      escapeCsv(p.order?.customerName || 'Customer'),
      escapeCsv(p.order?.customerEmail || 'N/A'),
      escapeCsv(Number(p.amount || 0).toFixed(2)),
      escapeCsv(p.provider),
      escapeCsv(p.gatewayOrderId || 'N/A'),
      escapeCsv(p.gatewayPaymentId || 'N/A'),
      escapeCsv(p.status),
      escapeCsv(p.paidAt ? p.paidAt.toISOString() : p.createdAt.toISOString()),
    ]);

    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const summary = [
      '',
      `"Total Transactions",${escapeCsv(payments.length)}`,
      `"Total Payments Collected (INR)",${escapeCsv(totalCollected.toFixed(2))}`,
      `"Exported Date",${escapeCsv(new Date().toISOString())}`,
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(',')), ...summary].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Amoga_Payments_To_Date_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[PAYMENTS TO DATE EXPORT ERROR]:', err);
    return res.status(500).json({ error: 'EXPORT_ERROR', message: 'Failed to export payments to date' });
  }
}

/**
 * GET /api/admin/reports/outstanding-payments
 * Generates CSV of all orders with pending or unpaid balances
 */
export async function exportOutstandingPaymentsEndpoint(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        paymentStatus: { not: 'SUCCEEDED' },
      },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = [
      'Order Reference',
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Order Total (INR)',
      'Payment Status',
      'Order Lifecycle Status',
      'Placed At',
    ];

    const rows = orders.map((o) => [
      escapeCsv(o.orderReference),
      escapeCsv(o.invoiceNumber || 'INV-PENDING'),
      escapeCsv(o.customerName),
      escapeCsv(o.customerEmail),
      escapeCsv(o.customerPhone),
      escapeCsv(Number(o.totalAmount || 0).toFixed(2)),
      escapeCsv(o.paymentStatus),
      escapeCsv(o.status),
      escapeCsv(o.createdAt.toISOString()),
    ]);

    const totalOutstanding = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const summary = [
      '',
      `"Total Outstanding Orders",${escapeCsv(orders.length)}`,
      `"Total Outstanding Balance (INR)",${escapeCsv(totalOutstanding.toFixed(2))}`,
      `"Exported Date",${escapeCsv(new Date().toISOString())}`,
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(',')), ...summary].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Amoga_Outstanding_Payments_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[OUTSTANDING PAYMENTS EXPORT ERROR]:', err);
    return res.status(500).json({ error: 'EXPORT_ERROR', message: 'Failed to export outstanding payments' });
  }
}
