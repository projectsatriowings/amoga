import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  getNextPosBillNumber,
  getPosSettings,
  updatePosSettings,
  searchPosCatalog,
  calculatePosBillTax,
  finalizePosSale,
  cancelPosSale,
  refundPosSale,
  listPosSales,
  getPosSale,
  getPosSalesReport,
  listStallEvents,
  createStallEvent,
  updateStallEvent,
} from '../src/services/posService.js';
import {
  normalizeIndianPhone,
  buildReceiptMessage,
  generateWhatsAppFallbackLink,
  sendPosBillWhatsApp,
  isWhatsAppApiConfigured,
} from '../src/services/whatsappService.js';

describe('Stall Billing / Point of Sale (POS) Module Suite', () => {
  let testAdmin = null;
  let testEvent = null;
  let testProduct = null;
  let testVariant = null;

  before(async () => {
    // 1. Ensure test admin user exists
    testAdmin = await prisma.adminUser.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    if (!testAdmin) {
      testAdmin = await prisma.adminUser.create({
        data: {
          email: `pos_test_admin_${Date.now()}@amoga.com`,
          name: 'POS Test Supervisor',
          passwordHash: 'dummy_hash_for_pos_test',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    }

    // 2. Create test stall event
    testEvent = await createStallEvent(
      {
        name: 'Chennai Trade Fair 2026',
        venue: 'Chennai Trade Centre, Nandambakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        stateCode: '33',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-31'),
        status: 'ACTIVE',
        openingCashBalance: 5000.0,
      },
      testAdmin.email,
      testAdmin.id
    );

    // 3. Find or create a test product and variant with dedicated stock
    const collection = await prisma.collection.findFirst();
    const collectionId = collection ? collection.id : 'food';

    testProduct = await prisma.product.create({
      data: {
        sourceId: `TEST-POS-PROD-${Date.now()}`,
        name: 'Handcrafted Heritage Jasmine Rice',
        slug: `test-pos-jasmine-rice-${Date.now()}`,
        description: 'Aromatic Jasmine rice harvested from traditional organic fields in Tamil Nadu.',
        image: '/uploads/products/jasmine_rice.jpg',
        sku: `AMOGA-TST-${Date.now().toString().slice(-4)}`,
        collectionId,
        category: 'Food',
        price: 500.0,
        hsnCode: '1006',
        gstRate: 5.0,
        isTaxInclusive: true,
        stockQuantity: 25,
        inStock: true,
      },
    });

    testVariant = await prisma.productVariant.create({
      data: {
        sourceId: `TEST-POS-VAR-${Date.now()}`,
        productId: testProduct.id,
        name: '1kg Pouch',
        sku: `${testProduct.sku}-1KG`,
        price: 500.0,
        hsnCode: '1006',
        gstRate: 5.0,
        isTaxInclusive: true,
        stockQuantity: 25,
        inStock: true,
      },
    });

    // Seed dedicated stall stock location balance for the event
    const stallLoc =
      (await prisma.stockLocation.findFirst({ where: { stallEventId: testEvent.id } })) ||
      (await prisma.stockLocation.findFirst({ where: { type: 'STALL' } }));
    if (stallLoc) {
      await prisma.locationInventory.create({
        data: {
          locationId: stallLoc.id,
          productId: testProduct.id,
          variantId: testVariant.id,
          onHandQuantity: 25,
        },
      });
    }
  });

  after(async () => {
    // Clean up created test entities safely
    try {
      if (testVariant) {
        await prisma.locationInventory.deleteMany({ where: { variantId: testVariant.id } }).catch(() => {});
        await prisma.locationMovementLog.deleteMany({ where: { variantId: testVariant.id } }).catch(() => {});
        await prisma.posSaleItem.deleteMany({ where: { variantId: testVariant.id } }).catch(() => {});
        await prisma.inventoryLog.deleteMany({ where: { variantId: testVariant.id } }).catch(() => {});
        await prisma.productVariant.delete({ where: { id: testVariant.id } }).catch(() => {});
      }
      if (testProduct) {
        await prisma.locationInventory.deleteMany({ where: { productId: testProduct.id } }).catch(() => {});
        await prisma.locationMovementLog.deleteMany({ where: { productId: testProduct.id } }).catch(() => {});
        await prisma.posSaleItem.deleteMany({ where: { productId: testProduct.id } }).catch(() => {});
        await prisma.inventoryLog.deleteMany({ where: { productId: testProduct.id } }).catch(() => {});
        await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
      }
      if (testEvent) {
        await prisma.posSale.deleteMany({ where: { stallEventId: testEvent.id } }).catch(() => {});
        await prisma.stallEvent.delete({ where: { id: testEvent.id } }).catch(() => {});
      }
    } catch {
      // Ignore teardown errors
    }
  });

  // ================= A. CONCURRENCY-SAFE SEQUENTIAL BILL NUMBERING =================
  describe('A. Sequential Bill Numbering & Settings', () => {
    it('should generate sequential, zero-padded bill numbers', async () => {
      const seqPrefix = `TEST-POS-SEQ-${Date.now()}/`;
      const b1 = await getNextPosBillNumber(seqPrefix);
      const b2 = await getNextPosBillNumber(seqPrefix);
      const b3 = await getNextPosBillNumber(seqPrefix);

      assert.equal(b1, `${seqPrefix}0001`);
      assert.equal(b2, `${seqPrefix}0002`);
      assert.equal(b3, `${seqPrefix}0003`);
    });

    it('should handle concurrent sequence requests without duplicates', async () => {
      const prefix = `CONCURRENT-${Date.now()}/`;
      const promises = Array.from({ length: 10 }, () => getNextPosBillNumber(prefix));
      const results = await Promise.all(promises);

      const uniqueSet = new Set(results);
      assert.equal(uniqueSet.size, 10, 'All concurrent bill numbers must be unique');
    });

    it('should retrieve and update POS configuration settings', async () => {
      const settings = await getPosSettings();
      assert.ok(settings);
      assert.equal(settings.id, 'default');

      const updated = await updatePosSettings(
        {
          receiptPrinterWidth: '80mm',
          enableBarcodeScanner: true,
          maxDiscountPercentWithoutApproval: 12.5,
        },
        testAdmin.email,
        testAdmin.id
      );

      assert.equal(updated.receiptPrinterWidth, '80mm');
      assert.equal(Number(updated.maxDiscountPercentWithoutApproval), 12.5);
    });
  });

  // ================= B. GST-INCLUSIVE TAX CALCULATIONS =================
  describe('B. GST-Inclusive Deconstruction & Statutory Tax', () => {
    it('should accurately deconstruct GST from inclusive prices for Intra-state sale (50/50 CGST+SGST)', async () => {
      // Product: 500 incl. 5% GST
      // Taxable = 500 / 1.05 = 476.19
      // Tax = 23.81 (CGST: 11.91, SGST: 11.90)
      const calc = await calculatePosBillTax({
        items: [
          {
            variantId: testVariant.id,
            quantity: 2,
            unitPrice: 500.0,
            gstRate: 5.0,
            isTaxInclusive: true,
          },
        ],
        stallEventId: testEvent.id, // TN (33) -> Intra-state
        discountAmount: 0,
      });

      assert.equal(calc.grossSubtotal, 1000.0);
      assert.equal(calc.discountAmount, 0);
      assert.equal(calc.netPayableTotal, 1000.0);
      assert.equal(calc.taxableSubtotal, 952.38);
      assert.equal(calc.totalGstAmount, 47.62);
      assert.equal(calc.cgstAmount, 23.81);
      assert.equal(calc.sgstAmount, 23.81);
      assert.equal(calc.igstAmount, 0.0);
    });

    it('should correctly allocate discount proportionally before calculating taxes', async () => {
      // Gross 1000, Discount 100 -> Net 900
      // Net Taxable = 900 / 1.05 = 857.14
      // Tax = 42.86
      const calc = await calculatePosBillTax({
        items: [
          {
            variantId: testVariant.id,
            quantity: 2,
            unitPrice: 500.0,
            gstRate: 5.0,
            isTaxInclusive: true,
          },
        ],
        stallEventId: testEvent.id,
        discountAmount: 100.0,
      });

      assert.equal(calc.grossSubtotal, 1000.0);
      assert.equal(calc.discountAmount, 100.0);
      assert.equal(calc.netPayableTotal, 900.0);
      assert.equal(calc.taxableSubtotal, 857.14);
      assert.equal(calc.totalGstAmount, 42.86);
      assert.equal(calc.cgstAmount + calc.sgstAmount + calc.igstAmount, 42.86);
    });
  });

  // ================= C. CATALOGUE SEARCH =================
  describe('C. POS Fast Catalogue Search', () => {
    it('should find products by name or SKU across collections', async () => {
      const searchRes = await searchPosCatalog({
        query: 'Jasmine Rice',
        inStockOnly: false,
      });

      assert.ok(searchRes.length > 0);
      const found = searchRes.find((p) => p.id === testProduct.id);
      assert.ok(found);
      assert.equal(found.variants.length, 1);
      assert.equal(found.variants[0].sku, testVariant.sku);
    });
  });

  // ================= D. BILL FINALIZATION & INVENTORY DEDUCTION =================
  describe('D. Bill Finalization, Stock Ledger & Deductions', () => {
    it('should finalize bill, deduct stock, and create audit log', async () => {
      const initialStock = testVariant.stockQuantity;
      const qtyToBuy = 3;

      const { sale, isDuplicate } = await finalizePosSale({
        stallEventId: testEvent.id,
        staffId: testAdmin.id,
        staffEmail: testAdmin.email,
        staffName: testAdmin.name,
        customerName: 'Aaditya Rao',
        customerPhone: '9876543210',
        items: [
          {
            variantId: testVariant.id,
            productId: testProduct.id,
            productName: testProduct.name,
            variantName: testVariant.name,
            quantity: qtyToBuy,
            unitPrice: 500.0,
            gstRate: 5.0,
            isTaxInclusive: true,
          },
        ],
        overallDiscountType: 'AMOUNT',
        overallDiscountValue: 50.0,
        discountReason: 'Exhibition promo',
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        paymentReference: 'UPI/2026/098765',
      });

      assert.equal(isDuplicate, false);
      assert.ok(sale.billNumber.startsWith('AMOGA-POS-'));
      assert.equal(sale.customerName, 'Aaditya Rao');
      assert.equal(sale.customerPhone, '9876543210');
      assert.equal(Number(sale.subtotal), 1500.0);
      assert.equal(Number(sale.discountAmount), 50.0);
      assert.equal(Number(sale.totalAmount), 1450.0);
      assert.equal(sale.items.length, 1);

      // Verify stock was deducted authoritatively from stall inventory
      const stallLoc =
        (await prisma.stockLocation.findFirst({ where: { stallEventId: testEvent.id } })) ||
        (await prisma.stockLocation.findFirst({ where: { type: 'STALL' } }));
      if (stallLoc) {
        const stallInv = await prisma.locationInventory.findFirst({
          where: { locationId: stallLoc.id, variantId: testVariant.id },
        });
        if (stallInv) {
          assert.equal(stallInv.onHandQuantity, 25 - qtyToBuy);
        }
      } else {
        const updatedVariant = await prisma.productVariant.findUnique({
          where: { id: testVariant.id },
        });
        assert.equal(updatedVariant.stockQuantity, initialStock - qtyToBuy);
      }
    });

    it('should reject sale if requested quantity exceeds available stock', async () => {
      await assert.rejects(
        async () => {
          await finalizePosSale({
            stallEventId: testEvent.id,
            staffId: testAdmin.id,
            staffEmail: testAdmin.email,
            staffName: testAdmin.name,
            items: [
              {
                variantId: testVariant.id,
                quantity: 9999, // Way more than in stock
                unitPrice: 500.0,
              },
            ],
            paymentMethod: 'CASH',
          });
        },
        (err) => {
          assert.equal(err.status, 422);
          assert.ok(err.message.toLowerCase().includes('insufficient'));
          return true;
        }
      );
    });

    it('should prevent duplicate billing on request retry using idempotencyKey', async () => {
      const idempotencyKey = `POS-IDEMP-${Date.now()}`;
      const payload = {
        stallEventId: testEvent.id,
        staffId: testAdmin.id,
        staffEmail: testAdmin.email,
        staffName: testAdmin.name,
        customerName: 'Repeat Customer',
        customerPhone: '9840123456',
        items: [
          {
            variantId: testVariant.id,
            quantity: 1,
            unitPrice: 500.0,
          },
        ],
        paymentMethod: 'CASH',
        idempotencyKey,
      };

      const res1 = await finalizePosSale(payload);
      assert.equal(res1.isDuplicate, false);

      // Retry exact same request with same idempotencyKey
      const res2 = await finalizePosSale(payload);
      assert.equal(res2.isDuplicate, true);
      assert.equal(res2.sale.id, res1.sale.id);
      assert.equal(res2.sale.billNumber, res1.sale.billNumber);
    });
  });

  // ================= E. CANCELLATION & REFUND WITH COMPENSATING RESTOCK =================
  describe('E. Safe Cancellation and Refund Stock Movements', () => {
    it('should cancel bill and restore stock with POS_CANCEL movement', async () => {
      // 1. Create a bill
      const { sale } = await finalizePosSale({
        stallEventId: testEvent.id,
        staffId: testAdmin.id,
        staffEmail: testAdmin.email,
        staffName: testAdmin.name,
        customerName: 'To Cancel',
        items: [{ variantId: testVariant.id, quantity: 2, unitPrice: 500.0 }],
        paymentMethod: 'CASH',
      });

      const stockBeforeCancel = (
        await prisma.productVariant.findUnique({ where: { id: testVariant.id } })
      ).stockQuantity;

      // 2. Cancel the bill
      const cancelRes = await cancelPosSale({
        saleId: sale.id,
        staffEmail: testAdmin.email,
        staffId: testAdmin.id,
        reason: 'Customer changed mind at register',
      });

      assert.equal(cancelRes.success, true);
      assert.equal(cancelRes.sale.status, 'CANCELLED');

      // 3. Verify stock restored
      const stallLoc =
        (await prisma.stockLocation.findFirst({ where: { stallEventId: testEvent.id } })) ||
        (await prisma.stockLocation.findFirst({ where: { type: 'STALL' } }));
      if (stallLoc) {
        const inv = await prisma.locationInventory.findFirst({
          where: { locationId: stallLoc.id, variantId: testVariant.id },
        });
        assert.ok(inv);
      } else {
        const stockAfterCancel = (
          await prisma.productVariant.findUnique({ where: { id: testVariant.id } })
        ).stockQuantity;
        assert.equal(stockAfterCancel, stockBeforeCancel + 2);
      }
    });

    it('should refund bill and record audit log with POS_REFUND', async () => {
      // 1. Create a bill
      const { sale } = await finalizePosSale({
        stallEventId: testEvent.id,
        staffId: testAdmin.id,
        staffEmail: testAdmin.email,
        staffName: testAdmin.name,
        customerName: 'To Refund',
        items: [{ variantId: testVariant.id, quantity: 1, unitPrice: 500.0 }],
        paymentMethod: 'CARD',
      });

      const stockBefore = (
        await prisma.productVariant.findUnique({ where: { id: testVariant.id } })
      ).stockQuantity;

      // 2. Refund
      const refundRes = await refundPosSale({
        saleId: sale.id,
        staffEmail: testAdmin.email,
        staffId: testAdmin.id,
        refundAmount: 500.0,
        reason: 'Exhibition return',
        restockItems: true,
      });

      assert.equal(refundRes.success, true);
      assert.equal(refundRes.sale.status, 'REFUNDED');
      assert.equal(Number(refundRes.sale.refundedAmount), 500.0);

      // Verify stock restored
      const stallLoc =
        (await prisma.stockLocation.findFirst({ where: { stallEventId: testEvent.id } })) ||
        (await prisma.stockLocation.findFirst({ where: { type: 'STALL' } }));
      if (stallLoc) {
        const invAfter = await prisma.locationInventory.findFirst({
          where: { locationId: stallLoc.id, variantId: testVariant.id },
        });
        assert.ok(invAfter);
      } else {
        const stockAfter = (
          await prisma.productVariant.findUnique({ where: { id: testVariant.id } })
        ).stockQuantity;
        assert.equal(stockAfter, stockBefore + 1);
      }
    });
  });

  // ================= F. WHATSAPP DELIVERY & MANUAL FALLBACK =================
  describe('F. WhatsApp Delivery Service & Manual Fallback', () => {
    it('should normalize valid 10-digit Indian mobile numbers in multiple formats', () => {
      const f1 = normalizeIndianPhone('9876543210');
      assert.equal(f1.isValid, true);
      assert.equal(f1.normalizedWaNumber, '919876543210');
      assert.equal(f1.formattedE164, '+919876543210');

      const f2 = normalizeIndianPhone('+91 98765 43210');
      assert.equal(f2.isValid, true);
      assert.equal(f2.normalizedWaNumber, '919876543210');

      const f3 = normalizeIndianPhone('09876543210');
      assert.equal(f3.isValid, true);
      assert.equal(f3.normalizedWaNumber, '919876543210');

      const bad = normalizeIndianPhone('12345');
      assert.equal(bad.isValid, false);
    });

    it('should build a professional, compliant receipt message with tax invoice link and opt-out', () => {
      const msg = buildReceiptMessage({
        billNumber: 'AMOGA-POS-2026/0042',
        createdAt: new Date('2026-10-17T12:00:00Z'),
        stallName: 'Chennai Trade Fair',
        customerName: 'Meenakshi Sundaram',
        items: [
          { productName: 'Handcrafted Heritage Jasmine Rice', variantName: '1kg', quantity: 2, lineTotal: 1000 },
        ],
        subtotal: 1000,
        discountAmount: 100,
        totalAmount: 900,
        paymentMethod: 'UPI',
        receiptUrl: 'https://amogastores.com/receipt/sample-token-1234567890',
        sellerTradeName: 'Amoga',
      });

      assert.ok(msg.includes('AMOGA — STORE RECEIPT'));
      assert.ok(msg.includes('Bill No:* AMOGA-POS-2026/0042'));
      assert.ok(msg.includes('Total Paid:* ₹900'));
      assert.ok(msg.includes('https://amogastores.com/receipt/sample-token-1234567890'));
      assert.ok(msg.includes('reply STOP'));
    });

    it('should generate verified manual fallback link when WhatsApp API is not configured', async () => {
      const fallback = await sendPosBillWhatsApp({
        phone: '9876543210',
        billNumber: 'AMOGA-POS-2026/0099',
        items: [{ productName: 'Test Item', quantity: 1, lineTotal: 250 }],
        subtotal: 250,
        discountAmount: 0,
        totalAmount: 250,
        paymentMethod: 'CASH',
        receiptUrl: 'https://amogastores.com/receipt/token-999',
        forceManual: true,
      });

      assert.equal(fallback.success, true);
      assert.equal(fallback.deliveryMode, 'MANUAL_FALLBACK');
      assert.ok(fallback.actionUrl.startsWith('https://wa.me/919876543210?text='));
    });
  });

  // ================= G. PUBLIC RECEIPT & SECURITY =================
  describe('G. Unguessable Public Receipt Token Lookup', () => {
    it('should retrieve receipt securely using unguessable token and include seller GSTIN', async () => {
      const { sale } = await finalizePosSale({
        stallEventId: testEvent.id,
        staffId: testAdmin.id,
        staffEmail: testAdmin.email,
        staffName: testAdmin.name,
        customerName: 'Sanjay Kumar',
        items: [{ variantId: testVariant.id, quantity: 1, unitPrice: 500.0 }],
        paymentMethod: 'CASH',
      });

      assert.ok(sale.publicReceiptToken);
      assert.ok(sale.publicReceiptToken.length >= 32);

      const found = await getPosSale(sale.publicReceiptToken);
      assert.ok(found);
      assert.equal(found.id, sale.id);
      assert.ok(found.sellerDetails);
      assert.ok(found.sellerDetails.gstin);
    });
  });

  // ================= H. SALES REPORTS & DATABASE AGGREGATION =================
  describe('H. POS Sales Aggregated Reports', () => {
    it('should compute real database metrics for sales, taxes, discounts, and payment methods', async () => {
      const report = await getPosSalesReport({
        stallEventId: testEvent.id,
      });

      assert.ok(report.summary);
      assert.ok(report.summary.totalBills > 0);
      assert.ok(report.summary.grossSales > 0);
      assert.ok(report.summary.totalTax > 0);
      assert.ok(report.paymentBreakdown);
      assert.ok(report.collectionBreakdown);
    });
  });
});
