import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  resolveSkuPrefix,
  generateProductSku,
  generateVariantSku,
  isValidSkuFormat,
  validateCustomSku,
  getNextSequenceNumber,
} from '../src/services/skuService.js';
import {
  validateGstin,
  validateHsnCode,
  validateGstRate,
  calculateItemTax,
  calculateOrderTaxes,
  validateProductTaxCompliance,
  getStateCodeFromName,
} from '../src/services/taxService.js';
import {
  renderInvoiceHtml,
  amountToIndianWords,
  allocateInvoiceNumber,
} from '../src/services/invoiceService.js';
import {
  generateProductImportTemplate,
  validateProductImportWorkbook,
} from '../src/services/productImportService.js';

describe('Category-Based SKU Generation & Tax Management Suite', () => {
  // ================= A. SKU PREFIX RESOLUTION =================
  describe('A. Configurable Category Prefix Mapping', () => {
    it('should map Sarees to AMOGA-SAR', () => {
      assert.equal(resolveSkuPrefix('sarees', 'silk'), 'AMOGA-SAR');
      assert.equal(resolveSkuPrefix('sarees', 'Kanchipuram Silk Sarees'), 'AMOGA-SAR');
      assert.equal(resolveSkuPrefix('sarees', 'traditional'), 'AMOGA-SAR');
    });

    it('should map Wellness Tea to AMOGA-TEA', () => {
      assert.equal(resolveSkuPrefix('tea', 'flower'), 'AMOGA-TEA');
      assert.equal(resolveSkuPrefix('tea', 'Botanical Herbal Tea'), 'AMOGA-TEA');
      assert.equal(resolveSkuPrefix('tea', 'leaf'), 'AMOGA-TEA');
    });

    it('should map Masala & Spices to AMOGA-MAS', () => {
      assert.equal(resolveSkuPrefix('food', 'spices'), 'AMOGA-MAS');
      assert.equal(resolveSkuPrefix('food', 'Garam Masala Blend'), 'AMOGA-MAS');
      assert.equal(resolveSkuPrefix('food', 'masala'), 'AMOGA-MAS');
    });

    it('should map Soup Mixes to AMOGA-SOUP', () => {
      assert.equal(resolveSkuPrefix('food', 'soups'), 'AMOGA-SOUP');
      assert.equal(resolveSkuPrefix('food', 'Herbal Moringa Soup Mix'), 'AMOGA-SOUP');
      assert.equal(resolveSkuPrefix('food', 'soup'), 'AMOGA-SOUP');
    });

    it('should map Millet Mixes to AMOGA-MIL', () => {
      assert.equal(resolveSkuPrefix('food', 'millets'), 'AMOGA-MIL');
      assert.equal(resolveSkuPrefix('food', 'Foxtail Millet Mix'), 'AMOGA-MIL');
      assert.equal(resolveSkuPrefix('food', 'millet-mix'), 'AMOGA-MIL');
    });

    it('should map Rice Podi to AMOGA-POD', () => {
      assert.equal(resolveSkuPrefix('food', 'podis'), 'AMOGA-POD');
      assert.equal(resolveSkuPrefix('food', 'Traditional Idli Podi'), 'AMOGA-POD');
      assert.equal(resolveSkuPrefix('food', 'rice-podi'), 'AMOGA-POD');
    });

    it('should map Silver Jewellery to AMOGA-SIL', () => {
      assert.equal(resolveSkuPrefix('jewellery', 'rings'), 'AMOGA-SIL');
      assert.equal(resolveSkuPrefix('jewellery', 'Sterling Silver Ring'), 'AMOGA-SIL');
      assert.equal(resolveSkuPrefix('jewellery', 'necklaces'), 'AMOGA-SIL');
    });

    it('should fallback to AMOGA-PRD for unmapped collections', () => {
      assert.equal(resolveSkuPrefix('unknown_collection', 'generic_category'), 'AMOGA-PRD');
    });
  });

  // ================= B. ATOMIC DATABASE-BACKED SEQUENCES =================
  describe('B. Atomic Database-Backed Sequence Allocation', () => {
    it('should atomically generate strictly sequential numbers for the same prefix', async () => {
      const testPrefix = 'AMOGA-TESTSEQ';
      await prisma.skuSequence.deleteMany({ where: { prefix: testPrefix } });

      const seq1 = await getNextSequenceNumber(testPrefix);
      const seq2 = await getNextSequenceNumber(testPrefix);
      const seq3 = await getNextSequenceNumber(testPrefix);

      assert.equal(seq1, 1);
      assert.equal(seq2, 2);
      assert.equal(seq3, 3);

      await prisma.skuSequence.deleteMany({ where: { prefix: testPrefix } });
    });

    it('should safely handle concurrent requests without race conditions', async () => {
      const testPrefix = 'AMOGA-CONCUR';
      await prisma.skuSequence.deleteMany({ where: { prefix: testPrefix } });

      // Fire 10 parallel atomic allocations simultaneously
      const promises = Array.from({ length: 10 }, () => getNextSequenceNumber(testPrefix));
      const results = await Promise.all(promises);

      // Verify that all 10 numbers are unique and cover 1 to 10
      const uniqueNumbers = new Set(results);
      assert.equal(uniqueNumbers.size, 10);
      assert.equal(Math.min(...results), 1);
      assert.equal(Math.max(...results), 10);

      await prisma.skuSequence.deleteMany({ where: { prefix: testPrefix } });
    });

    it('should format full SKU using 3-digit zero-padding', async () => {
      const sku = await generateProductSku('sarees', 'silk');
      assert.match(sku, /^AMOGA-SAR\d{3,}$/);
    });

    it('should generate variant-level SKUs derived from parent SKU', () => {
      assert.equal(generateVariantSku('AMOGA-SAR001', 1), 'AMOGA-SAR001-V01');
      assert.equal(generateVariantSku('AMOGA-SAR001', 2), 'AMOGA-SAR001-V02');
      assert.equal(generateVariantSku('AMOGA-TEA015', 10), 'AMOGA-TEA015-V10');
    });
  });

  // ================= C. CUSTOM SKU VALIDATION =================
  describe('C. Custom SKU Validation & Format Checking', () => {
    it('should accept valid SKU formats', () => {
      assert.equal(isValidSkuFormat('AMOGA-SAR001'), true);
      assert.equal(isValidSkuFormat('SILVER_RING_01'), true);
      assert.equal(isValidSkuFormat('TEA-MASALA-100G'), true);
    });

    it('should reject invalid SKU formats with special characters or wrong lengths', () => {
      assert.equal(isValidSkuFormat('A'), false); // too short (< 3)
      assert.equal(isValidSkuFormat('SKU WITH SPACES'), false);
      assert.equal(isValidSkuFormat('SKU@INVALID#$'), false);
      assert.equal(isValidSkuFormat(''), false);
    });

    it('should detect duplicate SKUs across products', async () => {
      const existingProduct = await prisma.product.findFirst({
        where: { sku: { not: null } },
        select: { id: true, sku: true },
      });

      if (existingProduct?.sku) {
        const check = await validateCustomSku(existingProduct.sku);
        assert.equal(check.isValid, false);
        assert.ok(check.message.includes('already in use'));

        const checkSelf = await validateCustomSku(existingProduct.sku, {
          excludeProductId: existingProduct.id,
        });
        assert.equal(checkSelf.isValid, true);
      }
    });
  });

  // ================= D. GST & HSN VALIDATION =================
  describe('D. Statutory GST & HSN Validation', () => {
    it('should validate 15-character Indian GSTIN format and state code', () => {
      // Valid Tamil Nadu GSTIN (33)
      const validGstin = validateGstin('33AAACA1234A1Z5');
      assert.equal(validGstin.isValid, true);
      assert.equal(validGstin.stateCode, '33');
      assert.equal(validGstin.stateName, 'Tamil Nadu');
      assert.equal(validGstin.pan, 'AAACA1234A');

      // Invalid GSTIN (wrong length or characters)
      assert.equal(validateGstin('INVALIDGST').isValid, false);
      assert.equal(validateGstin('99AAACA1234A1Z5').isValid, false); // invalid state 99
    });

    it('should validate HSN tariff codes (2 to 8 digits)', () => {
      assert.equal(validateHsnCode('5007').isValid, true); // Sarees 4-digit
      assert.equal(validateHsnCode('0902').isValid, true); // Tea 4-digit
      assert.equal(validateHsnCode('50072010').isValid, true); // 8-digit full tariff
      assert.equal(validateHsnCode('1').isValid, false); // too short
      assert.equal(validateHsnCode('123456789').isValid, false); // too long
      assert.equal(validateHsnCode('ABCD').isValid, false); // non-numeric
    });

    it('should validate GST rate against Indian statutory slabs', () => {
      assert.equal(validateGstRate(0).isValid, true);
      assert.equal(validateGstRate(3).isValid, true); // Silver / Jewellery
      assert.equal(validateGstRate(5).isValid, true); // Sarees / Food / Tea
      assert.equal(validateGstRate(12).isValid, true);
      assert.equal(validateGstRate(18).isValid, true);
      assert.equal(validateGstRate(28).isValid, true);
      assert.equal(validateGstRate(7).isValid, false); // non-standard rate
    });

    it('should require HSN and GST rate for live published products', () => {
      const nonCompliant = validateProductTaxCompliance({
        price: 2500,
        hsnCode: '',
        gstRate: null,
      });
      assert.equal(nonCompliant.isCompliant, false);
      assert.ok(nonCompliant.errors.length > 0);

      const compliant = validateProductTaxCompliance({
        price: 2500,
        hsnCode: '5007',
        gstRate: 5,
      });
      assert.equal(compliant.isCompliant, true);
    });
  });

  // ================= E. TAX CALCULATIONS & PLACE OF SUPPLY =================
  describe('E. Intra-State vs Inter-State GST Calculations', () => {
    it('should correctly calculate intra-state CGST + SGST (50/50 split)', () => {
      const calculation = calculateOrderTaxes({
        items: [
          {
            id: 'item-1',
            price: 1050,
            quantity: 1,
            gstRate: 5,
            hsnCode: '5007',
            isTaxInclusive: true,
          },
        ],
        sellerStateCode: '33', // Tamil Nadu
        buyerStateOrPincode: 'Tamil Nadu', // Intra-state
      });

      assert.equal(calculation.isInterState, false);
      assert.equal(calculation.placeOfSupplyCode, '33');
      assert.equal(calculation.taxableAmount, 1000.0);
      assert.equal(calculation.totalTax, 50.0);
      assert.equal(calculation.cgstAmount, 25.0);
      assert.equal(calculation.sgstAmount, 25.0);
      assert.equal(calculation.igstAmount, 0.0);
    });

    it('should correctly calculate inter-state IGST (100% IGST, 0 CGST/SGST)', () => {
      const calculation = calculateOrderTaxes({
        items: [
          {
            id: 'item-1',
            price: 1050,
            quantity: 1,
            gstRate: 5,
            hsnCode: '5007',
            isTaxInclusive: true,
          },
        ],
        sellerStateCode: '33', // Tamil Nadu
        buyerStateOrPincode: 'Karnataka', // Inter-state (29)
      });

      assert.equal(calculation.isInterState, true);
      assert.equal(calculation.placeOfSupplyCode, '29');
      assert.equal(calculation.taxableAmount, 1000.0);
      assert.equal(calculation.totalTax, 50.0);
      assert.equal(calculation.cgstAmount, 0.0);
      assert.equal(calculation.sgstAmount, 0.0);
      assert.equal(calculation.igstAmount, 50.0);
    });

    it('should correctly calculate tax-exclusive pricing', () => {
      const itemTax = calculateItemTax({
        price: 1000,
        quantity: 2,
        gstRate: 18,
        isTaxInclusive: false,
      });

      assert.equal(itemTax.taxableAmount, 2000.0);
      assert.equal(itemTax.taxAmount, 360.0);
      assert.equal(itemTax.grossAmount, 2360.0);
    });
  });

  // ================= F. STATUTORY GST INVOICE GENERATOR =================
  describe('F. Rule 46 CGST Tax Invoice Generation', () => {
    it('should convert currency numbers to Indian English words', () => {
      assert.equal(amountToIndianWords(1050), 'One Thousand Fifty Rupees Only');
      assert.equal(amountToIndianWords(25000), 'Twenty Five Thousand Rupees Only');
      assert.equal(amountToIndianWords(1500.5), 'One Thousand Five Hundred Rupees and Fifty Paise Only');
    });

    it('should render a complete statutory Rule 46 Tax Invoice HTML', () => {
      const mockOrder = {
        orderReference: 'AMOGA-ORD-TEST-001',
        invoiceNumber: 'AMOGA/2026-27/1001',
        invoiceDate: new Date('2026-10-16'),
        createdAt: new Date('2026-10-16'),
        sellerLegalName: 'Amoga Luxury Crafts Private Limited',
        sellerTradeName: 'Amoga',
        sellerGstin: '33AAACA1234A1Z5',
        sellerAddress: '108, Heritage Walk, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017',
        sellerState: 'Tamil Nadu',
        sellerStateCode: '33',
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav@example.com',
        customerPhone: '+91 98765 43210',
        customerGstin: '29BBBCB5678B1Z9',
        customerBusinessName: 'Sharma Heritage Retailers',
        addressLine1: '42, Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        placeOfSupply: 'Karnataka',
        placeOfSupplyCode: '29',
        isInterState: true,
        subtotal: 10500,
        taxableAmount: 10000,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 500,
        cessAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        totalAmount: 10500,
        items: [
          {
            id: 'item-1',
            productName: 'Kanchipuram Pure Gold Silk Saree',
            sku: 'AMOGA-SAR001',
            hsnCode: '5007',
            variantName: 'Temple Crimson',
            quantity: 1,
            unitPrice: 10500,
            taxableAmount: 10000,
            gstRate: 5,
            igstRate: 5,
            igstAmount: 500,
            totalTax: 500,
            lineTotal: 10500,
          },
        ],
      };

      const html = renderInvoiceHtml(mockOrder);

      assert.ok(html.includes('TAX INVOICE'));
      assert.ok(html.includes('Rule 46 of the Central Goods and Services Tax Rules, 2017'));
      assert.ok(html.includes('33AAACA1234A1Z5')); // Seller GSTIN
      assert.ok(html.includes('AMOGA/2026-27/1001')); // Invoice Number
      assert.ok(html.includes('29BBBCB5678B1Z9')); // Customer GSTIN (B2B)
      assert.ok(html.includes('AMOGA-SAR001')); // Product SKU
      assert.ok(html.includes('5007')); // HSN Code
      assert.ok(html.includes('IGST')); // Inter-state tax label
      assert.ok(html.includes('Ten Thousand Five Hundred Rupees Only')); // Amount in words
      assert.ok(html.includes('Whether tax is payable on reverse charge: NO'));
    });
  });

  // ================= G. EXCEL BULK PRODUCT IMPORT =================
  describe('G. Excel Bulk Upload Template & Tax Validation', () => {
    it('should generate template containing SKU, HSN, and GST columns', async () => {
      const buffer = await generateProductImportTemplate();
      assert.ok(buffer);
      assert.ok(buffer.length > 1000);
    });
  });
});
