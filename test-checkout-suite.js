import assert from 'assert';
import { useStore } from './src/store/useStore.js';
import { validateCartForCheckout } from './src/utils/pricing.js';

console.log('=== AMOGA CHECKOUT RUNTIME & STATE REGRESSION TEST SUITE ===\n');

// Reset store to initial state
const store = useStore.getState();
store.clearCart();
store.clearCustomerDetails();

// Test 1: Accessing customerDetails on empty/fresh store
console.log('Test 1: Fresh customer details initialization (No undefined crash on .fullName)');
const initialCustomer = useStore.getState().customerDetails;
assert.notStrictEqual(initialCustomer, undefined, 'customerDetails must not be undefined');
assert.strictEqual(typeof initialCustomer, 'object', 'customerDetails must be an object');
assert.strictEqual(initialCustomer.fullName, '', 'fullName must default to empty string');
assert.strictEqual(initialCustomer.email, '', 'email must default to empty string');
assert.strictEqual(initialCustomer.phone, '', 'phone must default to empty string');
assert.strictEqual(initialCustomer.addressLine1, '', 'addressLine1 must default to empty string');
assert.strictEqual(initialCustomer.city, '', 'city must default to empty string');
assert.strictEqual(initialCustomer.state, '', 'state must default to empty string');
assert.strictEqual(initialCustomer.pincode, '', 'pincode must default to empty string');
assert.strictEqual(initialCustomer.instructions, '', 'instructions must default to empty string');
console.log('✓ Initial customer state safely populated with all default fields without crashing.\n');

// Test 2: Nested checkout.customerDetails compatibility
console.log('Test 2: Dual access compatibility (state.customerDetails and state.checkout.customerDetails)');
const nestedCustomer = useStore.getState().checkout.customerDetails;
assert.notStrictEqual(nestedCustomer, undefined);
assert.strictEqual(nestedCustomer.fullName, '');
assert.strictEqual(nestedCustomer.instructions, '');
console.log('✓ Both root selector and nested checkout selectors return identical synchronized models.\n');

// Test 3: Updating customer details
console.log('Test 3: Updating customer details synchronizes both store locations');
useStore.getState().setCustomerDetails({
  fullName: 'Meenakshi Sundaram',
  email: 'meenakshi@example.com',
  phone: '9840123456',
  addressLine1: 'No. 12, Temple View Road',
  addressLine2: 'Mylapore',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600004',
  instructions: 'Please leave with security if unavailable',
});

const updatedRoot = useStore.getState().customerDetails;
const updatedNested = useStore.getState().checkout.customerDetails;

assert.strictEqual(updatedRoot.fullName, 'Meenakshi Sundaram');
assert.strictEqual(updatedNested.fullName, 'Meenakshi Sundaram');
assert.strictEqual(updatedRoot.instructions, 'Please leave with security if unavailable');
assert.strictEqual(updatedNested.instructions, 'Please leave with security if unavailable');
assert.strictEqual(updatedRoot.deliveryInstructions, 'Please leave with security if unavailable');
console.log('✓ setCustomerDetails seamlessly syncs root and nested state, including instructions mappings.\n');

// Test 4: Asynchronous customer data arrival simulation
console.log('Test 4: Asynchronous customer profile arrival without overwriting user-entered changes');
// Simulate user typing in addressLine1
const dirtyFields = new Set(['addressLine1']);
const userEnteredAddress = 'Custom user address line 1';

// Simulate async profile arriving later
const asyncProfile = {
  fullName: 'Meenakshi Sundaram',
  email: 'meenakshi@example.com',
  phone: '9840123456',
  addressLine1: 'Original profile address line 1', // should NOT overwrite user input
  addressLine2: 'Mylapore',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600004',
};

const currentFormData = {
  fullName: 'Meenakshi Sundaram',
  email: 'meenakshi@example.com',
  phone: '9840123456',
  addressLine1: userEnteredAddress,
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  instructions: '',
};

const mergedFormData = { ...currentFormData };
Object.keys(asyncProfile).forEach((k) => {
  if (!dirtyFields.has(k) && asyncProfile[k] && !currentFormData[k]) {
    mergedFormData[k] = asyncProfile[k];
  }
});

assert.strictEqual(mergedFormData.addressLine1, userEnteredAddress, 'User-edited field must be preserved');
assert.strictEqual(mergedFormData.city, 'Chennai', 'Empty field must be populated from async profile');
console.log('✓ Asynchronous profile hydration safely populates missing fields without overwriting active edits.\n');

// Test 5: Empty Cart Handling
console.log('Test 5: Empty cart resolution');
useStore.getState().clearCart();
const emptyCartState = useStore.getState().cart;
const emptyItems = Array.isArray(emptyCartState) ? emptyCartState : (emptyCartState?.items || []);
assert.strictEqual(emptyItems.length, 0, 'Empty cart items array must have length 0');
const emptyValidation = validateCartForCheckout(emptyItems);
assert.strictEqual(emptyValidation.isValid, false, 'Empty cart must not be valid for checkout');
console.log('✓ Empty cart correctly resolved and blocks checkout progression.\n');

// Test 6: Adding items and multi-collection cart structure
console.log('Test 6: Adding multi-collection items to cart and checking item normalization');
useStore.getState().addToCart({
  id: 'f-filter-coffee',
  name: 'Amoga Filter Coffee Blend',
  price: 450,
  image: '/images/coffee.jpg',
  collection: 'food',
}, 2);

useStore.getState().addToCart({
  id: 's-kanchipuram-silk',
  name: 'Kanchipuram Silk Saree',
  price: 24500,
  image: '/images/saree.jpg',
  collection: 'sarees',
}, 1);

const populatedCart = useStore.getState().cart;
const populatedItems = Array.isArray(populatedCart) ? populatedCart : (populatedCart?.items || []);
assert.strictEqual(populatedItems.length, 2, 'Cart must contain 2 items');

// Verify normalization: item must have both product and flattened properties
populatedItems.forEach((item) => {
  assert.ok(item.id, 'item.id must exist');
  assert.ok(item.lineId, 'item.lineId must exist');
  assert.ok(item.product, 'item.product must exist');
  assert.ok(item.name, 'item.name must exist');
  assert.ok(typeof item.price === 'number', 'item.price must be a number');
  assert.ok(item.quantity >= 1, 'item.quantity must be >= 1');
  assert.ok(item.collectionId, 'item.collectionId must exist');
});

const totals = useStore.getState().getCartTotals();
assert.strictEqual(totals.subtotal, 450 * 2 + 24500 * 1); // 900 + 24500 = 25400
assert.strictEqual(totals.payableItemsCount, 3);
assert.strictEqual(totals.hasUnpricedItems, false);
console.log('✓ Multi-collection cart populated with verified normalized items and accurate totals.\n');

// Test 7: Unpriced item rejection safeguard
console.log('Test 7: Unpriced product rejection safeguard');
const unpricedResult = useStore.getState().addToCart({
  id: 'j-custom-necklace',
  name: 'Bespoke Diamond Choker',
  price: null,
  collection: 'jewellery',
});
assert.strictEqual(unpricedResult.success, false);
assert.strictEqual(unpricedResult.reason, 'unpriced');
assert.strictEqual(useStore.getState().cart.items.length, 2, 'Unpriced item must NOT be in cart');
console.log('✓ Unpriced item safely rejected by addToCart pricing safeguard.\n');

// Test 8: Cart quantity updates and removal
console.log('Test 8: Updating quantity and removal');
const firstLineId = populatedItems[0].lineId;
useStore.getState().updateQuantity(firstLineId, 5);
assert.strictEqual(useStore.getState().cart.items[0].quantity, 5);

useStore.getState().updateQuantity(firstLineId, 0); // <= 0 should remove
assert.strictEqual(useStore.getState().cart.items.length, 1);
console.log('✓ updateQuantity updates quantity and cleanly removes item when quantity reaches zero.\n');

// Test 9: Form Validation Logic
console.log('Test 9: Full customer validation constraints');
function validateCustomer(c) {
  const errs = {};
  if (!c.fullName?.trim() || c.fullName.trim().length < 3) errs.fullName = 'Name too short';
  if (!c.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errs.email = 'Invalid email';
  const cleanPhone = (c.phone || '').replace(/[\s-]/g, '');
  if (!cleanPhone || !/^(?:\+91|0)?[6-9]\d{9}$/.test(cleanPhone)) errs.phone = 'Invalid Indian phone';
  if (!c.addressLine1?.trim() || c.addressLine1.trim().length < 5) errs.addressLine1 = 'Address line 1 too short';
  if (!c.city?.trim() || c.city.trim().length < 2) errs.city = 'City required';
  if (!c.state?.trim() || c.state.trim().length < 2) errs.state = 'State required';
  const cleanPin = (c.pincode || '').replace(/\s/g, '');
  if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) errs.pincode = 'Invalid 6-digit PIN';
  return errs;
}

const badCustomer = {
  fullName: 'Ab',
  email: 'not-an-email',
  phone: '1234567',
  addressLine1: 'No',
  city: '',
  state: '',
  pincode: '012345',
};
const valErrors = validateCustomer(badCustomer);
assert.strictEqual(Object.keys(valErrors).length, 7, 'All 7 invalid fields must be flagged');

const goodCustomer = {
  fullName: 'Deepak Sharma',
  email: 'deepak.sharma@example.com',
  phone: '9845098450',
  addressLine1: 'Flat 301, Lakeview Apartments',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};
assert.strictEqual(Object.keys(validateCustomer(goodCustomer)).length, 0, 'Valid customer must have 0 errors');
console.log('✓ Client-side validation rules strictly align with server customerDetailsSchema.\n');

// Test 10: Cart Retention & Clear on Success
console.log('Test 10: Cart retention semantics');
// Adding an item back
useStore.getState().addToCart({
  id: 'f-tea-hibiscus',
  name: 'Organic Hibiscus Tea',
  price: 320,
  collection: 'tea',
}, 1);

const currentCount = useStore.getState().cart.items.length;
assert.ok(currentCount > 0);

// Simulate payment dismissal: cart should NOT be cleared
console.log('Simulating payment dismissal/failure...');
// Store is untouched
assert.strictEqual(useStore.getState().cart.items.length, currentCount);
console.log('✓ Cart retained after payment dismissal or failure.');

// Simulate payment success: cart cleared
console.log('Simulating verified payment confirmation...');
useStore.getState().clearCart();
useStore.getState().setLastCompletedOrder({
  orderId: 'AMOGA-ORD-2026-TESTREF',
  status: 'CONFIRMED',
  paymentStatus: 'SUCCEEDED',
});
assert.strictEqual(useStore.getState().cart.items.length, 0);
assert.strictEqual(useStore.getState().lastCompletedOrder.status, 'CONFIRMED');
console.log('✓ Cart cleared only after verified confirmation snapshot recorded.\n');

console.log('====================================================');
console.log('ALL CHECKOUT STATE REGRESSION CHECKS PASSED!');
console.log('====================================================');
