import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { calculateMonthBoundaries } from '../src/services/gstReportService.js';

let server;
let baseUrl;
let adminToken;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  // Login as Super Admin to get authorization token
  const loginRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amoga.com',
      password: 'Admin@Amoga2026!',
    }),
  });
  const loginJson = await loginRes.json();
  adminToken = loginJson.token;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

describe('GST Report & Tax Invoice API Test Suite', () => {
  test('1. Timezone-safe month boundaries correctly handle leap years and standard months', () => {
    // Leap year February 2024
    const leapFeb = calculateMonthBoundaries(2, 2024);
    assert.strictEqual(leapFeb.daysInMonth, 29);
    assert.strictEqual(leapFeb.monthName, 'February');
    assert.ok(leapFeb.displayPeriod.includes('29 February 2024'));

    // Non-leap year February 2026
    const standardFeb = calculateMonthBoundaries(2, 2026);
    assert.strictEqual(standardFeb.daysInMonth, 28);
    assert.strictEqual(standardFeb.monthName, 'February');
    assert.ok(standardFeb.displayPeriod.includes('28 February 2026'));

    // September 2026 (30 days)
    const sep = calculateMonthBoundaries(9, 2026);
    assert.strictEqual(sep.daysInMonth, 30);
    assert.strictEqual(sep.monthName, 'September');
    assert.ok(sep.displayPeriod.includes('30 September 2026'));

    // Rejects invalid months or years
    assert.throws(() => calculateMonthBoundaries(13, 2026), /Invalid month/);
    assert.throws(() => calculateMonthBoundaries(0, 2026), /Invalid month/);
    assert.throws(() => calculateMonthBoundaries(5, 1850), /Invalid year/);
  });

  test('2. GET /api/admin/reports/gst enforces admin authentication', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=9&year=2026`);
    assert.strictEqual(res.status, 401);
  });

  test('3. GET /api/admin/reports/gst validates required query parameters', async () => {
    // Missing month
    const res1 = await fetch(`${baseUrl}/admin/reports/gst?year=2026`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res1.status, 400);

    // Invalid month
    const res2 = await fetch(`${baseUrl}/admin/reports/gst?month=15&year=2026`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res2.status, 400);
  });

  test('4. GET /api/admin/reports/gst returns JSON preview with summary totals', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=9&year=2026&format=preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.report);
    assert.strictEqual(json.report.period.monthName, 'September');
    assert.strictEqual(json.report.period.year, 2026);
    assert.strictEqual(typeof json.report.summary.totalTaxableValue, 'number');
    assert.strictEqual(typeof json.report.summary.totalTax, 'number');
    assert.ok(Array.isArray(json.report.hsnBreakdown));
    assert.ok(Array.isArray(json.report.missingDataWarnings));
    assert.ok(json.report.disclaimer.includes('Amoga GST Accounting'));
  });

  test('5. GET /api/admin/reports/gst with format=csv returns downloadable attachment', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=9&year=2026&format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentType.includes('text/csv'));
    assert.ok(contentDisposition.includes('Amoga_GST_Report_September_2026.csv'));

    const text = await res.text();
    assert.ok(text.includes('Reporting Period'));
    assert.ok(text.includes('HSN/SAC Code'));
    assert.ok(text.includes('MONTHLY GST EXECUTIVE SUMMARY'));
  });

  test('6. GET /api/admin/reports/gst with format=pdf returns downloadable PDF buffer', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=9&year=2026&format=pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentType.includes('application/pdf'));
    assert.ok(contentDisposition.includes('Amoga_GST_Report_September_2026.pdf'));

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // PDF signature begins with %PDF-
    assert.strictEqual(buffer.slice(0, 4).toString(), '%PDF');
  });

  test('7. GET /api/admin/invoices validates date filters and rejects reversed date range', async () => {
    // Missing dates
    const res1 = await fetch(`${baseUrl}/admin/invoices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res1.status, 400);

    // Reversed date range
    const res2 = await fetch(`${baseUrl}/admin/invoices?fromDate=2026-10-31&toDate=2026-10-01`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res2.status, 400);
    const json2 = await res2.json();
    assert.strictEqual(json2.error, 'INVALID_DATE_RANGE');
    assert.ok(json2.message.includes('From Date cannot be later than To Date'));
  });

  test('8. GET /api/admin/invoices returns invoices within valid date range', async () => {
    const res = await fetch(`${baseUrl}/admin/invoices?fromDate=2026-09-01&toDate=2026-09-30`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(typeof json.count, 'number');
    assert.ok(Array.isArray(json.invoices));
  });

  test('9. GET /api/admin/reports/payments-to-date and outstanding-payments return valid CSV', async () => {
    const res1 = await fetch(`${baseUrl}/admin/reports/payments-to-date`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res1.status, 200);
    assert.ok(res1.headers.get('content-type').includes('text/csv'));

    const res2 = await fetch(`${baseUrl}/admin/reports/outstanding-payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res2.status, 200);
    assert.ok(res2.headers.get('content-type').includes('text/csv'));
  });

  test('10. GET /api/admin/reports/gst with format=excel returns downloadable Excel spreadsheet', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=9&year=2026&format=excel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentType.includes('spreadsheetml.sheet'));
    assert.ok(contentDisposition.includes('Amoga_GST_Report_September_2026.xlsx'));

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Excel (.xlsx) file is a zip archive starting with PK (0x50, 0x4B)
    assert.strictEqual(buffer.slice(0, 2).toString(), 'PK');
    assert.ok(buffer.length > 1000);
  });

  test('11. JSON preview contains complete Sections A-E (Rates, Supply Types, Returns, ITC, Review)', async () => {
    const res = await fetch(`${baseUrl}/admin/reports/gst?month=10&year=2026&format=preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const report = json.report;

    // Section A
    assert.ok(report.supplyTypeBreakdown.intraState);
    assert.ok(report.supplyTypeBreakdown.interState);
    assert.ok(Array.isArray(report.rateBreakdown));

    // Section B
    assert.ok(Array.isArray(report.hsnBreakdown));

    // Section C
    assert.ok(report.returnsAndAdjustments);
    assert.strictEqual(typeof report.returnsAndAdjustments.totalReturnsTaxable, 'number');
    assert.strictEqual(typeof report.returnsAndAdjustments.totalReturnsTax, 'number');

    // Section D
    assert.ok(report.purchaseAndItc);
    assert.strictEqual(report.purchaseAndItc.eligibleItc, 0);
    assert.ok(report.purchaseAndItc.guidanceNotice.includes('GSTR-1'));

    // Section E
    assert.ok(report.taxSummaryReview);
    assert.strictEqual(typeof report.taxSummaryReview.estimatedNetGstToPay, 'number');
    assert.ok(report.taxSummaryReview.reviewDisclaimer.includes('accountant review'));
  });

  test('12. GET /api/admin/invoices/export-csv returns date-filtered invoice register CSV', async () => {
    const res = await fetch(`${baseUrl}/admin/invoices/export-csv?fromDate=2026-10-01&toDate=2026-10-31`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentType.includes('text/csv'));
    assert.ok(contentDisposition.includes('Amoga_Tax_Invoices_Register_2026-10-01_to_2026-10-31.csv'));

    const text = await res.text();
    assert.ok(text.includes('Invoice Number'));
    assert.ok(text.includes('Customer Name'));
    assert.ok(text.includes('Place of Supply'));
    assert.ok(text.includes('Total Matching Invoices'));
    // Verify Customer GSTIN column was removed
    assert.ok(!text.includes('Customer GSTIN'));
  });
});
