import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Escapes CSV field with RFC 4180 quotes and spreadsheet formula injection protection
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Prevent spreadsheet formula injection (=, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

/**
 * Calculates start and end timestamps in Indian Standard Time (UTC+5:30)
 * Uses start-inclusive and next-month-start-exclusive boundaries.
 */
export function calculateMonthBoundaries(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(m) || m < 1 || m > 12) {
    throw new Error('Invalid month. Month must be an integer between 1 and 12.');
  }
  if (isNaN(y) || y < 2000 || y > 2100) {
    throw new Error('Invalid year. Year must be between 2000 and 2100.');
  }

  // 00:00:00 IST on 1st of month in UTC
  const startUtc = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0) - (5.5 * 3600 * 1000));
  // 00:00:00 IST on 1st of NEXT month in UTC (exclusive boundary)
  const endUtc = new Date(Date.UTC(y, m, 1, 0, 0, 0) - (5.5 * 3600 * 1000));

  // Determine last day of the month for human display
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthName = MONTH_NAMES[m - 1];

  return {
    month: m,
    year: y,
    monthName,
    daysInMonth,
    startUtc,
    endUtc,
    displayPeriod: `1 ${monthName} ${y} through ${daysInMonth} ${monthName} ${y}`,
  };
}

/**
 * Fetches authoritative GST monthly data from PostgreSQL through Prisma
 */
export async function fetchGstMonthlyData({ month, year }) {
  const boundaries = calculateMonthBoundaries(month, year);
  const { startUtc, endUtc, monthName, displayPeriod } = boundaries;

  // 1. Authoritative Invoice Records (Filtered by Invoice Date / Creation Date)
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      OR: [
        { invoiceDate: { gte: startUtc, lt: endUtc } },
        { invoiceDate: null, createdAt: { gte: startUtc, lt: endUtc } },
      ],
    },
    include: {
      items: true,
      payments: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // 2. Authoritative Payments Received in this calendar month (Distinguished from invoice-date turnover)
  const [succeededPayments, refundedPayments] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startUtc, lt: endUtc },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
        createdAt: { gte: startUtc, lt: endUtc },
      },
    }),
  ]);

  const totalPaymentsReceived = succeededPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalRefunds = refundedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 3. Aggregate Invoices, Lines, Taxes, and HSN Breakdown
  let totalInvoices = orders.length;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  let totalInvoiceAmount = 0;
  let exemptNilRatedValue = 0;

  const hsnMap = {};
  const missingDataWarnings = [];
  let unregisteredB2cCount = 0;
  let missingHsnCount = 0;

  const rows = [];

  for (const order of orders) {
    totalInvoiceAmount += Number(order.totalAmount || 0);

    const hasCustomerGstin = Boolean(order.customerGstin && order.customerGstin.trim());
    if (!hasCustomerGstin) {
      unregisteredB2cCount++;
    }

    const orderItems = order.items || [];
    if (orderItems.length === 0) {
      // Fallback single line if items table was empty
      const taxable = Number(order.taxableAmount || 0);
      const cgst = Number(order.cgstAmount || 0);
      const sgst = Number(order.sgstAmount || 0);
      const igst = Number(order.igstAmount || 0);
      const cess = Number(order.cessAmount || 0);

      totalTaxableValue += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;

      rows.push({
        reportingPeriod: `${monthName} ${year}`,
        invoiceNumber: order.invoiceNumber || 'INV-PENDING',
        invoiceDate: order.invoiceDate ? order.invoiceDate.toISOString().split('T')[0] : order.createdAt.toISOString().split('T')[0],
        orderReference: order.orderReference,
        paymentReference: order.payments?.[0]?.paymentReference || 'N/A',
        customerName: order.customerName,
        customerGstin: order.customerGstin || 'URP',
        customerBillingState: order.state || 'Tamil Nadu',
        sellerLegalName: order.sellerLegalName || 'Amoga Luxury Private Limited',
        sellerGstin: order.sellerGstin || '33AAACA1234A1Z5',
        placeOfSupply: order.placeOfSupply || order.state || 'Tamil Nadu',
        productName: 'General Order',
        sku: 'GEN-001',
        hsnCode: '5007',
        quantity: 1,
        taxableValue: taxable,
        discount: Number(order.discountAmount || 0),
        gstRate: Number(cgst + sgst + igst > 0 ? 5 : 0),
        cgst,
        sgst,
        igst,
        cess,
        invoiceTotal: Number(order.totalAmount || 0),
        amountReceived: order.paymentStatus === 'SUCCEEDED' ? Number(order.totalAmount || 0) : 0,
        refunds: order.paymentStatus === 'REFUNDED' ? Number(order.totalAmount || 0) : 0,
        outstandingBalance: order.paymentStatus === 'SUCCEEDED' ? 0 : Number(order.totalAmount || 0),
      });
    } else {
      for (const item of orderItems) {
        const hsn = item.hsnCode || '5007';
        if (!item.hsnCode) missingHsnCount++;

        const taxable = Number(item.taxableAmount || 0);
        const cgst = Number(item.cgstAmount || 0);
        const sgst = Number(item.sgstAmount || 0);
        const igst = Number(item.igstAmount || 0);
        const cess = Number(item.cessAmount || 0);
        const gstRate = Number(item.gstRate || 0);

        totalTaxableValue += taxable;
        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
        totalCess += cess;

        if (gstRate === 0) {
          exemptNilRatedValue += taxable;
        }

        // HSN Aggregation
        const hsnKey = `${hsn}_${gstRate}`;
        if (!hsnMap[hsnKey]) {
          hsnMap[hsnKey] = {
            hsnCode: hsn,
            gstRate,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            totalTax: 0,
            itemCount: 0,
          };
        }
        hsnMap[hsnKey].taxableValue += taxable;
        hsnMap[hsnKey].cgst += cgst;
        hsnMap[hsnKey].sgst += sgst;
        hsnMap[hsnKey].igst += igst;
        hsnMap[hsnKey].cess += cess;
        hsnMap[hsnKey].totalTax += Number(item.totalTax || cgst + sgst + igst + cess);
        hsnMap[hsnKey].itemCount += Number(item.quantity || 1);

        rows.push({
          reportingPeriod: `${monthName} ${year}`,
          invoiceNumber: order.invoiceNumber || 'INV-PENDING',
          invoiceDate: order.invoiceDate ? order.invoiceDate.toISOString().split('T')[0] : order.createdAt.toISOString().split('T')[0],
          orderReference: order.orderReference,
          paymentReference: order.payments?.[0]?.paymentReference || 'N/A',
          customerName: order.customerName,
          customerGstin: order.customerGstin || 'URP',
          customerBillingState: order.state || 'Tamil Nadu',
          sellerLegalName: order.sellerLegalName || 'Amoga Luxury Private Limited',
          sellerGstin: order.sellerGstin || '33AAACA1234A1Z5',
          placeOfSupply: order.placeOfSupply || order.state || 'Tamil Nadu',
          productName: item.productName || 'Amoga Product',
          sku: item.sku || 'N/A',
          hsnCode: hsn,
          quantity: item.quantity || 1,
          taxableValue: taxable,
          discount: Number(order.discountAmount || 0),
          gstRate,
          cgst,
          sgst,
          igst,
          cess,
          invoiceTotal: Number(order.totalAmount || 0),
          amountReceived: order.paymentStatus === 'SUCCEEDED' ? Number(order.totalAmount || 0) : 0,
          refunds: order.paymentStatus === 'REFUNDED' ? Number(order.totalAmount || 0) : 0,
          outstandingBalance: order.paymentStatus === 'SUCCEEDED' ? 0 : Number(order.totalAmount || 0),
        });
      }
    }
  }

  if (unregisteredB2cCount > 0) {
    missingDataWarnings.push(`${unregisteredB2cCount} invoice(s) belong to unregistered buyers (URP / B2C supply).`);
  }
  if (missingHsnCount > 0) {
    missingDataWarnings.push(`${missingHsnCount} item(s) lacked explicit HSN codes; defaulted to standard 5007 classification.`);
  }

  const hsnBreakdown = Object.values(hsnMap).sort((a, b) => b.taxableValue - a.taxableValue);

  return {
    period: {
      month: boundaries.month,
      year: boundaries.year,
      monthName: boundaries.monthName,
      daysInMonth: boundaries.daysInMonth,
      displayPeriod: boundaries.displayPeriod,
      startUtc: boundaries.startUtc.toISOString(),
      endUtc: boundaries.endUtc.toISOString(),
    },
    recordCount: totalInvoices,
    lineItemsCount: rows.length,
    summary: {
      totalInvoices,
      totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
      totalCgst: Number(totalCgst.toFixed(2)),
      totalSgst: Number(totalSgst.toFixed(2)),
      totalIgst: Number(totalIgst.toFixed(2)),
      totalCess: Number(totalCess.toFixed(2)),
      totalTax: Number((totalCgst + totalSgst + totalIgst + totalCess).toFixed(2)),
      totalInvoiceAmount: Number(totalInvoiceAmount.toFixed(2)),
      totalPaymentsReceived: Number(totalPaymentsReceived.toFixed(2)),
      totalRefunds: Number(totalRefunds.toFixed(2)),
      exemptNilRatedValue: Number(exemptNilRatedValue.toFixed(2)),
    },
    hsnBreakdown,
    missingDataWarnings,
    rows,
    disclaimer: 'Amoga GST Accounting Reconciliation Report. Generated for internal audit and accounting preparation. Verify against GSTN portal GSTR-1/3B guidelines before statutory filing.',
  };
}

/**
 * Generates an RFC 4180 compliant CSV string with formula injection protection
 */
export function generateGstCsvString(data) {
  const headers = [
    'Reporting Period',
    'Invoice Number',
    'Invoice Date',
    'Order Reference',
    'Payment Reference',
    'Customer Name',
    'Customer GSTIN',
    'Customer Billing State',
    'Seller Legal Name',
    'Seller GSTIN',
    'Place of Supply',
    'Product Name',
    'SKU',
    'HSN/SAC Code',
    'Quantity',
    'Taxable Value (INR)',
    'Discount (INR)',
    'GST Rate (%)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Cess (INR)',
    'Invoice Total (INR)',
    'Amount Received in Month (INR)',
    'Refunds in Month (INR)',
    'Outstanding Balance (INR)',
  ];

  const rowLines = data.rows.map((r) => [
    escapeCsv(r.reportingPeriod),
    escapeCsv(r.invoiceNumber),
    escapeCsv(r.invoiceDate),
    escapeCsv(r.orderReference),
    escapeCsv(r.paymentReference),
    escapeCsv(r.customerName),
    escapeCsv(r.customerGstin),
    escapeCsv(r.customerBillingState),
    escapeCsv(r.sellerLegalName),
    escapeCsv(r.sellerGstin),
    escapeCsv(r.placeOfSupply),
    escapeCsv(r.productName),
    escapeCsv(r.sku),
    escapeCsv(r.hsnCode),
    escapeCsv(r.quantity),
    escapeCsv(r.taxableValue.toFixed(2)),
    escapeCsv(r.discount.toFixed(2)),
    escapeCsv(r.gstRate),
    escapeCsv(r.cgst.toFixed(2)),
    escapeCsv(r.sgst.toFixed(2)),
    escapeCsv(r.igst.toFixed(2)),
    escapeCsv(r.cess.toFixed(2)),
    escapeCsv(r.invoiceTotal.toFixed(2)),
    escapeCsv(r.amountReceived.toFixed(2)),
    escapeCsv(r.refunds.toFixed(2)),
    escapeCsv(r.outstandingBalance.toFixed(2)),
  ].join(','));

  // Summary footer block for accountants
  const summaryLines = [
    '',
    '=== MONTHLY GST EXECUTIVE SUMMARY ===',
    `"Reporting Period",${escapeCsv(data.period.displayPeriod)}`,
    `"Total Invoices Issued",${escapeCsv(data.summary.totalInvoices)}`,
    `"Total Taxable Value (INR)",${escapeCsv(data.summary.totalTaxableValue.toFixed(2))}`,
    `"Total CGST (INR)",${escapeCsv(data.summary.totalCgst.toFixed(2))}`,
    `"Total SGST (INR)",${escapeCsv(data.summary.totalSgst.toFixed(2))}`,
    `"Total IGST (INR)",${escapeCsv(data.summary.totalIgst.toFixed(2))}`,
    `"Total Cess (INR)",${escapeCsv(data.summary.totalCess.toFixed(2))}`,
    `"Total GST Invoiced (INR)",${escapeCsv(data.summary.totalTax.toFixed(2))}`,
    `"Total Invoiced Amount (INR)",${escapeCsv(data.summary.totalInvoiceAmount.toFixed(2))}`,
    `"Payments Received During Month (INR)",${escapeCsv(data.summary.totalPaymentsReceived.toFixed(2))}`,
    `"Refunds Processed During Month (INR)",${escapeCsv(data.summary.totalRefunds.toFixed(2))}`,
    `"Exempt / Nil-Rated Turnover (INR)",${escapeCsv(data.summary.exemptNilRatedValue.toFixed(2))}`,
    '',
    '=== HSN / SAC CLASSIFICATION SUMMARY ===',
    '"HSN/SAC","GST Rate (%)","Taxable Value (INR)","CGST (INR)","SGST (INR)","IGST (INR)","Total Tax (INR)"',
    ...data.hsnBreakdown.map((h) => [
      escapeCsv(h.hsnCode),
      escapeCsv(h.gstRate),
      escapeCsv(h.taxableValue.toFixed(2)),
      escapeCsv(h.cgst.toFixed(2)),
      escapeCsv(h.sgst.toFixed(2)),
      escapeCsv(h.igst.toFixed(2)),
      escapeCsv(h.totalTax.toFixed(2)),
    ].join(',')),
    '',
    `"Compliance Disclaimer",${escapeCsv(data.disclaimer)}`,
  ];

  return [headers.join(','), ...rowLines, ...summaryLines].join('\r\n');
}

/**
 * Generates an executive A4 summary PDF with pdfkit
 */
export async function generateGstPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `GST Report - ${data.period.monthName} ${data.period.year}`,
          Author: 'Amoga Luxury Private Limited',
          Subject: 'Monthly GST Reconciliation Report',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const tableX = 36;
      let currentY = 36;

      // Header
      doc.rect(tableX, currentY, 523, 60).fillAndStroke('#FBF9F5', '#E5E0D5');
      doc.fillColor('#722F37').fontSize(16).font('Helvetica-Bold').text('AMOGA ATELIER', tableX + 12, currentY + 12, { characterSpacing: 1 });
      doc.fillColor('#5C544C').fontSize(8).font('Helvetica').text('MONTHLY GST ACCOUNTING & RECONCILIATION REPORT', tableX + 12, currentY + 34);
      doc.fillColor('#7A7167').fontSize(7.5).text(`GSTIN: 33AAACA1234A1Z5 | State: Tamil Nadu (Code: 33)`, tableX + 12, currentY + 45);

      doc.fillColor('#1A1817').fontSize(10).font('Helvetica-Bold').text(`${data.period.monthName.toUpperCase()} ${data.period.year}`, tableX + 320, currentY + 14, { align: 'right', width: 190 });
      doc.fillColor('#7A7167').fontSize(7.5).font('Helvetica').text(data.period.displayPeriod, tableX + 320, currentY + 30, { align: 'right', width: 190 });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, tableX + 320, currentY + 42, { align: 'right', width: 190 });

      currentY += 72;

      // KPI Summary Grid (4 columns)
      doc.fillColor('#722F37').fontSize(9).font('Helvetica-Bold').text('1. EXECUTIVE TURNOVER & TAX SUMMARY', tableX, currentY);
      currentY += 14;

      const kpiCards = [
        { label: 'TOTAL INVOICES', value: String(data.summary.totalInvoices) },
        { label: 'TAXABLE VALUE', value: `₹${data.summary.totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
        { label: 'TOTAL GST TAX', value: `₹${data.summary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
        { label: 'PAYMENTS COLLECTED', value: `₹${data.summary.totalPaymentsReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      ];

      const cardW = 125;
      kpiCards.forEach((kpi, idx) => {
        const cx = tableX + idx * (cardW + 8);
        doc.rect(cx, currentY, cardW, 40).fillAndStroke('#FFFFFF', '#E5E0D5');
        doc.fillColor('#7A7167').fontSize(6.5).font('Helvetica-Bold').text(kpi.label, cx + 8, currentY + 8);
        doc.fillColor('#1A1817').fontSize(10).font('Helvetica-Bold').text(kpi.value, cx + 8, currentY + 20);
      });

      currentY += 48;

      // GST Tax Breakdown Sub-Table
      const taxGrid = [
        { label: 'CGST (Intra-State)', value: data.summary.totalCgst },
        { label: 'SGST (Intra-State)', value: data.summary.totalSgst },
        { label: 'IGST (Inter-State)', value: data.summary.totalIgst },
        { label: 'Cess Applicable', value: data.summary.totalCess },
        { label: 'Total Invoiced Value', value: data.summary.totalInvoiceAmount },
        { label: 'Total Refunds in Month', value: data.summary.totalRefunds },
      ];

      doc.rect(tableX, currentY, 523, 38).fillAndStroke('#FBF9F5', '#E5E0D5');
      const subColW = 523 / 6;
      taxGrid.forEach((item, idx) => {
        const sx = tableX + idx * subColW;
        doc.fillColor('#7A7167').fontSize(6).font('Helvetica').text(item.label, sx + 4, currentY + 6, { width: subColW - 8, align: 'center' });
        doc.fillColor('#1A1817').fontSize(8).font('Helvetica-Bold').text(`₹${Number(item.value || 0).toFixed(2)}`, sx + 4, currentY + 20, { width: subColW - 8, align: 'center' });
      });

      currentY += 48;

      // HSN Summary Table
      doc.fillColor('#722F37').fontSize(9).font('Helvetica-Bold').text('2. HSN / SAC STATUTORY SUMMARY', tableX, currentY);
      currentY += 14;

      doc.rect(tableX, currentY, 523, 14).fillAndStroke('#F5F2EB', '#D5CEC2');
      doc.fillColor('#1A1817').fontSize(6.5).font('Helvetica-Bold');
      doc.text('HSN/SAC', tableX + 8, currentY + 4, { width: 70 });
      doc.text('GST RATE', tableX + 80, currentY + 4, { width: 60 });
      doc.text('QTY', tableX + 140, currentY + 4, { width: 40, align: 'center' });
      doc.text('TAXABLE VALUE (₹)', tableX + 190, currentY + 4, { width: 85, align: 'right' });
      doc.text('CGST (₹)', tableX + 280, currentY + 4, { width: 65, align: 'right' });
      doc.text('SGST (₹)', tableX + 350, currentY + 4, { width: 65, align: 'right' });
      doc.text('IGST (₹)', tableX + 420, currentY + 4, { width: 65, align: 'right' });
      doc.text('TOTAL TAX (₹)', tableX + 485, currentY + 4, { width: 35, align: 'right' });

      currentY += 14;

      if (data.hsnBreakdown.length === 0) {
        doc.rect(tableX, currentY, 523, 20).fillAndStroke('#FFFFFF', '#EAE4D9');
        doc.fillColor('#7A7167').fontSize(7).font('Helvetica').text('No taxable supplies recorded in this calendar month.', tableX, currentY + 6, { align: 'center', width: 523 });
        currentY += 20;
      } else {
        data.hsnBreakdown.forEach((h) => {
          doc.rect(tableX, currentY, 523, 14).fillAndStroke('#FFFFFF', '#EAE4D9');
          doc.fillColor('#332D28').fontSize(6.5).font('Helvetica');
          doc.text(h.hsnCode, tableX + 8, currentY + 4);
          doc.text(`${h.gstRate}%`, tableX + 80, currentY + 4);
          doc.text(String(h.itemCount || 1), tableX + 140, currentY + 4, { width: 40, align: 'center' });
          doc.text(h.taxableValue.toFixed(2), tableX + 190, currentY + 4, { width: 85, align: 'right' });
          doc.text(h.cgst.toFixed(2), tableX + 280, currentY + 4, { width: 65, align: 'right' });
          doc.text(h.sgst.toFixed(2), tableX + 350, currentY + 4, { width: 65, align: 'right' });
          doc.text(h.igst.toFixed(2), tableX + 420, currentY + 4, { width: 65, align: 'right' });
          doc.font('Helvetica-Bold').text(h.totalTax.toFixed(2), tableX + 485, currentY + 4, { width: 35, align: 'right' });
          currentY += 14;
        });
      }

      currentY += 16;

      // Invoice Register Preview (First 15 invoices)
      doc.fillColor('#722F37').fontSize(9).font('Helvetica-Bold').text(`3. INVOICE REGISTER (${data.recordCount} Total Records)`, tableX, currentY);
      currentY += 14;

      doc.rect(tableX, currentY, 523, 14).fillAndStroke('#F5F2EB', '#D5CEC2');
      doc.fillColor('#1A1817').fontSize(6.5).font('Helvetica-Bold');
      doc.text('INVOICE NO', tableX + 8, currentY + 4, { width: 110 });
      doc.text('DATE', tableX + 120, currentY + 4, { width: 60 });
      doc.text('CUSTOMER / GSTIN', tableX + 185, currentY + 4, { width: 140 });
      doc.text('PLACE OF SUPPLY', tableX + 330, currentY + 4, { width: 85 });
      doc.text('TAXABLE (₹)', tableX + 415, currentY + 4, { width: 50, align: 'right' });
      doc.text('TOTAL (₹)', tableX + 470, currentY + 4, { width: 50, align: 'right' });

      currentY += 14;

      const previewRows = data.rows.slice(0, 12);
      if (previewRows.length === 0) {
        doc.rect(tableX, currentY, 523, 20).fillAndStroke('#FFFFFF', '#EAE4D9');
        doc.fillColor('#7A7167').fontSize(7).font('Helvetica').text('No invoices issued during the selected reporting period.', tableX, currentY + 6, { align: 'center', width: 523 });
        currentY += 20;
      } else {
        previewRows.forEach((r) => {
          doc.rect(tableX, currentY, 523, 14).fillAndStroke('#FFFFFF', '#EAE4D9');
          doc.fillColor('#332D28').fontSize(6.5).font('Helvetica');
          doc.text(r.invoiceNumber, tableX + 8, currentY + 4, { width: 110, lineBreak: false });
          doc.text(r.invoiceDate, tableX + 120, currentY + 4, { width: 60 });
          doc.text(`${r.customerName} (${r.customerGstin})`, tableX + 185, currentY + 4, { width: 140, lineBreak: false });
          doc.text(r.placeOfSupply, tableX + 330, currentY + 4, { width: 85, lineBreak: false });
          doc.text(r.taxableValue.toFixed(2), tableX + 415, currentY + 4, { width: 50, align: 'right' });
          doc.font('Helvetica-Bold').text(r.invoiceTotal.toFixed(2), tableX + 470, currentY + 4, { width: 50, align: 'right' });
          currentY += 14;
        });

        if (data.rows.length > 12) {
          doc.fillColor('#7A7167').fontSize(6).font('Helvetica-Oblique').text(`... and ${data.rows.length - 12} more items. Download the complete CSV for the full line-item register.`, tableX + 8, currentY + 4);
          currentY += 14;
        }
      }

      currentY += 14;

      // Disclaimers & Signatures
      doc.rect(tableX, currentY, 523, 40).fillAndStroke('#FBF9F5', '#E5E0D5');
      doc.fillColor('#7A7167').fontSize(6).font('Helvetica-Bold').text('AUDIT & STATUTORY COMPLIANCE NOTE:', tableX + 8, currentY + 6);
      doc.font('Helvetica').text(
        `${data.disclaimer} Authoritative snapshot generated from transactional order data stored in PostgreSQL. Clearly distinguishes invoice date totals from payment date settlement totals.`,
        tableX + 8,
        currentY + 16,
        { width: 507 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
