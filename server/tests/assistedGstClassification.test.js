import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  searchHsnCandidates,
  listRateMasterEntries,
  createRateMasterEntry,
  updateRateMasterEntry,
  confirmProductTaxClassification,
  getVerifiedRateForHsn,
} from '../src/services/hsnClassificationService.js';
import {
  calculateItemTax,
  calculateOrderTaxes,
  validateProductTaxCompliance,
} from '../src/services/taxService.js';
import {
  validateProductImportWorkbook,
  generateProductImportTemplate,
} from '../src/services/productImportService.js';
import ExcelJS from 'exceljs';

describe('Assisted GST/HSN Classification & Statutory Rate Master Test Suite', () => {
  let testProductId;
  let testVariantId;
  let createdRateMasterId;

  before(async () => {
    // Create a temporary draft product for testing confirmation workflow
    const prod = await prisma.product.create({
      data: {
        sourceId: `test-gst-${Date.now()}`,
        name: 'Heritage Traditional Kanchipuram Brocade Saree',
        slug: `test-kanchipuram-saree-${Date.now()}`,
        collectionId: 'sarees',
        category: 'silk',
        categoryName: 'Silk Sarees',
        description: 'Pure mulberry silk handloom saree with gold zari border.',
        price: 18500,
        inStock: true,
        stockQuantity: 10,
        isActive: false,
        image: '/images/saree-kanchipuram.jpg',
        taxTreatment: 'TAXABLE',
        taxVerificationStatus: 'PENDING',
      },
    });
    testProductId = prod.id;

    // Create a variant for variant-level tax testing
    const variant = await prisma.productVariant.create({
      data: {
        productId: prod.id,
        name: 'With Contrast Blouse',
        sku: `SAR-TEST-V01-${Date.now()}`,
        price: 19500,
        stockQuantity: 5,
        inStock: true,
      },
    });
    testVariantId = variant.id;
  });

  after(async () => {
    // Cleanup created test records
    try {
      if (testVariantId) {
        await prisma.productVariant.deleteMany({ where: { id: testVariantId } });
      }
      if (testProductId) {
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
      if (createdRateMasterId) {
        await prisma.gstRateMaster.deleteMany({ where: { id: createdRateMasterId } });
      }
    } catch (err) {
      console.warn('Test cleanup warning:', err.message);
    }
  });

  // ================= 1. REFERENCE DATASET INTEGRITY =================
  describe('1. Reference Dataset Coverage and Fidelity from HSN_SAC.pdf', () => {
    it('should have loaded all 21,935 structured records into the database', async () => {
      const count = await prisma.hsnReference.count();
      assert.equal(count, 21935, `Expected 21,935 rows from HSN_SAC.pdf, found ${count}`);
    });

    it('should preserve leading zeroes on codes (e.g. Chapter 01 to 09)', async () => {
      const tea0902 = await prisma.hsnReference.findFirst({
        where: { hsnCode: '0902' },
      });
      assert.ok(tea0902, 'HSN 0902 must exist');
      assert.equal(tea0902.hsnCode, '0902', 'Leading zero must not be stripped');
      assert.ok(tea0902.description.toLowerCase().includes('tea'));

      const liveAnimals01 = await prisma.hsnReference.findFirst({
        where: { hsnCode: '01' },
      });
      assert.ok(liveAnimals01, 'Chapter 01 must exist with leading zero intact');
      assert.equal(liveAnimals01.hsnCode, '01');
    });

    it('should retain parent and child classification types', async () => {
      const chapter = await prisma.hsnReference.findFirst({ where: { level: 'CHAPTER' } });
      const heading = await prisma.hsnReference.findFirst({ where: { level: 'HEADING' } });
      const subheading = await prisma.hsnReference.findFirst({ where: { level: 'SUBHEADING' } });
      const tariffItem = await prisma.hsnReference.findFirst({ where: { level: 'TARIFF_ITEM' } });

      assert.ok(chapter, 'CHAPTER codes must be preserved');
      assert.ok(heading, 'HEADING codes must be preserved');
      assert.ok(subheading, 'SUBHEADING codes must be preserved');
      assert.ok(tariffItem, 'TARIFF_ITEM codes must be preserved');
    });

    it('should contain sourceFileName metadata pointing to HSN_SAC.pdf with an importDate', async () => {
      const sample = await prisma.hsnReference.findFirst();
      assert.equal(sample.sourceFileName, 'HSN_SAC.pdf');
      assert.ok(sample.importDate instanceof Date);
    });
  });

  // ================= 2. AUTOCOMPLETE & CANDIDATE SEARCH =================
  describe('2. Assisted Autocomplete & Multi-Candidate Search', () => {
    it('should find HSN candidates for "Soup mix" with match reasons', async () => {
      const candidates = await searchHsnCandidates({ query: 'Soup mix', limit: 20 });
      assert.ok(candidates.length > 0, 'Should return candidates for soup mix');
      const found2104 = candidates.find((c) => c.hsnCode.startsWith('2104'));
      assert.ok(found2104, 'Must suggest HSN 2104 (Soups and broths)');
      assert.ok(found2104.confidenceScore > 0.4);
      assert.ok(found2104.matchReason.length > 0);
    });

    it('should find HSN candidates for "Millet mix"', async () => {
      const candidates = await searchHsnCandidates({ query: 'Millet mix', limit: 20 });
      assert.ok(candidates.length > 0, 'Should return candidates for millet');
      const hasMillet = candidates.some((c) => c.description.toLowerCase().includes('millet') || c.hsnCode.startsWith('1008'));
      assert.ok(hasMillet, 'Should find entries containing millet');
    });

    it('should find HSN candidates for "Rice podi" or "seasoning"', async () => {
      const candidates = await searchHsnCandidates({ query: 'rice condiment seasoning', limit: 20 });
      assert.ok(candidates.length > 0);
      assert.ok(candidates.some((c) => c.hsnCode.startsWith('2103') || c.hsnCode.startsWith('1006')));
    });

    it('should find HSN candidates for "Herbal tea" and "botanical tea"', async () => {
      const candidates = await searchHsnCandidates({ query: 'Herbal tea', limit: 20 });
      assert.ok(candidates.length > 0);
      const found0902 = candidates.find((c) => c.hsnCode.startsWith('0902'));
      assert.ok(found0902, 'Should suggest 0902 for tea');
    });

    it('should find HSN candidates for "Silk saree"', async () => {
      const candidates = await searchHsnCandidates({ query: 'Silk saree', limit: 20 });
      assert.ok(candidates.length > 0);
      const found5007 = candidates.find((c) => c.hsnCode.startsWith('5007'));
      assert.ok(found5007, 'Should match 5007 (Woven fabrics of silk)');
      assert.equal(found5007.hasVerifiedRate, true, '5007 should be linked to verified rate master (5%)');
      assert.equal(found5007.verifiedGstRate, 5);
    });

    it('should find HSN candidates for "Silver pendant" / "silver jewellery"', async () => {
      const candidates = await searchHsnCandidates({ query: 'silver jewellery', limit: 5 });
      assert.ok(candidates.length > 0);
      const found7113 = candidates.find((c) => c.hsnCode.startsWith('7113'));
      assert.ok(found7113, 'Should match 7113 (Articles of jewellery of precious metal)');
      assert.equal(found7113.hasVerifiedRate, true);
      assert.equal(found7113.verifiedGstRate, 3);
    });

    it('should allow direct searching by HSN code (e.g. 5007)', async () => {
      const candidates = await searchHsnCandidates({ query: '5007', limit: 5 });
      assert.ok(candidates.length > 0);
      assert.equal(candidates[0].hsnCode, '5007');
      assert.equal(candidates[0].matchReason, 'Exact HSN Code Match');
      assert.equal(candidates[0].confidenceScore, 1.0);
    });
  });

  // ================= 3. PREVENT UNSAFE AUTOMATIC ASSIGNMENT =================
  describe('3. Unsafe Assignment Prevention & Authorization Guard', () => {
    it('should reject classification confirmation from unauthorized roles', async () => {
      await assert.rejects(
        async () => {
          await confirmProductTaxClassification({
            productId: testProductId,
            hsnCode: '5007',
            gstRate: 5,
            adminEmail: 'staff@amoga.com',
            adminRole: 'ORDER_MANAGER', // Unauthorized for tax/rate changes
          });
        },
        /Unauthorized/i
      );
    });

    it('should allow authorized user to confirm classification and record audit metadata', async () => {
      const confirmed = await confirmProductTaxClassification({
        productId: testProductId,
        hsnCode: '5007',
        gstRate: 5,
        taxTreatment: 'TAXABLE',
        isTaxInclusive: true,
        cessRate: 0,
        taxNotes: 'Verified against CBIC Rate Schedule (Handloom Silk Sarees - 5%)',
        adminEmail: 'lead-catalogue@amoga.com',
        adminRole: 'CATALOGUE_MANAGER',
      });

      assert.equal(confirmed.product.hsnCode, '5007');
      assert.equal(Number(confirmed.product.gstRate), 5);
      assert.equal(confirmed.product.taxVerificationStatus, 'VERIFIED');
      assert.equal(confirmed.product.taxConfirmedBy, 'lead-catalogue@amoga.com');
      assert.ok(confirmed.product.taxConfirmedAt instanceof Date);

      // Verify persistence in DB
      const dbProd = await prisma.product.findUnique({ where: { id: testProductId } });
      assert.equal(dbProd.hsnCode, '5007');
      assert.equal(dbProd.taxVerificationStatus, 'VERIFIED');
      assert.equal(dbProd.taxConfirmedBy, 'lead-catalogue@amoga.com');
    });

    it('should support variant-level tax classification override', async () => {
      const confirmedVariant = await confirmProductTaxClassification({
        productId: testProductId,
        variantId: testVariantId,
        hsnCode: '500720',
        gstRate: 5,
        taxTreatment: 'TAXABLE',
        taxNotes: 'Specific woven silk variant override',
        adminEmail: 'super-admin@amoga.com',
        adminRole: 'SUPER_ADMIN',
      });

      assert.equal(confirmedVariant.variant.hsnCode, '500720');
      assert.equal(confirmedVariant.variant.taxVerificationStatus, 'VERIFIED');

      const dbVar = await prisma.productVariant.findUnique({ where: { id: testVariantId } });
      assert.equal(dbVar.hsnCode, '500720');
      assert.equal(dbVar.taxVerificationStatus, 'VERIFIED');
    });
  });

  // ================= 4. VERIFIED GST RATE MASTER CRUD & CONFLICTS =================
  describe('4. Verified GST Rate Master Management & Overlap Conflict Prevention', () => {
    it('should create an approved rate master mapping with statutory source and period', async () => {
      const entry = await createRateMasterEntry({
        hsnCode: '998311',
        description: 'Information technology consulting and support services',
        gstRate: 18,
        taxTreatment: 'TAXABLE',
        sourceReference: 'Notification No. 11/2017-Central Tax (Rate)',
        effectiveFrom: new Date('2024-01-01').toISOString(),
        effectiveTo: new Date('2027-12-31').toISOString(),
        notes: 'Statutory standard rate for technical services',
        adminEmail: 'tax-admin@amoga.com',
      });

      assert.ok(entry.id);
      assert.equal(entry.hsnCode, '998311');
      assert.equal(Number(entry.gstRate), 18);
      assert.equal(entry.status, 'APPROVED');
      createdRateMasterId = entry.id;
    });

    it('should reject conflicting overlapping active mapping for the same HSN code', async () => {
      await assert.rejects(
        async () => {
          await createRateMasterEntry({
            hsnCode: '998311',
            description: 'Conflicting rate entry',
            gstRate: 12, // Conflicting rate
            effectiveFrom: new Date('2025-01-01').toISOString(),
            effectiveTo: new Date('2026-12-31').toISOString(),
            status: 'ACTIVE',
            adminEmail: 'tax-admin@amoga.com',
          });
        },
        /conflict/i
      );
    });

    it('should allow deactivating a rate mapping', async () => {
      const updated = await updateRateMasterEntry(
        createdRateMasterId,
        { status: 'INACTIVE' },
        'tax-admin@amoga.com'
      );
      assert.equal(updated.status, 'INACTIVE');

      // Now that it is INACTIVE, verified rate query should not pick it up
      const activeRate = await getVerifiedRateForHsn('998311');
      assert.equal(activeRate, null, 'Inactive mapping should not return active rate');
    });
  });

  // ================= 5. TAX CALCULATIONS & SNAPSHOT IMMUTABILITY =================
  describe('5. Place-of-Supply Tax Calculations & Immutable Snapshots', () => {
    it('should calculate CGST (2.5%) + SGST (2.5%) for Intra-State Sale (TN to TN)', () => {
      const orderTax = calculateOrderTaxes({
        items: [{ price: 1050, quantity: 1, gstRate: 5, cessRate: 0, isTaxInclusive: true }],
        sellerSettings: { sellerState: 'Tamil Nadu' },
        destination: { state: 'Tamil Nadu' },
      });

      assert.equal(orderTax.isInterState, false);
      assert.equal(orderTax.cgstAmount, 25);
      assert.equal(orderTax.sgstAmount, 25);
      assert.equal(orderTax.igstAmount, 0);
      assert.equal(orderTax.totalTax, 50);
      assert.equal(orderTax.taxableAmount, 1000);
    });

    it('should calculate IGST (5%) for Inter-State Sale (TN to Karnataka)', () => {
      const orderTax = calculateOrderTaxes({
        items: [{ price: 1050, quantity: 1, gstRate: 5, cessRate: 0, isTaxInclusive: true }],
        sellerSettings: { sellerState: 'Tamil Nadu' },
        destination: { state: 'Karnataka' },
      });

      assert.equal(orderTax.isInterState, true);
      assert.equal(orderTax.cgstAmount, 0);
      assert.equal(orderTax.sgstAmount, 0);
      assert.equal(orderTax.igstAmount, 50);
      assert.equal(orderTax.totalTax, 50);
      assert.equal(orderTax.taxableAmount, 1000);
    });

    it('should calculate mixed-rate cart taxes (5% Sarees + 3% Silver Jewellery + 12% Food Mixes)', () => {
      const items = [
        { price: 2100, quantity: 1, gstRate: 5, isTaxInclusive: true },
        { price: 10300, quantity: 1, gstRate: 3, isTaxInclusive: true },
        { price: 560, quantity: 1, gstRate: 12, isTaxInclusive: true },
      ];

      const orderTax = calculateOrderTaxes({
        items,
        sellerSettings: { sellerState: 'Tamil Nadu' },
        destination: { state: 'Maharashtra' },
      });

      assert.equal(orderTax.isInterState, true);
      assert.equal(orderTax.lineTaxes.length, 3);
      assert.ok(orderTax.totalTax > 0);
      assert.equal(orderTax.cgstAmount, 0);
      assert.equal(orderTax.sgstAmount, 0);
      assert.equal(orderTax.igstAmount, orderTax.totalTax);
    });

    it('should validate tax compliance gating on products', () => {
      const invalidProduct = {
        name: 'Unverified Silk',
        isActive: true,
        hsnCode: '',
        gstRate: 5,
      };
      const res = validateProductTaxCompliance(invalidProduct);
      assert.equal(res.isCompliant, false);
      assert.ok(res.errors.some((e) => e.includes('HSN code')));
    });
  });

  // ================= 6. BULK EXCEL IMPORT TAX VALIDATION =================
  describe('6. Bulk Excel Importer GST/HSN Columns & Error Handling', () => {
    it('should flag error if row claims VERIFIED status without valid HSN/GST', async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Products');
      ws.columns = [
        { header: 'Collection Code *', key: 'collectionId' },
        { header: 'Product Code *', key: 'sourceId' },
        { header: 'Product Name *', key: 'name' },
        { header: 'Category Code *', key: 'category' },
        { header: 'Description *', key: 'description' },
        { header: 'Primary Image URL *', key: 'image' },
        { header: 'Selling Price (INR)', key: 'price' },
        { header: 'HSN Code', key: 'hsnCode' },
        { header: 'GST Rate (%)', key: 'gstRate' },
        { header: 'Tax Verification Status', key: 'taxVerificationStatus' },
      ];

      ws.addRow({
        collectionId: 'food',
        sourceId: 'ERR-TAX-01',
        name: 'Moringa Soup Powder',
        category: 'soups',
        description: 'Instant healthy moringa blend',
        image: '/images/test.jpg',
        price: 250,
        hsnCode: '',
        gstRate: 5,
        taxVerificationStatus: 'VERIFIED',
      });

      const buffer = await wb.xlsx.writeBuffer();
      const validation = await validateProductImportWorkbook(buffer);

      assert.equal(validation.valid, false, 'Workbook should fail validation');
      const err = validation.errors.find((e) => e.code === 'CANNOT_VERIFY_WITHOUT_TAX_DETAILS');
      assert.ok(err, 'Must generate specific error for taxVerificationStatus');
      assert.ok(err.message.includes('cannot be marked as VERIFIED'));
    });

    it('should succeed and extract tax attributes when row contains valid tax data', async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Products');
      ws.columns = [
        { header: 'Collection Code *', key: 'collectionId' },
        { header: 'Product Code *', key: 'sourceId' },
        { header: 'Product Name *', key: 'name' },
        { header: 'Category Code *', key: 'category' },
        { header: 'Description *', key: 'description' },
        { header: 'Primary Image URL *', key: 'image' },
        { header: 'Selling Price (INR)', key: 'price' },
        { header: 'HSN Code', key: 'hsnCode' },
        { header: 'GST Rate (%)', key: 'gstRate' },
        { header: 'Tax Treatment', key: 'taxTreatment' },
        { header: 'Tax Inclusive (Yes/No)', key: 'isTaxInclusive' },
        { header: 'Tax Verification Status', key: 'taxVerificationStatus' },
      ];

      ws.addRow({
        collectionId: 'sarees',
        sourceId: 'OK-TAX-01',
        name: 'Handloom Soft Silk Saree',
        category: 'silk',
        description: 'Graceful drape handloom saree',
        image: '/images/saree.jpg',
        price: 6500,
        hsnCode: '5007',
        gstRate: 5,
        taxTreatment: 'TAXABLE',
        isTaxInclusive: 'Yes',
        taxVerificationStatus: 'VERIFIED',
      });

      const buffer = await wb.xlsx.writeBuffer();
      const validation = await validateProductImportWorkbook(buffer);

      assert.equal(validation.valid, true, 'Valid tax columns should pass validation');
      const p = validation.parsedProducts[0];
      assert.equal(p.hsnCode, '5007');
      assert.equal(p.gstRate, 5);
      assert.equal(p.taxTreatment, 'TAXABLE');
      assert.equal(p.isTaxInclusive, true);
      assert.equal(p.taxVerificationStatus, 'VERIFIED');
    });
  });
});
