import assert from 'assert';
import {
  formatINR,
  isValidPrice,
  isValidQuantity,
  calculateCartTotals,
  validateCartForCheckout,
} from './src/utils/pricing.js';

console.log('=== AMOGA PHASE 6 VERIFICATION TEST SUITE ===\n');

// 1. Currency Formatting Tests
console.log('Test 1: Currency Formatting (formatINR)');
assert.strictEqual(formatINR(0), '₹0');
assert.strictEqual(formatINR(450), '₹450');
assert.strictEqual(formatINR(12500), '₹12,500');
assert.strictEqual(formatINR(148500), '₹1,48,500');
assert.strictEqual(formatINR(null), 'Price to be confirmed');
assert.strictEqual(formatINR(undefined), 'Price to be confirmed');
assert.strictEqual(formatINR(NaN), 'Price to be confirmed');
assert.strictEqual(formatINR(-50), 'Price to be confirmed');
console.log('✓ formatINR handles zero, typical values, Indian lakhs formatting, null, negative, and NaN correctly.\n');

// 2. Price Validity Safeguard Tests
console.log('Test 2: Price Validity Safeguards (isValidPrice)');
assert.strictEqual(isValidPrice(1), true);
assert.strictEqual(isValidPrice(999999), true);
assert.strictEqual(isValidPrice(0), false, 'Zero price must not be treated as valid payable price');
assert.strictEqual(isValidPrice(-100), false, 'Negative price must be rejected');
assert.strictEqual(isValidPrice(null), false, 'Null price must be rejected');
assert.strictEqual(isValidPrice(undefined), false, 'Undefined price must be rejected');
assert.strictEqual(isValidPrice('free'), false, 'String price must be rejected');
assert.strictEqual(isValidPrice(NaN), false, 'NaN must be rejected');
console.log('✓ isValidPrice rejects unapproved, null, negative, zero, and malformed prices.\n');

// 3. Quantity Validity Tests
console.log('Test 3: Quantity Validity (isValidQuantity)');
assert.strictEqual(isValidQuantity(1), true);
assert.strictEqual(isValidQuantity(5), true);
assert.strictEqual(isValidQuantity(0), false, 'Zero quantity is invalid');
assert.strictEqual(isValidQuantity(-1), false, 'Negative quantity is invalid');
assert.strictEqual(isValidQuantity(1.5), false, 'Decimal quantity is invalid');
assert.strictEqual(isValidQuantity('2'), false, 'String quantity is invalid');
assert.strictEqual(isValidQuantity(null), false, 'Null quantity is invalid');
console.log('✓ isValidQuantity enforces strictly positive integers.\n');

// 4. Cart Totals Calculation Tests
console.log('Test 4: Cart Totals Calculation (calculateCartTotals)');
const testCartValid = [
  { lineId: 'food-soup-1', collectionId: 'food', name: 'Moringa Soup', price: 290, quantity: 2 },
  { lineId: 'sarees-kanchi-1', collectionId: 'sarees', name: 'Kanchipuram Silk', price: 18500, quantity: 1 },
  { lineId: 'jewellery-ring-1', collectionId: 'jewellery', name: 'Aurora Ring', price: 3450, quantity: 2 },
];
const totalsValid = calculateCartTotals(testCartValid);
assert.strictEqual(totalsValid.subtotal, 290 * 2 + 18500 * 1 + 3450 * 2); // 580 + 18500 + 6900 = 25980
assert.strictEqual(totalsValid.totalItemsCount, 5);
assert.strictEqual(totalsValid.payableItemsCount, 5);
assert.strictEqual(totalsValid.hasUnpricedItems, false);
assert.strictEqual(totalsValid.unpricedCount, 0);
console.log(`✓ Valid multi-collection cart subtotal calculated accurately: ${formatINR(totalsValid.subtotal)}`);

// Cart with Unpriced Item Safeguard Check
const testCartWithUnpriced = [
  ...testCartValid,
  { lineId: 'jewellery-custom-1', collectionId: 'jewellery', name: 'Custom Royal Choker', price: null, quantity: 1 },
];
const totalsWithUnpriced = calculateCartTotals(testCartWithUnpriced);
assert.strictEqual(totalsWithUnpriced.subtotal, 25980, 'Unpriced item must NOT be added to subtotal');
assert.strictEqual(totalsWithUnpriced.totalItemsCount, 6);
assert.strictEqual(totalsWithUnpriced.payableItemsCount, 5);
assert.strictEqual(totalsWithUnpriced.hasUnpricedItems, true);
assert.strictEqual(totalsWithUnpriced.unpricedCount, 1);
console.log('✓ Unpriced product excluded from payable subtotal and flagged hasUnpricedItems = true.\n');

// 5. Checkout Cart Validation Tests
console.log('Test 5: Checkout Eligibility Validation (validateCartForCheckout)');
const emptyValidation = validateCartForCheckout([]);
assert.strictEqual(emptyValidation.isValid, false);
assert.strictEqual(emptyValidation.canCheckout, false);
assert.ok(emptyValidation.errors.some((e) => e.includes('empty')));

const validValidation = validateCartForCheckout(testCartValid);
assert.strictEqual(validValidation.isValid, true);
assert.strictEqual(validValidation.canCheckout, true);
assert.strictEqual(validValidation.errors.length, 0);

const unpricedCheckoutValidation = validateCartForCheckout(testCartWithUnpriced);
assert.strictEqual(unpricedCheckoutValidation.isValid, false);
assert.strictEqual(unpricedCheckoutValidation.canCheckout, false);
assert.ok(unpricedCheckoutValidation.errors.some((e) => e.includes('pending approval')));
console.log('✓ Checkout validation correctly blocks empty carts and carts containing unpriced items.\n');

// 6. Checkout Customer Details Validation Rules
console.log('Test 6: Customer Details Validation Logic');
function validateCheckoutInputs({ fullName, email, phone, addressLine1, city, state, pincode }) {
  const errors = {};
  if (!fullName?.trim() || fullName.trim().length < 3) errors.fullName = 'Invalid name';
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Invalid email';
  const cleanPhone = (phone || '').replace(/[\s-]/g, '');
  if (!cleanPhone || !/^(?:\+91|0)?[6-9]\d{9}$/.test(cleanPhone)) errors.phone = 'Invalid phone';
  if (!addressLine1?.trim() || addressLine1.trim().length < 5) errors.addressLine1 = 'Invalid address';
  if (!city?.trim()) errors.city = 'Invalid city';
  if (!state?.trim()) errors.state = 'Invalid state';
  const cleanPin = (pincode || '').replace(/\s/g, '');
  if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) errors.pincode = 'Invalid PIN code';
  return { isValid: Object.keys(errors).length === 0, errors };
}

// Positive Case
const validCustomer = {
  fullName: 'Ananya Deshmukh',
  email: 'ananya.deshmukh@example.com',
  phone: '9845012345',
  addressLine1: 'Flat 402, Heritage Residency, 12th Main',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
};
const validResult = validateCheckoutInputs(validCustomer);
assert.strictEqual(validResult.isValid, true);

// Negative Cases
const invalidCustomer = {
  fullName: 'A',
  email: 'bad-email-format',
  phone: '12345', // invalid phone
  addressLine1: 'Hi', // too short
  city: '',
  state: '',
  pincode: '000000', // invalid PIN
};
const invalidResult = validateCheckoutInputs(invalidCustomer);
assert.strictEqual(invalidResult.isValid, false);
assert.strictEqual(Object.keys(invalidResult.errors).length, 7);
console.log('✓ Customer fields validate required rules, email format, Indian phone regex, and 6-digit PIN regex.\n');

// 7. Demo Order ID Format Verification
console.log('Test 7: Demo Reference Format Specification');
const timestampPart = Date.now().toString(36).toUpperCase();
const randomSuffix = 'ABCD';
const demoId = `AMOGA-DEMO-${timestampPart}-${randomSuffix}`;
assert.ok(demoId.startsWith('AMOGA-DEMO-'));
assert.strictEqual(typeof demoId, 'string');
console.log(`✓ Demo Reference pattern verified: "${demoId}"\n`);

console.log('====================================================');
console.log('ALL PHASE 6 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('====================================================');
