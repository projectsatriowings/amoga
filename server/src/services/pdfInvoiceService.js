import PDFDocument from 'pdfkit';
import { amountToIndianWords } from './invoiceService.js';
import archiver from 'archiver';

/**
 * AMOGA E-COMMERCE — PROFESSIONAL GST TAX INVOICE PDF GENERATOR
 * Generates audit-compliant vector A4 PDFs under Section 31 of CGST Act and Rule 46 of CGST Rules.
 */

export async function generateInvoicePdfBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Tax Invoice ${order.invoiceNumber || order.orderReference}`,
          Author: 'Amoga Luxury Private Limited',
          Subject: 'GST Tax Invoice',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const sellerLegalName = order.sellerLegalName || 'Amoga Luxury Private Limited';
      const sellerTradeName = order.sellerTradeName || 'Amoga';
      const sellerGstin = order.sellerGstin || '33AYMPK1833D1ZQ';
      const sellerAddress = order.sellerAddress || '108, Heritage Walk, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017';
      const sellerState = order.sellerState || 'Tamil Nadu';
      const sellerStateCode = order.sellerStateCode || '33';
      const sellerFssai = order.sellerFssai || order.fssaiLicenseNumber || '22425540000677';

      const invoiceNumber = order.invoiceNumber || 'INV-PENDING';
      const invoiceDateStr = order.invoiceDate
        ? new Date(order.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const orderDateStr = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const customerName = order.customerName || 'Customer';
      const customerGstin = order.customerGstin ? order.customerGstin.toUpperCase() : 'URP (Unregistered Person)';
      const placeOfSupply = `${order.placeOfSupply || order.state || 'Tamil Nadu'} (Code: ${order.placeOfSupplyCode || '33'})`;
      const isInterState = Boolean(order.isInterState);

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

      // --- 1. HEADER SECTION ---
      doc.rect(36, 36, 523, 70).fillAndStroke('#FBF9F5', '#E5E0D5');
      
      doc.fillColor('#722F37').fontSize(20).font('Helvetica-Bold').text('AMOGA', 48, 48, { characterSpacing: 2 });
      doc.fillColor('#5C544C').fontSize(8).font('Helvetica').text('HAUTE LUXURY & ATELIER HERITAGE', 48, 72, { characterSpacing: 1 });
      doc.fillColor('#7A7167').fontSize(7.5).text(`GSTIN: ${sellerGstin} | State Code: ${sellerStateCode} | FSSAI: ${sellerFssai}`, 48, 84);

      doc.fillColor('#1A1817').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 350, 48, { align: 'right', width: 195 });
      doc.fillColor('#5C544C').fontSize(8).font('Helvetica').text(`Invoice No: ${invoiceNumber}`, 350, 68, { align: 'right', width: 195 });
      doc.text(`Invoice Date: ${invoiceDateStr}`, 350, 80, { align: 'right', width: 195 });
      doc.text(`Order Ref: ${order.orderReference}`, 350, 92, { align: 'right', width: 195 });

      let currentY = 116;

      // --- 2. SELLER & BUYER DETAILS BOXES ---
      const boxWidth = 255;
      const boxHeight = 85;

      // Seller Box
      doc.rect(36, currentY, boxWidth, boxHeight).fillAndStroke('#FFFFFF', '#E5E0D5');
      doc.fillColor('#722F37').fontSize(8).font('Helvetica-Bold').text('SOLD BY / SUPPLIER', 44, currentY + 8);
      doc.fillColor('#1A1817').fontSize(8.5).font('Helvetica-Bold').text(sellerLegalName, 44, currentY + 20);
      doc.fillColor('#4A423B').fontSize(7.5).font('Helvetica').text(sellerAddress, 44, currentY + 32, { width: 235 });
      doc.text(`State: ${sellerState} (Code: ${sellerStateCode})`, 44, currentY + 56);
      doc.text(`GSTIN: ${sellerGstin}`, 44, currentY + 68);

      // Buyer Box
      doc.rect(304, currentY, boxWidth, boxHeight).fillAndStroke('#FFFFFF', '#E5E0D5');
      doc.fillColor('#722F37').fontSize(8).font('Helvetica-Bold').text('BILL TO / SHIP TO (BUYER)', 312, currentY + 8);
      doc.fillColor('#1A1817').fontSize(8.5).font('Helvetica-Bold').text(customerName, 312, currentY + 20);
      
      const buyerAddr = [order.addressLine1, order.addressLine2, order.city, order.state, order.pincode].filter(Boolean).join(', ');
      doc.fillColor('#4A423B').fontSize(7.5).font('Helvetica').text(buyerAddr || 'Billing address on verified file', 312, currentY + 32, { width: 235 });
      doc.text(`Place of Supply: ${placeOfSupply}`, 312, currentY + 56);
      doc.text(`Buyer GSTIN: ${customerGstin}`, 312, currentY + 68);

      currentY += boxHeight + 12;

      // --- 3. ITEMS TABLE ---
      const tableX = 36;
      const colWidths = {
        sl: 20,
        desc: 175,
        hsn: 42,
        qty: 24,
        rate: 52,
        taxable: 54,
        gstRate: 36,
        cgst: 38,
        sgst: 38,
        igst: 44,
      };

      // Table Header
      doc.rect(tableX, currentY, 523, 18).fillAndStroke('#F5F2EB', '#D5CEC2');
      doc.fillColor('#1A1817').fontSize(7).font('Helvetica-Bold');
      doc.text('#', tableX + 3, currentY + 5, { width: colWidths.sl, align: 'center' });
      doc.text('ITEM DESCRIPTION', tableX + 24, currentY + 5, { width: colWidths.desc });
      doc.text('HSN', tableX + 200, currentY + 5, { width: colWidths.hsn, align: 'center' });
      doc.text('QTY', tableX + 244, currentY + 5, { width: colWidths.qty, align: 'center' });
      doc.text('RATE (₹)', tableX + 270, currentY + 5, { width: colWidths.rate, align: 'right' });
      doc.text('TAXABLE (₹)', tableX + 324, currentY + 5, { width: colWidths.taxable, align: 'right' });
      doc.text('GST %', tableX + 380, currentY + 5, { width: colWidths.gstRate, align: 'center' });
      if (isInterState) {
        doc.text('IGST (₹)', tableX + 418, currentY + 5, { width: 65, align: 'right' });
        doc.text('TOTAL (₹)', tableX + 485, currentY + 5, { width: 70, align: 'right' });
      } else {
        doc.text('CGST (₹)', tableX + 418, currentY + 5, { width: 44, align: 'right' });
        doc.text('SGST (₹)', tableX + 464, currentY + 5, { width: 44, align: 'right' });
        doc.text('TOTAL (₹)', tableX + 510, currentY + 5, { width: 46, align: 'right' });
      }

      currentY += 18;

      // Table Rows
      doc.font('Helvetica').fontSize(7).fillColor('#332D28');
      items.forEach((item, index) => {
        const rowHeight = 22;
        if (index % 2 === 1) {
          doc.rect(tableX, currentY, 523, rowHeight).fill('#FBF9F5');
        }
        doc.rect(tableX, currentY, 523, rowHeight).stroke('#EAE4D9');

        doc.fillColor('#7A7167').text(String(index + 1), tableX + 3, currentY + 6, { width: colWidths.sl, align: 'center' });
        
        // Item Name & SKU
        doc.fillColor('#1A1817').font('Helvetica-Bold').text(item.productName || 'Product', tableX + 24, currentY + 4, { width: colWidths.desc, lineBreak: false });
        if (item.sku) {
          doc.fillColor('#7A7167').font('Helvetica').fontSize(6).text(`SKU: ${item.sku}`, tableX + 24, currentY + 13);
        }

        doc.fontSize(7).font('Helvetica').fillColor('#332D28');
        doc.text(item.hsnCode || '5007', tableX + 200, currentY + 6, { width: colWidths.hsn, align: 'center' });
        doc.text(String(item.quantity || 1), tableX + 244, currentY + 6, { width: colWidths.qty, align: 'center' });
        doc.text(Number(item.unitPrice || 0).toFixed(2), tableX + 270, currentY + 6, { width: colWidths.rate, align: 'right' });
        doc.text(Number(item.taxableAmount || 0).toFixed(2), tableX + 324, currentY + 6, { width: colWidths.taxable, align: 'right' });
        doc.text(`${Number(item.gstRate || 0)}%`, tableX + 380, currentY + 6, { width: colWidths.gstRate, align: 'center' });

        if (isInterState) {
          doc.text(Number(item.igstAmount || 0).toFixed(2), tableX + 418, currentY + 6, { width: 65, align: 'right' });
          doc.font('Helvetica-Bold').text(Number(item.lineTotal || 0).toFixed(2), tableX + 485, currentY + 6, { width: 70, align: 'right' });
        } else {
          doc.text(Number(item.cgstAmount || 0).toFixed(2), tableX + 418, currentY + 6, { width: 44, align: 'right' });
          doc.text(Number(item.sgstAmount || 0).toFixed(2), tableX + 464, currentY + 6, { width: 44, align: 'right' });
          doc.font('Helvetica-Bold').text(Number(item.lineTotal || 0).toFixed(2), tableX + 510, currentY + 6, { width: 46, align: 'right' });
        }

        currentY += rowHeight;
      });

      currentY += 8;

      // --- 4. STATUTORY SUMMARY & HSN BREAKDOWN ---
      const summaryBoxY = currentY;
      const leftColWidth = 310;
      const rightColWidth = 205;

      // Left Box: Amount in Words & Payment Note
      doc.rect(tableX, summaryBoxY, leftColWidth, 85).fillAndStroke('#FFFFFF', '#E5E0D5');
      doc.fillColor('#722F37').fontSize(7.5).font('Helvetica-Bold').text('AMOUNT IN WORDS (INR):', tableX + 8, summaryBoxY + 8);
      doc.fillColor('#1A1817').fontSize(8).font('Helvetica-Bold').text(amountWords, tableX + 8, summaryBoxY + 20, { width: 290 });
      
      doc.fillColor('#722F37').fontSize(7.5).font('Helvetica-Bold').text('PAYMENT DETAILS & STATUS:', tableX + 8, summaryBoxY + 44);
      const paymentInfo = order.paymentStatus === 'SUCCEEDED'
        ? `Status: PAID IN FULL (Status: ${order.paymentStatus})`
        : `Status: ${order.paymentStatus || 'PENDING'} (Balance: ₹${totalAmount.toFixed(2)})`;
      doc.fillColor('#4A423B').fontSize(7.5).font('Helvetica').text(paymentInfo, tableX + 8, summaryBoxY + 56);
      doc.text(`Currency: INR | Supply Type: ${isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}`, tableX + 8, summaryBoxY + 68);

      // Right Box: Financial Totals Table
      doc.rect(tableX + leftColWidth + 8, summaryBoxY, rightColWidth, 85).fillAndStroke('#FBF9F5', '#E5E0D5');
      let totalsY = summaryBoxY + 8;
      const renderTotalRow = (label, value, bold = false, color = '#1A1817') => {
        doc.fillColor(color).fontSize(7.5).font(bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, tableX + leftColWidth + 14, totalsY);
        doc.text(`₹${Number(value).toFixed(2)}`, tableX + leftColWidth + 120, totalsY, { width: 85, align: 'right' });
        totalsY += 12;
      };

      renderTotalRow('Taxable Value:', taxableAmount);
      if (isInterState) {
        renderTotalRow('IGST Total:', igstAmount);
      } else {
        renderTotalRow('CGST Total:', cgstAmount);
        renderTotalRow('SGST Total:', sgstAmount);
      }
      if (shippingAmount > 0) renderTotalRow('Shipping & Handling:', shippingAmount);
      if (discountAmount > 0) renderTotalRow('Discount Applied:', -discountAmount, false, '#8C2020');

      doc.rect(tableX + leftColWidth + 8, totalsY - 2, rightColWidth, 1).stroke('#D5CEC2');
      totalsY += 2;
      renderTotalRow('INVOICE TOTAL:', totalAmount, true, '#722F37');

      currentY = summaryBoxY + 95;

      // --- 5. HSN SUMMARY STATUTORY TABLE ---
      doc.fillColor('#722F37').fontSize(8).font('Helvetica-Bold').text('GST HSN / SAC TAX BREAKDOWN (RULE 46 COMPLIANCE):', tableX, currentY);
      currentY += 12;

      // Group by HSN
      const hsnSummary = {};
      items.forEach((item) => {
        const hsn = item.hsnCode || '5007';
        if (!hsnSummary[hsn]) {
          hsnSummary[hsn] = {
            hsn,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
            gstRate: Number(item.gstRate || 0),
          };
        }
        hsnSummary[hsn].taxable += Number(item.taxableAmount || 0);
        hsnSummary[hsn].cgst += Number(item.cgstAmount || 0);
        hsnSummary[hsn].sgst += Number(item.sgstAmount || 0);
        hsnSummary[hsn].igst += Number(item.igstAmount || 0);
        hsnSummary[hsn].totalTax += Number(item.totalTax || 0);
      });

      doc.rect(tableX, currentY, 523, 14).fillAndStroke('#F5F2EB', '#D5CEC2');
      doc.fillColor('#1A1817').fontSize(6.5).font('Helvetica-Bold');
      doc.text('HSN/SAC', tableX + 8, currentY + 4, { width: 70 });
      doc.text('TAXABLE VALUE (₹)', tableX + 80, currentY + 4, { width: 90, align: 'right' });
      doc.text('CGST (₹)', tableX + 180, currentY + 4, { width: 75, align: 'right' });
      doc.text('SGST (₹)', tableX + 265, currentY + 4, { width: 75, align: 'right' });
      doc.text('IGST (₹)', tableX + 350, currentY + 4, { width: 75, align: 'right' });
      doc.text('TOTAL TAX (₹)', tableX + 435, currentY + 4, { width: 80, align: 'right' });

      currentY += 14;

      doc.font('Helvetica').fontSize(6.5).fillColor('#332D28');
      Object.values(hsnSummary).forEach((h) => {
        doc.rect(tableX, currentY, 523, 14).fillAndStroke('#FFFFFF', '#EAE4D9');
        doc.text(h.hsn, tableX + 8, currentY + 4);
        doc.text(h.taxable.toFixed(2), tableX + 80, currentY + 4, { width: 90, align: 'right' });
        doc.text(h.cgst.toFixed(2), tableX + 180, currentY + 4, { width: 75, align: 'right' });
        doc.text(h.sgst.toFixed(2), tableX + 265, currentY + 4, { width: 75, align: 'right' });
        doc.text(h.igst.toFixed(2), tableX + 350, currentY + 4, { width: 75, align: 'right' });
        doc.font('Helvetica-Bold').text(h.totalTax.toFixed(2), tableX + 435, currentY + 4, { width: 80, align: 'right' });
        doc.font('Helvetica');
        currentY += 14;
      });

      // --- 6. DECLARATION & SIGNATURE FOOTER ---
      currentY += 16;
      doc.rect(tableX, currentY, 320, 50).fillAndStroke('#FFFFFF', '#E5E0D5');
      doc.fillColor('#7A7167').fontSize(6.5).font('Helvetica-Bold').text('DECLARATION:', tableX + 6, currentY + 6);
      doc.font('Helvetica').fontSize(6).text(
        'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Electronic tax invoice generated under the Central Goods and Services Tax Act, 2017.',
        tableX + 6,
        currentY + 16,
        { width: 308 }
      );

      doc.rect(tableX + 330, currentY, 193, 50).fillAndStroke('#FBF9F5', '#E5E0D5');
      doc.fillColor('#1A1817').fontSize(6.5).font('Helvetica-Bold').text(`For ${sellerLegalName}`, tableX + 336, currentY + 6, { align: 'right', width: 180 });
      doc.fillColor('#7A7167').fontSize(6).font('Helvetica').text('Authorized Signatory / Digital Validation', tableX + 336, currentY + 36, { align: 'right', width: 180 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates an archiver ZIP containing individual PDF invoices
 */
export async function createInvoicesZipArchive(orders) {
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Process and append each invoice
  (async () => {
    for (const order of orders) {
      try {
        const pdfBuf = await generateInvoicePdfBuffer(order);
        const safeInvNum = (order.invoiceNumber || order.orderReference || order.id).replace(/[/\\?%*:|"<>]/g, '_');
        archive.append(pdfBuf, { name: `Tax_Invoice_${safeInvNum}.pdf` });
      } catch (err) {
        console.error(`Failed to generate PDF for order ${order.id}:`, err);
      }
    }
    archive.finalize();
  })();

  return archive;
}
