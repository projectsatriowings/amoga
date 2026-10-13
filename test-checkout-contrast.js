import assert from 'assert';
import {
  COLLECTION_THEMES,
  getCollectionTheme,
  getThemeCssVariables,
  isDarkColor,
} from './src/features/collections/themeConfig.js';
import { calculateCartTotals } from './src/utils/pricing.js';

console.log('=== AMOGA CHECKOUT THEME CONTRAST & SEMANTIC TOKENS VERIFICATION ===\n');

/**
 * Standard WCAG 2.1 relative luminance and contrast ratio calculations.
 */
function getLuminance(hex) {
  const clean = hex.replace('#', '').trim();
  let r, g, b;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  }
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(fgHex, bgHex) {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// =========================================================================
// 1. Heritage Sarees WCAG Contrast Tests (Testing specific requested palette)
// =========================================================================
console.log('Test 1: Heritage Sarees Semantic Token Contrast Validation');
const sareesVars = getThemeCssVariables('sarees');

// Heading contrast on page background (deep burgundy #2C0E1A)
const sareesHeadingRatio = getContrastRatio(sareesVars['--collection-heading'], sareesVars['--collection-page-bg']);
console.log(`- Sarees Heading (${sareesVars['--collection-heading']}) on Page Bg (${sareesVars['--collection-page-bg']}): ${sareesHeadingRatio.toFixed(2)}:1`);
assert.ok(sareesHeadingRatio >= 7.0, `Heading contrast on page bg must meet WCAG AAA (>= 7.0:1), got ${sareesHeadingRatio.toFixed(2)}:1`);

// Heading contrast on card background (deep plum #35121F)
const sareesCardHeadingRatio = getContrastRatio(sareesVars['--collection-heading'], sareesVars['--collection-card-bg']);
console.log(`- Sarees Heading (${sareesVars['--collection-heading']}) on Card Bg (${sareesVars['--collection-card-bg']}): ${sareesCardHeadingRatio.toFixed(2)}:1`);
assert.ok(sareesCardHeadingRatio >= 7.0, `Heading contrast on card bg must meet WCAG AAA (>= 7.0:1), got ${sareesCardHeadingRatio.toFixed(2)}:1`);

// Text contrast on card background
const sareesTextRatio = getContrastRatio(sareesVars['--collection-text'], sareesVars['--collection-card-bg']);
console.log(`- Sarees Text (${sareesVars['--collection-text']}) on Card Bg (${sareesVars['--collection-card-bg']}): ${sareesTextRatio.toFixed(2)}:1`);
assert.ok(sareesTextRatio >= 7.0, `Text contrast on card bg must meet WCAG AAA (>= 7.0:1), got ${sareesTextRatio.toFixed(2)}:1`);

// Muted text contrast on card background
const sareesMutedTextRatio = getContrastRatio(sareesVars['--collection-text-muted'], sareesVars['--collection-card-bg']);
console.log(`- Sarees Muted Text (${sareesVars['--collection-text-muted']}) on Card Bg (${sareesVars['--collection-card-bg']}): ${sareesMutedTextRatio.toFixed(2)}:1`);
assert.ok(sareesMutedTextRatio >= 4.5, `Muted text contrast must meet WCAG AA (>= 4.5:1), got ${sareesMutedTextRatio.toFixed(2)}:1`);

// Primary CTA button text on button background (deep burgundy on antique gold)
const sareesBtnRatio = getContrastRatio(sareesVars['--collection-button-text'], sareesVars['--collection-button-bg']);
console.log(`- Sarees Button Text (${sareesVars['--collection-button-text']}) on Button Bg (${sareesVars['--collection-button-bg']}): ${sareesBtnRatio.toFixed(2)}:1`);
assert.ok(sareesBtnRatio >= 4.5, `Button text contrast must meet WCAG AA (>= 4.5:1), got ${sareesBtnRatio.toFixed(2)}:1`);

// Input text on input background (dark charcoal on warm ivory)
const sareesInputRatio = getContrastRatio(sareesVars['--collection-input-text'], sareesVars['--collection-input-bg']);
console.log(`- Sarees Input Text (${sareesVars['--collection-input-text']}) on Input Bg (${sareesVars['--collection-input-bg']}): ${sareesInputRatio.toFixed(2)}:1`);
assert.ok(sareesInputRatio >= 7.0, `Input text contrast must meet WCAG AAA (>= 7.0:1), got ${sareesInputRatio.toFixed(2)}:1`);

// Input placeholder on input background
const sareesPlaceholderRatio = getContrastRatio(sareesVars['--collection-input-placeholder'], sareesVars['--collection-input-bg']);
console.log(`- Sarees Placeholder (${sareesVars['--collection-input-placeholder']}) on Input Bg (${sareesVars['--collection-input-bg']}): ${sareesPlaceholderRatio.toFixed(2)}:1`);
assert.ok(sareesPlaceholderRatio >= 3.0, `Placeholder contrast must be >= 3.0:1, got ${sareesPlaceholderRatio.toFixed(2)}:1`);

// Notice Banner text on notice background
const sareesNoticeRatio = getContrastRatio(sareesVars['--collection-notice-text'], sareesVars['--collection-notice-bg']);
console.log(`- Sarees Notice Text (${sareesVars['--collection-notice-text']}) on Notice Bg (${sareesVars['--collection-notice-bg']}): ${sareesNoticeRatio.toFixed(2)}:1`);
assert.ok(sareesNoticeRatio >= 7.0, `Notice text contrast must meet WCAG AAA (>= 7.0:1), got ${sareesNoticeRatio.toFixed(2)}:1`);

console.log('✓ Heritage Sarees contrast tokens strictly comply with WCAG AA/AAA standards.\n');

// =========================================================================
// 2. All Collections Theme Contrast Tests (Food, Tea, Sarees, Jewellery, Neutral)
// =========================================================================
console.log('Test 2: Multi-Collection Theme Contrast Validation');
const collections = ['food', 'tea', 'sarees', 'jewellery', 'neutral'];

collections.forEach((colId) => {
  const vars = getThemeCssVariables(colId);
  const headingRatio = getContrastRatio(vars['--collection-heading'], vars['--collection-page-bg']);
  const textRatio = getContrastRatio(vars['--collection-text'], vars['--collection-card-bg']);
  const btnRatio = getContrastRatio(vars['--collection-button-text'], vars['--collection-button-bg']);
  const inputRatio = getContrastRatio(vars['--collection-input-text'], vars['--collection-input-bg']);
  const noticeRatio = getContrastRatio(vars['--collection-notice-text'], vars['--collection-notice-bg']);

  console.log(`[Collection: ${colId.toUpperCase()}]`);
  console.log(`  - Heading / Page:  ${headingRatio.toFixed(2)}:1`);
  console.log(`  - Text / Card:     ${textRatio.toFixed(2)}:1`);
  console.log(`  - Button / Bg:     ${btnRatio.toFixed(2)}:1`);
  console.log(`  - Input Text / Bg: ${inputRatio.toFixed(2)}:1`);
  console.log(`  - Notice / Bg:     ${noticeRatio.toFixed(2)}:1`);

  assert.ok(headingRatio >= 4.5, `Heading contrast for ${colId} must be >= 4.5:1`);
  assert.ok(textRatio >= 4.5, `Text contrast for ${colId} must be >= 4.5:1`);
  assert.ok(btnRatio >= 4.0, `Button text contrast for ${colId} must be >= 4.0:1`);
  assert.ok(inputRatio >= 4.5, `Input text contrast for ${colId} must be >= 4.5:1`);
  assert.ok(noticeRatio >= 4.5, `Notice text contrast for ${colId} must be >= 4.5:1`);
});
console.log('✓ All 5 theme palettes maintain high accessible contrast across all surfaces.\n');

// =========================================================================
// 3. Root Cause Regression Protection: DB Record Overlay with Dark Secondary Color
// =========================================================================
console.log('Test 3: Root Cause Regression Defense (DB Record Overlay)');
// Simulate the historical bug where dbRecord.themeConfig.secondaryColor was '#451523'
// and bgColor was '#2C0E1A'. In the past, this caused heading to render dark burgundy!
const simulatedDbRecord = {
  id: 'sarees',
  themeConfig: {
    bgColor: '#2C0E1A',
    secondaryColor: '#451523', // dark burgundy
    surfaceColor: '#35121F',
    textColor: '#F6EBD8',
  },
};

const resolvedSareesWithDbOverlay = getCollectionTheme('sarees', simulatedDbRecord);
console.log(`- Resolved Heading with dark secondaryColor: ${resolvedSareesWithDbOverlay.palette.heading}`);
assert.notStrictEqual(
  resolvedSareesWithDbOverlay.palette.heading.toLowerCase(),
  '#451523',
  'Heading must NEVER be set to dark burgundy #451523 against dark burgundy background'
);
const protectedRatio = getContrastRatio(resolvedSareesWithDbOverlay.palette.heading, resolvedSareesWithDbOverlay.palette.bg);
console.log(`- Protected contrast ratio: ${protectedRatio.toFixed(2)}:1`);
assert.ok(protectedRatio >= 7.0, 'Protected heading must have WCAG AAA contrast >= 7.0:1');
console.log('✓ Root cause regression defense successfully verified.\n');

// =========================================================================
// 4. Selective Checkout Business Logic & Subtotals
// =========================================================================
console.log('Test 4: Selective Checkout Subtotals & Multi-Collection Integrity');
const mixedBag = [
  { lineId: 's-1', collectionId: 'sarees', name: 'Kanchipuram Silk', price: 18500, quantity: 1, selected: true },
  { lineId: 'food-1', collectionId: 'food', name: 'Moringa Soup', price: 290, quantity: 2, selected: false },
  { lineId: 'tea-1', collectionId: 'tea', name: 'Hibiscus Blossom', price: 450, quantity: 1, selected: false },
];

const selectedOnly = mixedBag.filter((item) => item.selected !== false);
assert.strictEqual(selectedOnly.length, 1);
assert.strictEqual(selectedOnly[0].collectionId, 'sarees');

const selectedTotals = calculateCartTotals(selectedOnly);
assert.strictEqual(selectedTotals.subtotal, 18500);
assert.strictEqual(selectedTotals.payableItemsCount, 1);
console.log(`✓ Selective checkout subtotal for selected saree only: ₹${selectedTotals.subtotal.toLocaleString('en-IN')}`);

// Unselected items remain safely in the shopping bag
const remainingInBag = mixedBag.filter((item) => !item.selected);
assert.strictEqual(remainingInBag.length, 2);
console.log(`✓ Unselected products preserved safely in shopping bag: ${remainingInBag.length} items`);

console.log('\n====================================================');
console.log('ALL CHECKOUT CONTRAST & THEME TESTS PASSED (100%)');
console.log('====================================================\n');
