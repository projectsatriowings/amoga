/**
 * AMOGA E-COMMERCE — GST & TAX COMPLIANCE SERVICE
 * Strictly complies with Indian Goods and Services Tax (GST) laws:
 * - Proper Intra-state (CGST + SGST) vs Inter-state (IGST) split based on Place of Supply
 * - Exact tax-inclusive / tax-exclusive reverse calculations
 * - Authoritative server-side rounding to prevent 1-paise drifts
 * - Full audit-ready Order Tax Snapshot persistence
 */

export const GST_RATES = [0, 3, 5, 12, 18, 28];

export const INDIAN_STATES_GST_MAP = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  'PUNJAB': '03',
  'CHANDIGARH': '04',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'DELHI': '07',
  'RAJASTHAN': '08',
  'UTTAR PRADESH': '09',
  'BIHAR': '10',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'WEST BENGAL': '19',
  'JHARKHAND': '20',
  'ODISHA': '21',
  'CHHATTISGARH': '22',
  'MADHYA PRADESH': '23',
  'GUJARAT': '24',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
  'MAHARASHTRA': '27',
  'ANDHRA PRADESH': '37',
  'KARNATAKA': '29',
  'GOA': '30',
  'LAKSHADWEEP': '31',
  'KERALA': '32',
  'TAMIL NADU': '33',
  'PUDUCHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'TELANGANA': '36',
  'LADAKH': '38',
  'OTHER TERRITORY': '97',
};

// Aliases for common state abbreviations
export const STATE_ALIASES = {
  TN: 'TAMIL NADU',
  KA: 'KARNATAKA',
  KL: 'KERALA',
  MH: 'MAHARASHTRA',
  DL: 'DELHI',
  TS: 'TELANGANA',
  TG: 'TELANGANA',
  AP: 'ANDHRA PRADESH',
  WB: 'WEST BENGAL',
  UP: 'UTTAR PRADESH',
  MP: 'MADHYA PRADESH',
  GJ: 'GUJARAT',
  RJ: 'RAJASTHAN',
  PB: 'PUNJAB',
  HR: 'HARYANA',
  GA: 'GOA',
  OR: 'ODISHA',
  OD: 'ODISHA',
  JH: 'JHARKHAND',
  BR: 'BIHAR',
  AS: 'ASSAM',
  CH: 'CHANDIGARH',
  UK: 'UTTARAKHAND',
  UA: 'UTTARAKHAND',
  HP: 'HIMACHAL PRADESH',
  JK: 'JAMMU AND KASHMIR',
  PY: 'PUDUCHERRY',
};

/**
 * Resolves the 2-digit GST state code from state name or code
 */
export function resolveGstStateCode(stateInput) {
  if (!stateInput || typeof stateInput !== 'string') return null;

  const clean = stateInput.trim().toUpperCase();

  // If already a 2-digit numeric code
  if (/^[0-9]{2}$/.test(clean)) {
    return clean;
  }

  // Check alias
  const aliasResolved = STATE_ALIASES[clean] || clean;

  // Direct lookup
  if (INDIAN_STATES_GST_MAP[aliasResolved]) {
    return INDIAN_STATES_GST_MAP[aliasResolved];
  }

  // Case-insensitive fuzzy search in keys
  for (const [stateName, code] of Object.entries(INDIAN_STATES_GST_MAP)) {
    if (stateName.includes(aliasResolved) || aliasResolved.includes(stateName)) {
      return code;
    }
  }

  return null;
}

export const getStateCodeFromName = resolveGstStateCode;

/**
 * Validates Indian GSTIN (15 alphanumeric characters)
 * Format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 entity code + 1 'Z' + 1 checksum
 */
export function validateGstin(gstin) {
  if (!gstin || typeof gstin !== 'string') {
    return { isValid: false, message: 'GSTIN is required' };
  }

  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinRegex.test(clean)) {
    return {
      isValid: false,
      message: 'Invalid GSTIN format. Expected 15 characters (e.g., 33AAACA1234A1Z5).',
    };
  }

  const stateCode = clean.substring(0, 2);
  const isValidState = Object.values(INDIAN_STATES_GST_MAP).includes(stateCode);

  if (!isValidState) {
    return {
      isValid: false,
      message: `Invalid state code "${stateCode}" in GSTIN.`,
    };
  }

  const pan = clean.substring(2, 12);
  const stateEntry = Object.entries(INDIAN_STATES_GST_MAP).find(([_, code]) => code === stateCode);
  const stateNameRaw = stateEntry ? stateEntry[0] : '';
  const stateName = stateNameRaw
    ? stateNameRaw
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : '';

  return { isValid: true, cleanGstin: clean, stateCode, stateName, pan };
}

/**
 * Validates HSN / SAC Code
 * Must be 2, 4, 6, or 8 digits
 */
export function validateHsnCode(hsn) {
  if (!hsn || typeof hsn !== 'string') {
    return { isValid: false, message: 'HSN code is required' };
  }

  const clean = hsn.trim();
  const hsnRegex = /^[0-9]{2,8}$/;

  if (!hsnRegex.test(clean)) {
    return {
      isValid: false,
      message: 'HSN code must be a 2 to 8 digit numeric code (e.g. 5007, 7113, 0902).',
    };
  }

  return { isValid: true, cleanHsn: clean };
}

/**
 * Validates GST Rate against accepted standard Indian GST slabs
 */
export function validateGstRate(rate) {
  if (rate === null || rate === undefined || rate === '') {
    return { isValid: false, message: 'GST rate is required' };
  }

  const numRate = Number(rate);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return { isValid: false, message: 'GST rate must be a valid percentage between 0% and 100%' };
  }

  if (!GST_RATES.includes(numRate)) {
    return { isValid: false, message: `GST rate must be one of the standard statutory slabs: ${GST_RATES.join('%, ')}%` };
  }

  return { isValid: true, rate: numRate };
}

/**
 * Helper to round to 2 decimal places authoritatively
 */
export function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates item-level tax for inclusive or exclusive pricing
 */
export function calculateItemTax({ price = 0, quantity = 1, gstRate = 0, cessRate = 0, isTaxInclusive = true }) {
  const lineTotal = round2(Number(price) * Number(quantity));
  const rate = Number(gstRate) + Number(cessRate);
  let taxableAmount = 0;
  let taxAmount = 0;
  let grossAmount = 0;

  if (isTaxInclusive) {
    taxableAmount = rate > 0 ? round2(lineTotal / (1 + rate / 100)) : lineTotal;
    taxAmount = round2(lineTotal - taxableAmount);
    grossAmount = lineTotal;
  } else {
    taxableAmount = lineTotal;
    taxAmount = round2(taxableAmount * (rate / 100));
    grossAmount = round2(taxableAmount + taxAmount);
  }

  return {
    lineTotal,
    taxableAmount,
    taxAmount,
    grossAmount,
  };
}

/**
 * Performs accurate line-item and order-level GST calculation
 * Supports Intra-state (CGST + SGST) and Inter-state (IGST)
 * Respects Tax-Inclusive vs Tax-Exclusive product pricing
 * 
 * @param {Object} params
 * @param {Array} params.items - Cart/Order items
 * @param {Object} params.sellerSettings - Store tax settings
 * @param {Object} params.destination - Customer shipping destination
 * @param {Number} params.discountRupees - Order-level discount in rupees
 * @param {String} params.sellerStateCode - Direct seller state code override
 * @param {String} params.buyerStateOrPincode - Direct buyer state or code override
 */
export function calculateOrderTaxes({
  items = [],
  sellerSettings = {},
  destination = {},
  discountRupees = 0,
  sellerStateCode: directSellerStateCode,
  buyerStateOrPincode,
}) {
  const sellerState = sellerSettings.sellerState || 'Tamil Nadu';
  const sellerStateCode = directSellerStateCode || sellerSettings.sellerStateCode || resolveGstStateCode(sellerState) || '33';
  const sellerGstin = sellerSettings.sellerGstin || '';
  const isTaxEnabled = sellerSettings.isTaxEnabled !== false;
  const defaultGstRate = Number(sellerSettings.defaultGstRate || 5.0);

  const destinationState = buyerStateOrPincode || destination.state || 'Tamil Nadu';
  const placeOfSupplyCode = resolveGstStateCode(destinationState) || sellerStateCode;
  const isInterState = String(sellerStateCode) !== String(placeOfSupplyCode);

  let totalTaxableAmount = 0;
  let totalCgstAmount = 0;
  let totalSgstAmount = 0;
  let totalIgstAmount = 0;
  let totalCessAmount = 0;
  let totalTaxAmount = 0;

  // Calculate gross subtotal to proportionally distribute discount across taxable items
  const grossSubtotal = items.reduce((sum, item) => {
    const itemTotal = Number(item.lineTotal) || (Number(item.price || item.unitPrice || 0) * (Number(item.quantity) || 1));
    return sum + itemTotal;
  }, 0);
  const discountFactor = grossSubtotal > 0 ? Math.max(0, 1 - (discountRupees / grossSubtotal)) : 1;

  const lineTaxes = items.map((item) => {
    const originalLineTotal = Number(item.lineTotal) || (Number(item.price || item.unitPrice || 0) * (Number(item.quantity) || 1));
    // Apply proportional discount to line total for taxable base calculation
    const discountedLineTotal = round2(originalLineTotal * discountFactor);

    const isTaxInclusive = item.isTaxInclusive !== undefined ? Boolean(item.isTaxInclusive) : true;
    const gstRate = isTaxEnabled
      ? (item.gstRate !== undefined && item.gstRate !== null ? Number(item.gstRate) : defaultGstRate)
      : 0;
    const cessRate = isTaxEnabled && item.cessRate ? Number(item.cessRate) : 0;
    const combinedRate = gstRate + cessRate;

    let taxableValue = 0;
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;
    let cessAmount = 0;
    let lineTotalTax = 0;
    let finalItemTotal = 0;

    if (isTaxInclusive) {
      // Selling price INCLUDES GST:
      // Taxable Value = Discounted Line Total / (1 + Rate / 100)
      taxableValue = combinedRate > 0
        ? round2(discountedLineTotal / (1 + combinedRate / 100))
        : discountedLineTotal;

      lineTotalTax = round2(discountedLineTotal - taxableValue);
      finalItemTotal = discountedLineTotal;
    } else {
      // Selling price EXCLUDES GST:
      // Taxable Value = Discounted Line Total
      taxableValue = discountedLineTotal;
      lineTotalTax = round2(taxableValue * (combinedRate / 100));
      finalItemTotal = round2(taxableValue + lineTotalTax);
    }

    if (combinedRate > 0 && taxableValue > 0) {
      if (isInterState) {
        // Inter-State: IGST applies
        igstRate = gstRate;
        igstAmount = round2(taxableValue * (igstRate / 100));
      } else {
        // Intra-State: 50% CGST + 50% SGST
        cgstRate = round2(gstRate / 2);
        sgstRate = round2(gstRate / 2);
        if (isTaxInclusive) {
          cgstAmount = round2(lineTotalTax / 2);
          sgstAmount = round2(lineTotalTax - cgstAmount);
        } else {
          cgstAmount = round2(taxableValue * (cgstRate / 100));
          sgstAmount = round2(taxableValue * (sgstRate / 100));
        }
      }

      if (cessRate > 0) {
        cessAmount = round2(taxableValue * (cessRate / 100));
      }

      // Re-sum authoritative line tax
      lineTotalTax = round2(cgstAmount + sgstAmount + igstAmount + cessAmount);
    }

    totalTaxableAmount = round2(totalTaxableAmount + taxableValue);
    totalCgstAmount = round2(totalCgstAmount + cgstAmount);
    totalSgstAmount = round2(totalSgstAmount + sgstAmount);
    totalIgstAmount = round2(totalIgstAmount + igstAmount);
    totalCessAmount = round2(totalCessAmount + cessAmount);
    totalTaxAmount = round2(totalTaxAmount + lineTotalTax);

    return {
      productId: item.productId,
      variantId: item.variantId || null,
      productName: item.productName || item.name,
      variantName: item.variantName || null,
      sku: item.sku || null,
      hsnCode: item.hsnCode || sellerSettings.defaultHsnCode || '5007',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      originalLineTotal,
      discountedLineTotal,
      isTaxInclusive,
      taxableAmount: taxableValue,
      gstRate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      cessRate,
      cessAmount,
      totalTax: lineTotalTax,
      finalItemTotal,
      taxVerificationStatus: item.taxVerificationStatus || 'PENDING_VERIFICATION',
      isTaxVerified: Boolean(item.isTaxVerified),
      taxTreatment: item.taxTreatment || 'TAXABLE',
    };
  });

  const taxSnapshot = {
    calculatedAt: new Date().toISOString(),
    isTaxEnabled,
    seller: {
      legalName: sellerSettings.sellerLegalName || 'Amoga Luxury Private Limited',
      tradeName: sellerSettings.sellerTradeName || 'Amoga',
      gstin: sellerGstin,
      pan: sellerSettings.sellerPan || '',
      state: sellerState,
      stateCode: sellerStateCode,
      address: [
        sellerSettings.sellerAddressLine1,
        sellerSettings.sellerAddressLine2,
        sellerSettings.sellerCity,
        sellerSettings.sellerState,
        sellerSettings.sellerPincode,
      ].filter(Boolean).join(', '),
    },
    buyer: {
      state: destinationState,
      placeOfSupplyCode,
      isInterState,
    },
    summary: {
      grossSubtotal: round2(grossSubtotal),
      discountRupees: round2(discountRupees),
      taxableAmount: totalTaxableAmount,
      cgstAmount: totalCgstAmount,
      sgstAmount: totalSgstAmount,
      igstAmount: totalIgstAmount,
      cessAmount: totalCessAmount,
      totalTaxAmount,
    },
    lineItems: lineTaxes,
  };

  return {
    isInterState,
    sellerStateCode,
    placeOfSupplyCode,
    placeOfSupply: destinationState,
    taxableAmount: totalTaxableAmount,
    cgstAmount: totalCgstAmount,
    sgstAmount: totalSgstAmount,
    igstAmount: totalIgstAmount,
    cessAmount: totalCessAmount,
    taxAmount: totalTaxAmount,
    totalTax: totalTaxAmount,
    lineTaxes,
    taxSnapshot,
  };
}

/**
 * Checks if a product satisfies mandatory tax compliance rules for live publication
 */
export function validateProductTaxCompliance(product) {
  const errors = [];

  if (!product.price || Number(product.price) <= 0) {
    errors.push('A valid selling price is required for live publication.');
  }

  if (!product.hsnCode || !validateHsnCode(product.hsnCode).isValid) {
    errors.push('A valid 2-8 digit HSN code is required for tax compliance.');
  }

  if (product.gstRate === null || product.gstRate === undefined || !validateGstRate(product.gstRate).isValid) {
    errors.push('A valid GST rate percentage is required for tax compliance.');
  }

  return {
    isCompliant: errors.length === 0,
    errors,
  };
}
