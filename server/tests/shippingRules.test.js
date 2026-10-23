import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateShipping } from '../src/services/shippingService.js';
import { estimateIndiaPostShipping } from '../../src/utils/pricing.js';

describe('Authoritative Shipping Rules & Wellness Tea Qualification', () => {
  const storeSettings = {
    shippingCarrierName: 'India Post',
    shippingRulesEnabled: true,
    freeShippingThreshold: 2500,
    shippingThresholdOperator: 'GTE',
  };

  it('1. Standard collection ₹2,499 does NOT qualify for free shipping', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 1, priceRupees: 2499, collectionId: 'sarees' }],
      subtotalRupees: 2499,
      storeSettings,
    });
    assert.strictEqual(resServer.amount, 100);
    assert.strictEqual(resServer.isComplimentary, false);

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 1, price: 2499, collectionId: 'sarees' }],
      subtotal: 2499,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.amount, 100);
    assert.strictEqual(resClient.isFree, false);
  });

  it('2. Standard collection ₹2,500 qualifies for free shipping', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 1, priceRupees: 2500, collectionId: 'food' }],
      subtotalRupees: 2500,
      storeSettings,
    });
    assert.strictEqual(resServer.amount, 0);
    assert.strictEqual(resServer.isComplimentary, true);
    assert.strictEqual(resServer.ruleApplied, 'FREE_SHIPPING_THRESHOLD');

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 1, price: 2500, collectionId: 'food' }],
      subtotal: 2500,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.amount, 0);
    assert.strictEqual(resClient.isFree, true);
  });

  it('3. Wellness Tea: 4 packs costing ₹1,200 does NOT qualify', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 4, priceRupees: 300, collectionId: 'tea' }],
      subtotalRupees: 1200,
      storeSettings,
    });
    assert.strictEqual(resServer.isComplimentary, false);
    assert.strictEqual(resServer.amount, 200); // 4 pieces bracket = ₹200

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 4, price: 300, collectionId: 'tea' }],
      subtotal: 1200,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.isFree, false);
    assert.strictEqual(resClient.amount, 200);
  });

  it('4. Wellness Tea: 5 packs costing ₹950 does NOT qualify', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 5, priceRupees: 190, collectionId: 'tea' }],
      subtotalRupees: 950,
      storeSettings,
    });
    assert.strictEqual(resServer.isComplimentary, false);
    assert.strictEqual(resServer.amount, 250); // 5 pieces = 200 + 50 = ₹250

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 5, price: 190, collectionId: 'tea' }],
      subtotal: 950,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.isFree, false);
    assert.strictEqual(resClient.amount, 250);
  });

  it('5. Wellness Tea: 5 packs costing ₹1,000 qualifies for free shipping', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 5, priceRupees: 200, collectionId: 'tea' }],
      subtotalRupees: 1000,
      storeSettings,
    });
    assert.strictEqual(resServer.amount, 0);
    assert.strictEqual(resServer.isComplimentary, true);
    assert.strictEqual(resServer.ruleApplied, 'FREE_SHIPPING_THRESHOLD');

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 5, price: 200, collectionId: 'tea' }],
      subtotal: 1000,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.amount, 0);
    assert.strictEqual(resClient.isFree, true);
  });

  it('6. Wellness Tea: 6 packs costing ₹1,200 qualifies for free shipping', () => {
    const resServer = calculateShipping({
      items: [{ quantity: 6, priceRupees: 200, collectionId: 'tea' }],
      subtotalRupees: 1200,
      storeSettings,
    });
    assert.strictEqual(resServer.amount, 0);
    assert.strictEqual(resServer.isComplimentary, true);

    const resClient = estimateIndiaPostShipping({
      items: [{ quantity: 6, price: 200, collectionId: 'tea' }],
      subtotal: 1200,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.amount, 0);
    assert.strictEqual(resClient.isFree, true);
  });

  it('7. Mixed Cart: Tea (4 packs ₹800) + Jewellery (₹1,500) = ₹2,300 total (does not meet either)', () => {
    const items = [
      { quantity: 4, priceRupees: 200, collectionId: 'tea' },
      { quantity: 1, priceRupees: 1500, collectionId: 'jewellery' },
    ];
    const resServer = calculateShipping({
      items,
      subtotalRupees: 2300,
      storeSettings,
    });
    assert.strictEqual(resServer.isComplimentary, false);
    assert.strictEqual(resServer.amount, 250); // 5 items total = 200 + 50

    const resClient = estimateIndiaPostShipping({
      items,
      subtotal: 2300,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.isFree, false);
    assert.strictEqual(resClient.amount, 250);
  });

  it('8. Mixed Cart: Tea (5 packs ₹1,000) + Saree (₹1,200) qualifies because tea threshold is satisfied', () => {
    const items = [
      { quantity: 5, priceRupees: 200, collectionId: 'tea' },
      { quantity: 1, priceRupees: 1200, collectionId: 'sarees' },
    ];
    const resServer = calculateShipping({
      items,
      subtotalRupees: 2200,
      storeSettings,
    });
    assert.strictEqual(resServer.amount, 0);
    assert.strictEqual(resServer.isComplimentary, true);

    const resClient = estimateIndiaPostShipping({
      items,
      subtotal: 2200,
      freeShippingThreshold: 2500,
    });
    assert.strictEqual(resClient.amount, 0);
    assert.strictEqual(resClient.isFree, true);
  });
});
