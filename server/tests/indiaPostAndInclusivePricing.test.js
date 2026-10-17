import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  calculateShipping,
  validateIndianPincode,
  validateShippingBrackets,
  DEFAULT_SHIPPING_BRACKETS,
} from '../src/services/shippingService.js';
import {
  calculateItemTax,
  calculateOrderTaxes,
} from '../src/services/taxService.js';
import { resolveAndValidateCart } from '../src/services/checkoutService.js';

describe('AMOGA — GST-Inclusive Pricing and India Post Shipping Suite', () => {

  // =========================================================================
  // 1. GST-INCLUSIVE PRICING CALCULATIONS & REVERSE TAX FORMULA
  // =========================================================================
  describe('1. Statutory GST-Inclusive Pricing Deconstruction', () => {
    it('1.1 Deconstructs ₹1,000 inclusive price at 5% GST into Taxable ₹952.38 and GST ₹47.62', () => {
      const tax = calculateItemTax({ price: 1000, quantity: 1, gstRate: 5, isTaxInclusive: true });
      assert.equal(tax.grossAmount, 1000, 'Customer-facing gross price must be ₹1,000');
      assert.equal(tax.taxableAmount, 952.38, 'Taxable base must be ₹952.38 (1000 / 1.05)');
      assert.equal(tax.taxAmount, 47.62, 'Included GST must be ₹47.62 (1000 - 952.38)');
      assert.equal(Math.round((tax.taxableAmount + tax.taxAmount) * 100) / 100, 1000);
    });

    it('1.2 Splits intra-state tax 50/50 and assigns 100% to IGST for inter-state supply', () => {
      const items = [{ price: 2500, quantity: 1, gstRate: 12, isTaxInclusive: true }];

      // Intra-state (Tamil Nadu 33 -> 33)
      const intra = calculateOrderTaxes({
        items,
        sellerStateCode: '33',
        buyerStateOrPincode: '33',
      });
      assert.equal(intra.isInterState, false);
      assert.equal(intra.taxableAmount, 2232.14); // 2500 / 1.12
      assert.equal(intra.taxAmount, 267.86);
      assert.equal(intra.cgstAmount, 133.93);
      assert.equal(intra.sgstAmount, 133.93);
      assert.equal(intra.igstAmount, 0);

      // Inter-state (Tamil Nadu 33 -> Karnataka 29)
      const inter = calculateOrderTaxes({
        items,
        sellerStateCode: '33',
        buyerStateOrPincode: '29',
      });
      assert.equal(inter.isInterState, true);
      assert.equal(inter.taxableAmount, 2232.14);
      assert.equal(inter.taxAmount, 267.86);
      assert.equal(inter.cgstAmount, 0);
      assert.equal(inter.sgstAmount, 0);
      assert.equal(inter.igstAmount, 267.86);
    });

    it('1.3 Correctly handles multi-rate inclusive pricing: 0%, 3%, 5%, 12%, 18%, and 28%', () => {
      const testCases = [
        { price: 500, rate: 0, expectedTaxable: 500, expectedGst: 0 },
        { price: 10000, rate: 3, expectedTaxable: 9708.74, expectedGst: 291.26 }, // Jewellery
        { price: 1000, rate: 5, expectedTaxable: 952.38, expectedGst: 47.62 }, // Sarees / Tea
        { price: 1500, rate: 12, expectedTaxable: 1339.29, expectedGst: 160.71 },
        { price: 2000, rate: 18, expectedTaxable: 1694.92, expectedGst: 305.08 },
        { price: 5000, rate: 28, expectedTaxable: 3906.25, expectedGst: 1093.75 },
      ];

      for (const tc of testCases) {
        const tax = calculateItemTax({ price: tc.price, quantity: 1, gstRate: tc.rate, isTaxInclusive: true });
        assert.equal(tax.taxableAmount, tc.expectedTaxable, `Rate ${tc.rate}% taxable value mismatch`);
        assert.equal(tax.taxAmount, tc.expectedGst, `Rate ${tc.rate}% GST amount mismatch`);
        assert.equal(
          Math.round((tax.taxableAmount + tax.taxAmount) * 100) / 100,
          tc.price,
          `Rate ${tc.rate}% taxable + tax must exactly equal gross price`
        );
      }
    });

    it('1.4 Ensures calculateOrderTaxes does not add inclusive tax on top of order subtotal', () => {
      const items = [
        {
          price: 1000,
          quantity: 2,
          gstRate: 5,
          isTaxInclusive: true,
          hsnCode: '0902',
        },
        {
          price: 500,
          quantity: 1,
          gstRate: 12,
          isTaxInclusive: true,
          hsnCode: '2106',
        },
      ];

      const orderTax = calculateOrderTaxes({
        items,
        sellerStateCode: '33',
        buyerStateOrPincode: '33',
      });

      // Total gross product value = 2000 + 500 = 2500
      assert.ok(orderTax.taxAmount > 0, 'Must compute included tax');
      assert.ok(orderTax.taxableAmount < 2500, 'Taxable value must be less than gross inclusive price');
      // Sum of taxable value + included GST must equal gross items subtotal exactly
      assert.equal(
        Math.round((orderTax.taxableAmount + orderTax.taxAmount) * 100) / 100,
        2500,
        'Taxable value + included GST must equal 2500'
      );
    });
  });

  // =========================================================================
  // 2. INDIA POST CONFIGURABLE SHIPPING BRACKETS & PIECE RULES
  // =========================================================================
  describe('2. India Post Shipping Rules & Quantity Brackets', () => {
    const mockStoreSettings = {
      shippingCarrierName: 'India Post',
      shippingRulesEnabled: true,
      shippingThresholdOperator: 'GTE',
      freeShippingThreshold: 2500,
      shippingStandardRate: 100,
      shippingBrackets: DEFAULT_SHIPPING_BRACKETS, // 1-2: 100, 3: 150, 4: 200
      shippingBeyondMaxRule: 'PER_PIECE',
      shippingBeyondMaxBaseCharge: 200,
      shippingBeyondMaxChargePerPiece: 50,
    };

    it('2.1 Charges ₹100 for 1 piece and 2 pieces', () => {
      // 1 piece, subtotal ₹800 (< ₹2500)
      const res1 = calculateShipping({
        items: [{ quantity: 1, priceRupees: 800 }],
        subtotalRupees: 800,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res1.amount, 100);
      assert.equal(res1.isComplimentary, false);
      assert.equal(res1.ruleApplied, 'QUANTITY_BRACKET');
      assert.equal(res1.carrier, 'India Post');

      // 2 pieces, subtotal ₹1600 (< ₹2500)
      const res2 = calculateShipping({
        items: [{ quantity: 2, priceRupees: 800 }],
        subtotalRupees: 1600,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res2.amount, 100);
      assert.equal(res2.isComplimentary, false);
      assert.equal(res2.ruleApplied, 'QUANTITY_BRACKET');
    });

    it('2.2 Charges ₹150 for 3 pieces', () => {
      const res3 = calculateShipping({
        items: [{ quantity: 3, priceRupees: 700 }],
        subtotalRupees: 2100,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res3.amount, 150);
      assert.equal(res3.isComplimentary, false);
      assert.equal(res3.ruleApplied, 'QUANTITY_BRACKET');
    });

    it('2.3 Charges ₹200 for 4 pieces', () => {
      const res4 = calculateShipping({
        items: [
          { quantity: 2, priceRupees: 500 },
          { quantity: 2, priceRupees: 600 },
        ],
        subtotalRupees: 2200,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res4.amount, 200);
      assert.equal(res4.isComplimentary, false);
      assert.equal(res4.ruleApplied, 'QUANTITY_BRACKET');
    });

    it('2.4 Beyond 4 pieces (5+ pieces): applies confirmed formula (+₹50/piece beyond 4)', () => {
      // 5 pieces = 4 pcs base (₹200) + 1 extra pc (₹50) = ₹250
      const res5 = calculateShipping({
        items: [{ quantity: 5, priceRupees: 400 }],
        subtotalRupees: 2000,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res5.amount, 250, '5 pieces must be ₹250 (200 base + 50 extra)');
      assert.equal(res5.ruleApplied, 'BEYOND_MAX_INCREMENTAL');

      // 6 pieces = 4 pcs base (₹200) + 2 extra pcs (2 * 50 = ₹100) = ₹300
      const res6 = calculateShipping({
        items: [{ quantity: 6, priceRupees: 350 }],
        subtotalRupees: 2100,
        storeSettings: mockStoreSettings,
      });
      assert.equal(res6.amount, 300, '6 pieces must be ₹300 (200 base + 100 extra)');
    });

    it('2.5 Beyond 4 pieces: supports FLAT mode when configured by administrator', () => {
      const flatSettings = {
        ...mockStoreSettings,
        shippingBeyondMaxRule: 'FLAT',
        shippingBeyondMaxBaseCharge: 220,
      };

      const res = calculateShipping({
        items: [{ quantity: 8, priceRupees: 250 }],
        subtotalRupees: 2000,
        storeSettings: flatSettings,
      });
      assert.equal(res.amount, 220, 'FLAT mode must cap shipping fee at base charge');
      assert.equal(res.ruleApplied, 'BEYOND_MAX_FLAT');
    });
  });

  // =========================================================================
  // 3. FREE SHIPPING THRESHOLD & OPERATOR BEHAVIOR
  // =========================================================================
  describe('3. Free Shipping Threshold & Discount Interaction', () => {
    const baseSettings = {
      shippingCarrierName: 'India Post',
      shippingRulesEnabled: true,
      freeShippingThreshold: 2500,
      shippingBrackets: DEFAULT_SHIPPING_BRACKETS,
    };

    it('3.1 Default GTE operator: qualifies at exact ₹2,500 and above; charges at ₹2,499.99', () => {
      const gteSettings = { ...baseSettings, shippingThresholdOperator: 'GTE' };

      // Subtotal ₹2,499 -> shipping applies (1 piece = ₹100)
      const resBelow = calculateShipping({
        items: [{ quantity: 1, priceRupees: 2499 }],
        subtotalRupees: 2499,
        storeSettings: gteSettings,
      });
      assert.equal(resBelow.amount, 100);
      assert.equal(resBelow.isComplimentary, false);

      // Subtotal exactly ₹2,500 -> FREE shipping
      const resExact = calculateShipping({
        items: [{ quantity: 1, priceRupees: 2500 }],
        subtotalRupees: 2500,
        storeSettings: gteSettings,
      });
      assert.equal(resExact.amount, 0);
      assert.equal(resExact.isComplimentary, true);
      assert.equal(resExact.ruleApplied, 'FREE_SHIPPING_THRESHOLD');

      // Subtotal ₹3,200 -> FREE shipping
      const resAbove = calculateShipping({
        items: [{ quantity: 4, priceRupees: 800 }],
        subtotalRupees: 3200,
        storeSettings: gteSettings,
      });
      assert.equal(resAbove.amount, 0);
      assert.equal(resAbove.isComplimentary, true);
    });

    it('3.2 Configurable GT operator: charges at exact ₹2,500 and qualifies only strictly above ₹2,500', () => {
      const gtSettings = { ...baseSettings, shippingThresholdOperator: 'GT' };

      // Subtotal exactly ₹2,500 with GT operator -> shipping applies!
      const resExact = calculateShipping({
        items: [{ quantity: 2, priceRupees: 1250 }],
        subtotalRupees: 2500,
        storeSettings: gtSettings,
      });
      assert.equal(resExact.amount, 100, 'Under GT operator, exact 2500 must NOT get free shipping');
      assert.equal(resExact.isComplimentary, false);

      // Subtotal ₹2,501 with GT operator -> FREE shipping
      const resAbove = calculateShipping({
        items: [{ quantity: 2, priceRupees: 1250.5 }],
        subtotalRupees: 2501,
        storeSettings: gtSettings,
      });
      assert.equal(resAbove.amount, 0);
      assert.equal(resAbove.isComplimentary, true);
    });

    it('3.3 Discounts correctly reduce the net subtotal before evaluating threshold', () => {
      const settings = { ...baseSettings, shippingThresholdOperator: 'GTE' };

      // Gross subtotal ₹2,800 - coupon ₹500 = net ₹2,300 (< ₹2,500) -> shipping applies
      const resDiscountBelow = calculateShipping({
        items: [{ quantity: 2, priceRupees: 1400 }],
        subtotalRupees: 2800,
        discountRupees: 500,
        storeSettings: settings,
      });
      assert.equal(resDiscountBelow.netSubtotal, 2300);
      assert.equal(resDiscountBelow.amount, 100);
      assert.equal(resDiscountBelow.isComplimentary, false);

      // Gross subtotal ₹3,000 - coupon ₹400 = net ₹2,600 (>= ₹2,500) -> free shipping
      const resDiscountAbove = calculateShipping({
        items: [{ quantity: 3, priceRupees: 1000 }],
        subtotalRupees: 3000,
        discountRupees: 400,
        storeSettings: settings,
      });
      assert.equal(resDiscountAbove.netSubtotal, 2600);
      assert.equal(resDiscountAbove.amount, 0);
      assert.equal(resDiscountAbove.isComplimentary, true);
    });
  });

  // =========================================================================
  // 4. POSTAL SERVICEABILITY & PIN CODE VALIDATION
  // =========================================================================
  describe('4. Indian Postal Code Serviceability Validation', () => {
    it('4.1 Accepts valid 6-digit Indian PIN codes across regions', () => {
      const validPins = ['600017', '110001', '560001', '400001', '700001', ' 600028 '];
      for (const pin of validPins) {
        const check = validateIndianPincode(pin);
        assert.equal(check.isValid, true, `Pincode ${pin} should be valid`);
      }
    });

    it('4.2 Rejects invalid postal codes with informative error messages', () => {
      const invalidPins = ['012345', '12345', '6000019', 'ABC123', '', null, '99999'];
      for (const pin of invalidPins) {
        const check = validateIndianPincode(pin);
        assert.equal(check.isValid, false, `Pincode ${pin} should be invalid`);
      }
    });
  });

  // =========================================================================
  // 5. BRACKET VALIDATION & AUDIT SAFETY IN ADMIN SETTINGS
  // =========================================================================
  describe('5. Admin Shipping Bracket Configuration Safety', () => {
    it('5.1 Validates clean non-overlapping brackets', () => {
      const brackets = [
        { minQty: 1, maxQty: 2, charge: 100 },
        { minQty: 3, maxQty: 3, charge: 150 },
        { minQty: 4, maxQty: 4, charge: 200 },
      ];
      const check = validateShippingBrackets(brackets);
      assert.equal(check.isValid, true);
    });

    it('5.2 Rejects overlapping brackets', () => {
      const overlapping = [
        { minQty: 1, maxQty: 3, charge: 100 },
        { minQty: 3, maxQty: 5, charge: 150 }, // overlaps at 3
      ];
      const check = validateShippingBrackets(overlapping);
      assert.equal(check.isValid, false);
      assert.ok(check.message.includes('overlaps'));
    });

    it('5.3 Rejects negative charges or invalid quantities', () => {
      const negativeFee = [{ minQty: 1, maxQty: 2, charge: -50 }];
      assert.equal(validateShippingBrackets(negativeFee).isValid, false);

      const invalidRange = [{ minQty: 4, maxQty: 2, charge: 100 }];
      assert.equal(validateShippingBrackets(invalidRange).isValid, false);
    });
  });

  // =========================================================================
  // 6. CHECKOUT TAMPER RESISTANCE & AUTHORITATIVE RECALCULATION
  // =========================================================================
  describe('6. Authoritative Checkout Recalculation & Tamper Resistance', () => {
    let testProduct = null;

    before(async () => {
      // Find an active product with inventory
      testProduct = await prisma.product.findFirst({
        where: {
          isActive: true,
          price: { gt: 0 },
        },
        include: { variants: true },
      });
    });

    it('6.1 Backend recalculates totals from authoritative database values ignoring tampered client prices', async () => {
      if (!testProduct) return;

      const realPrice = Number(testProduct.price);

      // Attempt to tamper price: client claims price is ₹1
      const tamperedItems = [
        {
          productId: testProduct.id,
          variantId: testProduct.variants[0]?.id || null,
          quantity: 2,
          price: 1, // Tampered!
          shippingCharge: 0, // Tampered!
        },
      ];

      const resolved = await resolveAndValidateCart(tamperedItems);
      assert.equal(
        resolved.subtotal,
        realPrice * 2,
        'Server must use database product price, not tampered client price'
      );
      assert.equal(resolved.lines[0].unitPrice, realPrice);
    });

    it('6.2 Attaches immutable shipping and pricing snapshots', async () => {
      if (!testProduct) return;

      const items = [
        {
          productId: testProduct.id,
          variantId: testProduct.variants[0]?.id || null,
          quantity: 1,
        },
      ];

      const resolved = await resolveAndValidateCart(items, '600017');
      assert.ok(resolved.shipping, 'Resolved cart must include authoritative shipping details');
      assert.ok(resolved.shipping.snapshot, 'Shipping details must include immutable snapshot');
      assert.equal(resolved.shipping.carrier, 'India Post');
      assert.ok(resolved.taxBreakdown, 'Cart must include taxBreakdown');
    });
  });
});
