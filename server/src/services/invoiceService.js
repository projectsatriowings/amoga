import { prisma } from '../config/prisma.js';

/**
 * AMOGA E-COMMERCE — GST TAX INVOICE GENERATOR
 * Generates statutory, audit-compliant Tax Invoices under Section 31 of CGST Act and Rule 46 of CGST Rules.
 */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertTwoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return `${TENS[t]}${u ? ' ' + ONES[u] : ''}`;
}

function convertThreeDigits(n) {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let res = '';
  if (h > 0) {
    res += `${ONES[h]} Hundred`;
    if (rem > 0) res += ' and ';
  }
  if (rem > 0) {
    res += convertTwoDigits(rem);
  }
  return res;
}

/**
 * Converts currency amounts to Indian numbering system words (Crores, Lakhs, Thousands)
 */
export function amountToIndianWords(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Zero Rupees Only';

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const parts = [];
  if (crore > 0) parts.push(`${convertTwoDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
  if (rem > 0) parts.push(convertThreeDigits(rem));

  const paise = Math.round((Number(amount) - num) * 100);
  let result = `${parts.join(' ')} Rupees`;
  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }
  result += ' Only';

  return result;
}

/**
 * Atomically generates and increments the next tax invoice number for the store
 */
export async function allocateInvoiceNumber(tx = prisma) {
  const updatedSetting = await tx.storeSetting.update({
    where: { id: 'default' },
    data: {
      invoiceSequence: { increment: 1 },
    },
    select: {
      invoicePrefix: true,
      invoiceSequence: true,
    },
  });

  const prefix = updatedSetting.invoicePrefix || 'AMOGA/2026-27/';
  const seq = updatedSetting.invoiceSequence;
  return `${prefix}${seq}`;
}

/**
 * Renders print-ready, professional HTML Tax Invoice for an order
 */
export function renderInvoiceHtml(order) {
  const sellerLegalName = order.sellerLegalName || 'Amoga Luxury Private Limited';
  const sellerTradeName = order.sellerTradeName || 'Amoga';
  const sellerGstin = order.sellerGstin || '33AAACA1234A1Z5';
  const sellerAddress = order.sellerAddress || '108, Heritage Walk, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017';
  const sellerState = order.sellerState || 'Tamil Nadu';
  const sellerStateCode = order.sellerStateCode || '33';

  const invoiceNumber = order.invoiceNumber || 'INV-PENDING';
  const invoiceDate = order.invoiceDate
    ? new Date(order.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const customerName = order.customerName || 'Customer';
  const customerEmail = order.customerEmail || '';
  const customerPhone = order.customerPhone || '';
  const customerAddress = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.state,
    order.pincode,
  ].filter(Boolean).join(', ');

  const placeOfSupply = `${order.placeOfSupply || order.state} (Code: ${order.placeOfSupplyCode || '33'})`;
  const isInterState = Boolean(order.isInterState);

  const customerGstin = order.customerGstin ? order.customerGstin.toUpperCase() : 'URP (Unregistered Person)';
  const customerBusinessName = order.customerBusinessName || '';

  const items = order.items || [];
  const taxableAmount = Number(order.taxableAmount || 0);
  const cgstAmount = Number(order.cgstAmount || 0);
  const sgstAmount = Number(order.sgstAmount || 0);
  const igstAmount = Number(order.igstAmount || 0);
  const cessAmount = Number(order.cessAmount || 0);
  const totalTax = Number(order.taxAmount || 0);
  const shippingAmount = Number(order.shippingAmount || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const totalAmount = Number(order.totalAmount || 0);
  const amountWords = amountToIndianWords(totalAmount);

  // Group line taxes by HSN for the statutory HSN summary table
  const hsnSummary = {};
  items.forEach((item) => {
    const hsn = item.hsnCode || '5007';
    if (!hsnSummary[hsn]) {
      hsnSummary[hsn] = {
        hsn,
        taxable: 0,
        cgstRate: Number(item.cgstRate || 0),
        cgstAmount: 0,
        sgstRate: Number(item.sgstRate || 0),
        sgstAmount: 0,
        igstRate: Number(item.igstRate || 0),
        igstAmount: 0,
        cessAmount: 0,
        totalTax: 0,
      };
    }
    hsnSummary[hsn].taxable += Number(item.taxableAmount || 0);
    hsnSummary[hsn].cgstAmount += Number(item.cgstAmount || 0);
    hsnSummary[hsn].sgstAmount += Number(item.sgstAmount || 0);
    hsnSummary[hsn].igstAmount += Number(item.igstAmount || 0);
    hsnSummary[hsn].cessAmount += Number(item.cessAmount || 0);
    hsnSummary[hsn].totalTax += Number(item.totalTax || 0);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoiceNumber} - Amoga</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1a1a1a;
      background: #f8fafc;
      padding: 24px;
    }
    .invoice-card {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      padding: 32px;
    }
    .no-print-bar {
      max-width: 900px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #111827;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-print:hover { background: #374151; }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-family: Georgia, serif;
      font-size: 26px;
      letter-spacing: 0.1em;
      color: #0f172a;
      text-transform: uppercase;
      font-weight: 700;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.05em;
    }
    .invoice-meta {
      font-size: 12px;
      color: #334155;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 20px;
    }
    .section-box {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px 14px;
      background: #fdfdfd;
    }
    .section-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .meta-row {
      display: flex;
      margin-bottom: 3px;
    }
    .meta-label {
      width: 120px;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
    }
    .meta-val {
      flex: 1;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 600;
      text-align: left;
      padding: 8px;
      border: 1px solid #cbd5e1;
    }
    th.num, td.num { text-align: right; }
    th.center, td.center { text-align: center; }
    td {
      padding: 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .totals-table {
      width: 340px;
      font-size: 11px;
    }
    .totals-table td {
      border: none;
      padding: 4px 8px;
    }
    .totals-table tr.grand-total td {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-size: 13px;
      font-weight: 700;
      padding: 8px;
    }
    .amount-words-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px 14px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .words-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .words-val {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }
    .declarations {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    .terms {
      font-size: 10px;
      color: #64748b;
      line-height: 1.5;
    }
    .signatory {
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 90px;
      border: 1px dashed #cbd5e1;
      padding: 8px;
      border-radius: 4px;
    }
    .signatory-title {
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }
    .signatory-sub {
      font-size: 9px;
      color: #94a3b8;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print-bar { display: none; }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <span style="font-size: 13px; color: #475569;">Amoga Luxury E-Commerce — GST Tax Invoice</span>
    <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">${sellerTradeName}</div>
        <div class="brand-subtitle">Artisanal Luxury & Fine Living</div>
        <div style="margin-top: 6px; font-size: 11px; color: #334155;">
          <strong>${sellerLegalName}</strong><br>
          ${sellerAddress}<br>
          GSTIN: <strong>${sellerGstin}</strong> | State: ${sellerState} (Code: ${sellerStateCode})
        </div>
      </div>
      <div class="invoice-title">
        <h1>TAX INVOICE</h1>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px;">(Issued under Rule 46 of the Central Goods and Services Tax Rules, 2017)</div>
        <div class="invoice-meta"><strong>Invoice No:</strong> ${invoiceNumber}</div>
        <div class="invoice-meta"><strong>Invoice Date:</strong> ${invoiceDate}</div>
        <div class="invoice-meta"><strong>Order Ref:</strong> ${order.orderReference}</div>
        <div class="invoice-meta"><strong>Order Date:</strong> ${orderDate}</div>
        <div class="invoice-meta" style="margin-top: 4px; color: #047857; font-weight: 600;">
          Whether tax is payable on reverse charge: NO
        </div>
      </div>
    </div>

    <!-- Bill To / Ship To Grid -->
    <div class="grid-2">
      <div class="section-box">
        <div class="section-heading">Bill To / Customer Details</div>
        <div class="meta-row">
          <span class="meta-label">Customer Name:</span>
          <span class="meta-val"><strong>${customerName}</strong></span>
        </div>
        ${customerBusinessName ? `
        <div class="meta-row">
          <span class="meta-label">Business Name:</span>
          <span class="meta-val">${customerBusinessName}</span>
        </div>` : ''}
        <div class="meta-row">
          <span class="meta-label">Customer GSTIN:</span>
          <span class="meta-val"><strong>${customerGstin}</strong></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Address:</span>
          <span class="meta-val">${customerAddress}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Phone & Email:</span>
          <span class="meta-val">${customerPhone} | ${customerEmail}</span>
        </div>
      </div>

      <div class="section-box">
        <div class="section-heading">Ship To / Dispatch Details</div>
        <div class="meta-row">
          <span class="meta-label">Consignee Name:</span>
          <span class="meta-val"><strong>${customerName}</strong></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Shipping Address:</span>
          <span class="meta-val">${customerAddress}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Place of Supply:</span>
          <span class="meta-val"><strong>${placeOfSupply}</strong></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Supply Type:</span>
          <span class="meta-val">${isInterState ? 'Inter-State (IGST Applicable)' : 'Intra-State (CGST + SGST Applicable)'}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th class="center" style="width: 30px;">#</th>
          <th>Description of Goods</th>
          <th style="width: 100px;">SKU</th>
          <th class="center" style="width: 60px;">HSN</th>
          <th class="center" style="width: 40px;">Qty</th>
          <th class="num" style="width: 70px;">Rate (₹)</th>
          <th class="num" style="width: 80px;">Taxable (₹)</th>
          ${!isInterState ? `
          <th class="num" style="width: 70px;">CGST (₹)</th>
          <th class="num" style="width: 70px;">SGST (₹)</th>` : `
          <th class="num" style="width: 90px;">IGST (₹)</th>`}
          <th class="num" style="width: 80px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => {
          const itemTotal = Number(item.lineTotal || 0);
          const itemTaxable = Number(item.taxableAmount || itemTotal);
          const cgst = Number(item.cgstAmount || 0);
          const sgst = Number(item.sgstAmount || 0);
          const igst = Number(item.igstAmount || 0);

          return `
          <tr>
            <td class="center">${idx + 1}</td>
            <td>
              <strong>${item.productName}</strong>
              ${item.variantName ? `<span style="color:#64748b;"> (${item.variantName})</span>` : ''}
            </td>
            <td>${item.sku || '-'}</td>
            <td class="center">${item.hsnCode || '5007'}</td>
            <td class="center">${item.quantity}</td>
            <td class="num">${Number(item.unitPrice).toFixed(2)}</td>
            <td class="num">${itemTaxable.toFixed(2)}</td>
            ${!isInterState ? `
            <td class="num">
              <div>${cgst.toFixed(2)}</div>
              <div style="font-size: 9px; color: #64748b;">@${item.cgstRate || 2.5}%</div>
            </td>
            <td class="num">
              <div>${sgst.toFixed(2)}</div>
              <div style="font-size: 9px; color: #64748b;">@${item.sgstRate || 2.5}%</div>
            </td>` : `
            <td class="num">
              <div>${igst.toFixed(2)}</div>
              <div style="font-size: 9px; color: #64748b;">@${item.igstRate || 5}%</div>
            </td>`}
            <td class="num"><strong>${itemTotal.toFixed(2)}</strong></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- HSN Summary Table -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
        HSN / Tax Slabs Summary
      </div>
      <table>
        <thead>
          <tr>
            <th class="center">HSN/SAC</th>
            <th class="num">Taxable Value (₹)</th>
            ${!isInterState ? `
            <th class="num">CGST Amount (₹)</th>
            <th class="num">SGST Amount (₹)</th>` : `
            <th class="num">IGST Amount (₹)</th>`}
            <th class="num">Total Tax (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(hsnSummary).map((s) => `
            <tr>
              <td class="center">${s.hsn}</td>
              <td class="num">${s.taxable.toFixed(2)}</td>
              ${!isInterState ? `
              <td class="num">${s.cgstAmount.toFixed(2)}</td>
              <td class="num">${s.sgstAmount.toFixed(2)}</td>` : `
              <td class="num">${s.igstAmount.toFixed(2)}</td>`}
              <td class="num"><strong>${s.totalTax.toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Area -->
    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td>Total Taxable Value:</td>
          <td class="num">₹${taxableAmount.toFixed(2)}</td>
        </tr>
        ${!isInterState ? `
        <tr>
          <td>Total Central Tax (CGST):</td>
          <td class="num">₹${cgstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total State Tax (SGST):</td>
          <td class="num">₹${sgstAmount.toFixed(2)}</td>
        </tr>` : `
        <tr>
          <td>Total Integrated Tax (IGST):</td>
          <td class="num">₹${igstAmount.toFixed(2)}</td>
        </tr>`}
        ${cessAmount > 0 ? `
        <tr>
          <td>Total GST Cess:</td>
          <td class="num">₹${cessAmount.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td>Total GST Tax Amount:</td>
          <td class="num"><strong>₹${totalTax.toFixed(2)}</strong></td>
        </tr>
        ${discountAmount > 0 ? `
        <tr>
          <td>Promotional Discount:</td>
          <td class="num" style="color: #047857;">-₹${discountAmount.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td>Shipping & Handling:</td>
          <td class="num">${shippingAmount > 0 ? `₹${shippingAmount.toFixed(2)}` : 'FREE'}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="num">₹${totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words-box">
      <div class="words-label">Invoice Amount in Words</div>
      <div class="words-val">${amountWords}</div>
    </div>

    <!-- Declarations & Signatory -->
    <div class="declarations">
      <div class="terms">
        <strong>Statutory Declaration:</strong><br>
        1. Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged.<br>
        2. All goods sold are hand-crafted / natural / authentic artisanal creations. Handloom textures and organic variations are natural characteristics of craft authenticity.<br>
        3. Disputes, if any, shall be subject exclusively to Chennai jurisdiction.<br>
        4. Customer GSTIN entered at checkout is deemed verified by the buyer.
      </div>
      <div class="signatory">
        <div class="signatory-title">For ${sellerLegalName}</div>
        <div style="font-family: 'Brush Script MT', cursive, serif; font-size: 18px; color: #1e3a8a; margin: 10px 0;">
          Amoga Authorized
        </div>
        <div class="signatory-sub">Authorized Signatory<br>(Computer Generated Invoice)</div>
      </div>
    </div>

  </div>
</body>
</html>`;
}
