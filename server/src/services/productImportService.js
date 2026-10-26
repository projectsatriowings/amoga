import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import { broadcastProductUpdate } from '../controllers/productsController.js';
import { generateProductSku, generateVariantSku, isValidSkuFormat } from './skuService.js';
import { validateHsnCode, validateGstRate, validateProductTaxCompliance } from './taxService.js';

export const TEMPLATE_VERSION = 'AMOGA-TEMPLATE-v1.0';

export const VALID_COLLECTION_IDS = ['food', 'tea', 'sarees', 'jewellery'];

export const COLLECTION_INFO = {
  food: {
    id: 'food',
    name: 'Wholesome Pantry',
    categories: ['soups', 'millets', 'podis', 'spices', 'oils', 'snacks', 'superfoods', 'honey'],
    categoryNames: {
      soups: 'Soup Mixes',
      millets: 'Millet Mixes',
      podis: 'Rice Podis',
      spices: 'Spices & Seasonings',
      oils: 'Cold-Pressed Oils',
      snacks: 'Traditional Snacks',
      superfoods: 'Superfoods',
      honey: 'Wild Honey & Preserves',
    },
    description: 'Traditional South Indian culinary staples, cold-pressed oils, stone-ground podis, and nourishing millet mixes.',
  },
  tea: {
    id: 'tea',
    name: 'Wellness Tea',
    categories: ['flower', 'leaf', 'herbal'],
    categoryNames: {
      flower: 'Botanical Flower Brews',
      leaf: 'Medicinal Leaf Brews',
      herbal: 'Herbal & Root Brews',
    },
    description: 'Artisanal single-estate loose leaf teas, whole flower botanical infusions, and restorative Ayurvedic herbal brews.',
  },
  sarees: {
    id: 'sarees',
    name: 'Heritage Sarees',
    categories: ['saree', 'salwar', 'half-saree', 'silk', 'traditional', 'festive', 'wedding', 'contemporary'],
    categoryNames: {
      saree: 'Saree',
      salwar: 'Salwar',
      'half-saree': 'Half Saree',
      silk: 'Saree',
      traditional: 'Saree',
      festive: 'Saree',
      wedding: 'Saree',
      contemporary: 'Saree',
    },
    description: 'Handloom Kanchipuram mulberry silks, Banarasi brocades, and heirloom drapes woven on traditional pit looms.',
  },
  jewellery: {
    id: 'jewellery',
    name: 'Sterling Silver',
    categories: [
      'chain-with-pendant',
      'chain-pendant-earring',
      'earring',
      'anklets',
      'toe-rings',
      'bracelet',
      'necklace',
      'rings',
      'necklaces',
      'earrings',
      'bracelets',
      'traditional',
    ],
    categoryNames: {
      'chain-with-pendant': 'Chain with Pendant',
      'chain-pendant-earring': 'Chain Pendant Earring',
      earring: 'Earring',
      anklets: 'Anklets',
      'toe-rings': 'Toe Rings',
      bracelet: 'Bracelet',
      necklace: 'Necklace',
      rings: 'Rings',
      necklaces: 'Necklace',
      earrings: 'Earring',
      bracelets: 'Bracelet',
      traditional: 'Traditional Silver',
    },
    description: 'BIS 925 hallmarked sterling silver jewellery featuring natural gemstones, architectural bezels, and rhodium anti-tarnish finish.',
  },
};

/**
 * Normalizes header string by removing asterisks, parentheses, and extra whitespace for robust lookup.
 */
export function normalizeHeader(str) {
  return String(str || '')
    .replace(/[*()\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Scans candidate rows (rows 1 to 5) to dynamically detect the true header row.
 * Returns { headerRowNumber, headerMap, rawHeaderMap }
 */
function findHeaderRow(sheet, requiredKeywords = ['collection code', 'product code', 'product name']) {
  const maxSearchRow = Math.min(sheet.rowCount || 5, 6);
  for (let r = 1; r <= maxSearchRow; r++) {
    const row = sheet.getRow(r);
    const headerMap = new Map();
    const rawHeaderMap = new Map();
    let keywordMatches = 0;

    row.eachCell((cell, colNumber) => {
      const rawVal = String(cell.value || '').trim();
      if (rawVal) {
        const norm = normalizeHeader(rawVal);
        headerMap.set(norm, colNumber);
        rawHeaderMap.set(rawVal, colNumber);

        if (requiredKeywords.some((kw) => norm.includes(kw))) {
          keywordMatches++;
        }
      }
    });

    if (keywordMatches >= 1) {
      return { headerRowNumber: r, headerMap, rawHeaderMap };
    }
  }

  // Fallback to row 1
  const headerMap = new Map();
  const rawHeaderMap = new Map();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const rawVal = String(cell.value || '').trim();
    if (rawVal) {
      headerMap.set(normalizeHeader(rawVal), colNumber);
      rawHeaderMap.set(rawVal, colNumber);
    }
  });
  return { headerRowNumber: 1, headerMap, rawHeaderMap };
}

/**
 * Safely extracts a string cell value by normalized header names.
 */
function getCellByNormalized(row, headerMap, ...headerKeys) {
  for (const key of headerKeys) {
    const norm = normalizeHeader(key);
    const colIdx = headerMap.get(norm);
    if (colIdx) {
      const cell = row.getCell(colIdx);
      if (!cell || cell.value === null || cell.value === undefined) continue;
      if (typeof cell.value === 'object') {
        if (cell.value.text) return String(cell.value.text).trim();
        if (cell.value.result) return String(cell.value.result).trim();
      }
      return String(cell.value).trim();
    }
  }
  return '';
}

/**
 * Safely extracts a numeric cell value by normalized header names.
 */
function getNumericByNormalized(row, headerMap, ...headerKeys) {
  const raw = getCellByNormalized(row, headerMap, ...headerKeys);
  if (!raw) return null;
  const clean = raw.replace(/[₹,\s]/g, '');
  const num = Number(clean);
  return isNaN(num) ? 'INVALID' : num;
}

/**
 * Generates the official multi-sheet Excel workbook template for bulk product import.
 */
export async function generateProductImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amoga E-Commerce Architecture';
  workbook.lastModifiedBy = 'Amoga Administrator';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color Tokens & Header Styles
  const mandatoryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF722F37' }, // Deep Burgundy (Required *)
  };
  const optionalHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark Slate (Core Optional)
  };
  const foodHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2D5A27' }, // Forest Green (Wholesome Pantry)
  };
  const teaHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E564E' }, // Botanical Teal (Wellness Tea)
  };
  const sareesHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF581C44' }, // Royal Plum (Heritage Sarees)
  };
  const jewelleryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3E4C59' }, // Slate Silver (Sterling Silver)
  };
  const customSpecsHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4A3B32' }, // Warm Bronze (JSON Specs)
  };

  const headerFontWhite = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  // ----------------------------------------------------
  // SHEET 1: START HERE (Welcome, Legend, Instructions, Images)
  // ----------------------------------------------------
  const startHereSheet = workbook.addWorksheet('Start Here', {
    views: [{ showGridLines: true }],
  });
  startHereSheet.getColumn(1).width = 30;
  startHereSheet.getColumn(2).width = 90;

  startHereSheet.addRow(['AMOGA BULK PRODUCT IMPORT — START HERE', '']);
  startHereSheet.addRow(['Template Version', TEMPLATE_VERSION]);
  startHereSheet.addRow(['Supported Collections', 'Wholesome Pantry (food), Wellness Tea (tea), Heritage Sarees (sarees), Sterling Silver (jewellery)']);
  startHereSheet.addRow(['Default Currency', 'Indian Rupee (INR ₹)']);
  startHereSheet.addRow(['', '']);

  startHereSheet.addRow(['1. MANDATORY FIELD LEGEND (HOW TO USE *)', '']);
  startHereSheet.addRow([
    'Columns with Asterisk (*)',
    'MANDATORY FIELDS. A product CANNOT be created if any mandatory column is left blank. These include: Collection Code *, Product Code *, Product Name *, Category Code *, Description *, and Primary Image URL *.',
  ]);
  startHereSheet.addRow([
    'Columns without Asterisk',
    'OPTIONAL FIELDS. You can leave these blank if the information is unavailable. Optional fields enrich the customer experience, storefront search, and SEO, but will not block the product import.',
  ]);
  startHereSheet.addRow([
    'Category-Specific Columns',
    'Columns grouped under Pantry, Tea, Sarees, and Jewellery apply ONLY to products belonging to that collection. For example, Sarees columns are ignored for Food products.',
  ]);
  startHereSheet.addRow(['', '']);

  startHereSheet.addRow(['2. IMAGE URL GUIDELINES (DO NOT USE LOCAL PATHS)', '']);
  startHereSheet.addRow([
    'Valid Image URL Format',
    'Primary Image URL * must be a publicly accessible web URL (e.g. https://res.cloudinary.com/... or https://images.unsplash.com/...) OR an internal application path (e.g. /images/gatekeeper-food.jpg or /uploads/uuid.jpg).',
  ]);
  startHereSheet.addRow([
    'Local File Paths NOT Allowed',
    'Do NOT use local computer paths like "C:\\Users\\admin\\Desktop\\photo.jpg" or "file:///...". The server and customers cannot access files stored on your private computer drive.',
  ]);
  startHereSheet.addRow([
    'How to Upload New Images',
    'To upload local images, open Admin Panel → Products → Add Product → Upload File. The file is uploaded to the secure /uploads/ directory and provides an instant path you can paste into this spreadsheet.',
  ]);
  startHereSheet.addRow(['', '']);

  startHereSheet.addRow(['3. PRICING & PUBLICATION RULES', '']);
  startHereSheet.addRow([
    'Publication Status',
    'Supported values: "Draft" (default) or "Published". Products imported as "Draft" remain hidden from storefront customers until an admin reviews and publishes them.',
  ]);
  startHereSheet.addRow([
    'Unpriced Products Rule',
    'Any product with Publication Status "Published" MUST have a valid Selling Price (> ₹0), either on the Products sheet or on its child Variants sheet. Unpriced products are automatically rejected if marked Published.',
  ]);
  startHereSheet.addRow([
    'Variant Pricing',
    'If a product is priced exclusively through its variants (e.g. Sarees with different zari work, or Rings with different gemstone sizes), leave the product-level price blank and provide prices on the "Variants" sheet.',
  ]);
  startHereSheet.addRow(['', '']);

  startHereSheet.addRow(['4. STEP-BY-STEP IMPORT PROCESS', '']);
  startHereSheet.addRow([
    'Step 1: Fill Products Sheet',
    'Enter one row per product on the "Products" sheet. Choose a valid Collection Code and Category Code from the "Collections & Categories" sheet.',
  ]);
  startHereSheet.addRow([
    'Step 2: Add Variants (Optional)',
    'If products have multiple sizes, colors, or weights, list them on the "Variants" sheet linked by the parent "Product Code *".',
  ]);
  startHereSheet.addRow([
    'Step 3: Consult the Field Guide',
    'If you are unsure about any column, refer to the "Field Guide" sheet for detailed definitions, accepted values, and practical examples.',
  ]);
  startHereSheet.addRow([
    'Step 4: Upload and Validate',
    'Navigate to Admin Panel → Products → Bulk Upload. Drag and drop your completed .xlsx file and click "Validate File".',
  ]);
  startHereSheet.addRow([
    'Step 5: Review & Import',
    'Inspect the parsed preview table and resolve any row-level validation errors. Once validation passes, click "Import Products" to safely commit the records.',
  ]);

  // Style Start Here Sheet
  startHereSheet.getRow(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF722F37' } };
  startHereSheet.getRow(6).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };
  startHereSheet.getRow(11).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };
  startHereSheet.getRow(16).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };
  startHereSheet.getRow(21).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };

  // ----------------------------------------------------
  // SHEET 2: PRODUCTS
  // ----------------------------------------------------
  const productsSheet = workbook.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  const productColumnDefs = [
    // 1. Mandatory Common Fields
    { header: 'Collection Code *', key: 'collectionId', width: 18, type: 'mandatory' },
    { header: 'Product Code *', key: 'sourceId', width: 22, type: 'mandatory' },
    { header: 'Product Name *', key: 'name', width: 34, type: 'mandatory' },
    { header: 'Category Code *', key: 'category', width: 18, type: 'mandatory' },
    { header: 'Description *', key: 'description', width: 48, type: 'mandatory' },
    { header: 'Primary Image URL *', key: 'image', width: 36, type: 'mandatory' },

    // 2. Core Optional Fields
    { header: 'Slug (Auto-generated if blank)', key: 'slug', width: 28, type: 'optional' },
    { header: 'Category Name', key: 'categoryName', width: 22, type: 'optional' },
    { header: 'Tagline', key: 'tagline', width: 32, type: 'optional' },
    { header: 'Gallery Image URLs', key: 'gallery', width: 38, type: 'optional' },
    { header: 'Pack Size / Weight', key: 'packSize', width: 20, type: 'optional' },
    { header: 'Selling Price (INR)', key: 'price', width: 18, type: 'optional' },
    { header: 'SKU (Auto-generated if blank)', key: 'sku', width: 26, type: 'optional' },
    { header: 'HSN Code *', key: 'hsnCode', width: 18, type: 'mandatory' },
    { header: 'GST Rate % *', key: 'gstRate', width: 18, type: 'mandatory' },
    { header: 'Tax Inclusive (Yes/No)', key: 'isTaxInclusive', width: 22, type: 'optional' },
    { header: 'GST Cess Rate %', key: 'cessRate', width: 18, type: 'optional' },
    { header: 'Tax Classification', key: 'taxClassification', width: 20, type: 'optional' },
    { header: 'Publication Status', key: 'status', width: 18, type: 'optional' },
    { header: 'In Stock', key: 'inStock', width: 12, type: 'optional' },
    { header: 'Stock Quantity', key: 'stockQuantity', width: 16, type: 'optional' },
    { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20, type: 'optional' },
    { header: 'Featured', key: 'isFeatured', width: 12, type: 'optional' },
    { header: 'Badge', key: 'badge', width: 16, type: 'optional' },
    { header: 'Tags', key: 'tags', width: 26, type: 'optional' },

    // 3. Category Specific - Wholesome Pantry (food)
    { header: 'Pantry: Ingredients', key: 'food_ingredients', width: 32, type: 'food' },
    { header: 'Pantry: Allergens', key: 'food_allergens', width: 22, type: 'food' },
    { header: 'Pantry: Dietary Details', key: 'food_dietary', width: 24, type: 'food' },
    { header: 'Pantry: Pack Weight / Size', key: 'food_packWeight', width: 22, type: 'food' },
    { header: 'Pantry: Servings', key: 'food_servings', width: 16, type: 'food' },
    { header: 'Pantry: Preparation Instructions', key: 'food_prep', width: 35, type: 'food' },
    { header: 'Pantry: Storage Instructions', key: 'food_storage', width: 25, type: 'food' },
    { header: 'Pantry: Shelf Life', key: 'food_shelfLife', width: 18, type: 'food' },
    { header: 'Pantry: FSSAI / Compliance', key: 'food_compliance', width: 24, type: 'food' },

    // 4. Category Specific - Wellness Tea (tea)
    { header: 'Tea: Ingredients', key: 'tea_ingredients', width: 30, type: 'tea' },
    { header: 'Tea: Type', key: 'tea_type', width: 20, type: 'tea' },
    { header: 'Tea: Form', key: 'tea_form', width: 18, type: 'tea' },
    { header: 'Tea: Caffeine Info', key: 'tea_caffeine', width: 24, type: 'tea' },
    { header: 'Tea: Brewing Temp (°C)', key: 'tea_temp', width: 22, type: 'tea' },
    { header: 'Tea: Brewing Time (mins)', key: 'tea_time', width: 22, type: 'tea' },
    { header: 'Tea: Serving Size', key: 'tea_serving', width: 18, type: 'tea' },
    { header: 'Tea: Harvest Season', key: 'tea_harvest', width: 22, type: 'tea' },
    { header: 'Tea: Storage Instructions', key: 'tea_storage', width: 26, type: 'tea' },
    { header: 'Tea: Disclaimer', key: 'tea_disclaimer', width: 28, type: 'tea' },

    // 5. Category Specific - Heritage Sarees (sarees)
    { header: 'Sarees: Fabric', key: 'saree_fabric', width: 30, type: 'sarees' },
    { header: 'Sarees: Weave Type', key: 'saree_weave', width: 28, type: 'sarees' },
    { header: 'Sarees: Length (m)', key: 'saree_length', width: 18, type: 'sarees' },
    { header: 'Sarees: Blouse Piece Details', key: 'saree_blouse', width: 30, type: 'sarees' },
    { header: 'Sarees: Primary Colour', key: 'saree_color', width: 20, type: 'sarees' },
    { header: 'Sarees: Border Details', key: 'saree_border', width: 30, type: 'sarees' },
    { header: 'Sarees: Occasion', key: 'saree_occasion', width: 24, type: 'sarees' },
    { header: 'Sarees: Care Instructions', key: 'saree_care', width: 26, type: 'sarees' },
    { header: 'Sarees: Authenticity / Mark', key: 'saree_authenticity', width: 24, type: 'sarees' },

    // 6. Category Specific - Sterling Silver (jewellery)
    { header: 'Jewellery: Type', key: 'jewel_type', width: 18, type: 'jewellery' },
    { header: 'Jewellery: Metal Type', key: 'jewel_metal', width: 22, type: 'jewellery' },
    { header: 'Jewellery: Verified Purity', key: 'jewel_purity', width: 20, type: 'jewellery' },
    { header: 'Jewellery: Gross Weight (g)', key: 'jewel_weight', width: 24, type: 'jewellery' },
    { header: 'Jewellery: Stone Details', key: 'jewel_stone', width: 28, type: 'jewellery' },
    { header: 'Jewellery: Plating / Finish', key: 'jewel_finish', width: 24, type: 'jewellery' },
    { header: 'Jewellery: Size', key: 'jewel_size', width: 18, type: 'jewellery' },
    { header: 'Jewellery: Hallmark Details', key: 'jewel_hallmark', width: 24, type: 'jewellery' },
    { header: 'Jewellery: Care Instructions', key: 'jewel_care', width: 28, type: 'jewellery' },

    // 7. Custom Raw Specs JSON
    { header: 'Custom Specs JSON', key: 'custom_specs', width: 25, type: 'custom' },
  ];

  // Set column widths
  productColumnDefs.forEach((col, idx) => {
    productsSheet.getColumn(idx + 1).width = col.width;
  });

  // Row 1: Banner explaining required fields
  const bannerRow = productsSheet.getRow(1);
  bannerRow.height = 28;
  bannerRow.getCell(1).value =
    'NOTE: Columns marked with asterisk (*) are MANDATORY to create a product. All other columns are optional. Category columns apply only to that specific collection. See "Field Guide" sheet for full details.';
  bannerRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
  bannerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
  bannerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' }, // Soft warm amber
  };

  // Row 2: Headers
  const headerRow = productsSheet.getRow(2);
  headerRow.height = 28;
  productColumnDefs.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = headerFontWhite;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    if (col.type === 'mandatory') {
      cell.fill = mandatoryHeaderFill;
    } else if (col.type === 'optional') {
      cell.fill = optionalHeaderFill;
    } else if (col.type === 'food') {
      cell.fill = foodHeaderFill;
    } else if (col.type === 'tea') {
      cell.fill = teaHeaderFill;
    } else if (col.type === 'sarees') {
      cell.fill = sareesHeaderFill;
    } else if (col.type === 'jewellery') {
      cell.fill = jewelleryHeaderFill;
    } else {
      cell.fill = customSpecsHeaderFill;
    }
  });

  // Sample realistic products across all four collections
  const sampleProducts = [
    {
      collectionId: 'food',
      sourceId: 'f-sample-moringa-soup',
      name: 'Organic Moringa & Pepper Soup Mix',
      category: 'soups',
      description: 'Hand-harvested organic drumstick leaves dried and stone-ground with roasted lentils, cumin, and Malabar black pepper. 100% natural and comforting.',
      image: '/images/food-soups-hero.jpg',
      slug: 'organic-moringa-pepper-soup-mix',
      categoryName: 'Soup Mixes',
      tagline: 'Wholesome drumstick leaf soup infused with Malabar black pepper',
      gallery: '',
      packSize: '150 g',
      price: 249,
      sku: 'AMOGA-SOUP001',
      hsnCode: '2106',
      gstRate: 12,
      isTaxInclusive: 'Yes',
      cessRate: 0,
      taxClassification: 'GOODS',
      status: 'Published',
      inStock: 'Yes',
      stockQuantity: 45,
      lowStockThreshold: 5,
      isFeatured: 'Yes',
      badge: 'Bestseller',
      tags: 'organic, soup, moringa, vegetarian',
      food_ingredients: 'Organic Moringa Leaves, Toor Dal, Malabar Black Pepper, Cumin, Garlic, Sea Salt',
      food_allergens: 'None',
      food_dietary: '100% Vegetarian, Gluten-Free',
      food_packWeight: '150 g Glass Jar',
      food_servings: '6-8 bowls',
      food_prep: 'Mix 2 tbsp with 200ml boiling water. Simmer for 2 mins and serve hot.',
      food_storage: 'Store in an airtight container in a cool, dry place.',
      food_shelfLife: '9 Months',
      food_compliance: 'FSSAI Lic. No. 22425540000677',
    },
    {
      collectionId: 'tea',
      sourceId: 'tea-sample-chamomile-calm',
      name: 'Kashmir Chamomile & Mint Tea',
      category: 'flower',
      description: 'Whole Egyptian chamomile blossoms blended with refreshing mountain spearmint. Naturally caffeine-free evening relaxation ritual.',
      image: '/images/food-teas-hero.jpg',
      slug: 'kashmir-chamomile-mint-tea',
      categoryName: 'Botanical Flower Brews',
      tagline: 'Whole chamomile blossoms with Himalayan spearmint',
      gallery: '',
      packSize: '25 g',
      price: 499,
      sku: 'AMOGA-TEA001',
      hsnCode: '0902',
      gstRate: 5,
      isTaxInclusive: 'Yes',
      cessRate: 0,
      taxClassification: 'GOODS',
      status: 'Published',
      inStock: 'Yes',
      stockQuantity: 30,
      lowStockThreshold: 5,
      isFeatured: 'No',
      badge: 'Artisanal',
      tags: 'tea, herbal, chamomile, caffeine-free',
      tea_ingredients: 'Whole Chamomile Blossoms, Himalayan Spearmint Leaves',
      tea_type: 'Botanical Herbal Infusion',
      tea_form: 'Whole Flower & Leaf',
      tea_caffeine: 'Naturally Caffeine Free',
      tea_temp: '90°C',
      tea_time: '4-5 mins',
      tea_serving: '1 tsp (2g) per 200ml cup',
      tea_harvest: 'Spring 2026',
      tea_storage: 'Store in airtight tin away from moisture.',
      tea_disclaimer: 'Not intended to treat or prevent medical ailments.',
    },
    {
      collectionId: 'sarees',
      sourceId: 's-sample-royal-wine-silk',
      name: 'Kanchipuram Pure Silk Saree in Royal Wine',
      category: 'silk',
      description: 'Handwoven on traditional pit looms in Kanchipuram by master weavers. Features authentic interlocking Korvai technique, rich temple border, and contrast zari pallu.',
      image: '/images/saree-kanchipuram.jpg',
      slug: 'kanchipuram-pure-silk-saree-royal-wine',
      categoryName: 'Silk Sarees',
      tagline: 'Handwoven pure mulberry silk with rich gold zari peacock border',
      gallery: '',
      packSize: 'Standard (6.3 m)',
      price: 18999,
      sku: 'AMOGA-SAR001',
      hsnCode: '5007',
      gstRate: 5,
      isTaxInclusive: 'Yes',
      cessRate: 0,
      taxClassification: 'GOODS',
      status: 'Published',
      inStock: 'Yes',
      stockQuantity: 8,
      lowStockThreshold: 2,
      isFeatured: 'Yes',
      badge: 'Silk Mark',
      tags: 'saree, kanchipuram, wedding, bridal',
      saree_fabric: '100% Pure Mulberry Silk',
      saree_weave: 'Handloom Korvai Weave',
      saree_length: '6.3 m (including blouse)',
      saree_blouse: 'Unstitched contrast silk blouse (80 cm)',
      saree_color: 'Royal Wine & Antique Gold',
      saree_border: 'Traditional Temple Border with Tested Gold Zari',
      saree_occasion: 'Wedding, Bridal, Traditional Festive',
      saree_care: 'Strictly Dry Clean Only. Store in breathable muslin wrap.',
      saree_authenticity: 'Silk Mark Certified',
    },
    {
      collectionId: 'jewellery',
      sourceId: 'j-sample-solstice-ring',
      name: 'Solstice Moonstone Ring in 925 Silver',
      category: 'rings',
      description: 'Featuring a luminous natural oval rainbow moonstone held in an architectural sterling silver bezel. Finished with anti-tarnish rhodium plating for lasting brilliance.',
      image: '/images/jewellery-solstice-ring.jpg',
      slug: 'solstice-moonstone-ring-925-silver',
      categoryName: 'Rings',
      tagline: 'Hand-set natural rainbow moonstone in architectural 925 sterling silver',
      gallery: '',
      packSize: '1 Piece',
      price: 3499,
      status: 'Published',
      inStock: 'Yes',
      stockQuantity: 15,
      lowStockThreshold: 3,
      isFeatured: 'Yes',
      badge: 'BIS 925',
      tags: 'silver, ring, moonstone, 925',
      jewel_type: 'Ring',
      jewel_metal: '925 Sterling Silver',
      jewel_purity: '92.5% Pure Silver',
      jewel_weight: '5.8 g',
      jewel_stone: 'Natural Rainbow Moonstone',
      jewel_finish: 'Anti-Tarnish Rhodium Finish',
      jewel_size: 'US 7',
      jewel_hallmark: 'BIS 925 Hallmarked',
      jewel_care: 'Store in provided airtight velvet pouch; keep away from water and perfume.',
    },
  ];

  sampleProducts.forEach((item) => {
    const rowValues = productColumnDefs.map((col) => item[col.key] ?? '');
    productsSheet.addRow(rowValues);
  });

  // Data validations for dropdown fields on Products sheet
  productsSheet.dataValidations.add('A3:A500', {
    type: 'list',
    allowBlank: false,
    formulae: ['"food,tea,sarees,jewellery"'],
  });
  productsSheet.dataValidations.add('Q3:Q500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"0,3,5,12,18,28"'],
  });
  productsSheet.dataValidations.add('R3:R500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Yes,No"'],
  });
  productsSheet.dataValidations.add('T3:T500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"GOODS,SERVICES"'],
  });
  productsSheet.dataValidations.add('U3:U500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Draft,Published"'],
  });
  productsSheet.dataValidations.add('V3:V500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Yes,No"'],
  });
  productsSheet.dataValidations.add('Y3:Y500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Yes,No"'],
  });

  // ----------------------------------------------------
  // SHEET 3: VARIANTS
  // ----------------------------------------------------
  const variantsSheet = workbook.addWorksheet('Variants', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  const variantColumnDefs = [
    { header: 'Product Code *', key: 'productCode', width: 24, type: 'mandatory' },
    { header: 'Variant Name *', key: 'variantName', width: 26, type: 'mandatory' },
    { header: 'Variant SKU (Auto-generated if blank)', key: 'sku', width: 28, type: 'optional' },
    { header: 'Variant Type', key: 'type', width: 18, type: 'optional' },
    { header: 'Option Value', key: 'optionValue', width: 22, type: 'optional' },
    { header: 'Selling Price (INR)', key: 'price', width: 18, type: 'optional' },
    { header: 'HSN Code (Optional)', key: 'hsnCode', width: 20, type: 'optional' },
    { header: 'GST Rate % (Optional)', key: 'gstRate', width: 20, type: 'optional' },
    { header: 'Tax Inclusive (Yes/No)', key: 'isTaxInclusive', width: 22, type: 'optional' },
    { header: 'GST Cess Rate % (Optional)', key: 'cessRate', width: 22, type: 'optional' },
    { header: 'Stock Quantity', key: 'stockQuantity', width: 16, type: 'optional' },
    { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20, type: 'optional' },
    { header: 'In Stock', key: 'inStock', width: 12, type: 'optional' },
    { header: 'Variant Attributes JSON', key: 'attributesJson', width: 30, type: 'optional' },
  ];

  variantColumnDefs.forEach((col, idx) => {
    variantsSheet.getColumn(idx + 1).width = col.width;
  });

  // Row 1: Banner for Variants
  const varBanner = variantsSheet.getRow(1);
  varBanner.height = 28;
  varBanner.getCell(1).value =
    'NOTE: Use this sheet to specify color, size, weight, or shade variations. Product Code * must match an existing row on the Products sheet.';
  varBanner.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
  varBanner.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' },
  };

  // Row 2: Headers
  const varHeader = variantsSheet.getRow(2);
  varHeader.height = 28;
  variantColumnDefs.forEach((col, idx) => {
    const cell = varHeader.getCell(idx + 1);
    cell.value = col.header;
    cell.font = headerFontWhite;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = col.type === 'mandatory' ? mandatoryHeaderFill : optionalHeaderFill;
  });

  const sampleVariants = [
    {
      productCode: 's-sample-royal-wine-silk',
      variantName: 'Royal Wine & Antique Gold',
      sku: 'SAR-WINE-01',
      type: 'color',
      optionValue: '#451523',
      price: 18999,
      stockQuantity: 5,
      lowStockThreshold: 2,
      inStock: 'Yes',
      attributesJson: '{"hex":"#451523","colorName":"Royal Wine"}',
    },
    {
      productCode: 's-sample-royal-wine-silk',
      variantName: 'Temple Crimson & Gold',
      sku: 'SAR-CRIMSON-02',
      type: 'color',
      optionValue: '#7A1C28',
      price: 18999,
      stockQuantity: 3,
      lowStockThreshold: 2,
      inStock: 'Yes',
      attributesJson: '{"hex":"#7A1C28","colorName":"Temple Crimson"}',
    },
    {
      productCode: 'j-sample-solstice-ring',
      variantName: 'US 6',
      sku: 'J-SOL-US6',
      type: 'size',
      optionValue: 'US 6',
      price: 3499,
      stockQuantity: 6,
      lowStockThreshold: 2,
      inStock: 'Yes',
      attributesJson: '{"size":"US 6","diameterMm":16.5}',
    },
    {
      productCode: 'j-sample-solstice-ring',
      variantName: 'US 7',
      sku: 'J-SOL-US7',
      type: 'size',
      optionValue: 'US 7',
      price: 3499,
      stockQuantity: 9,
      lowStockThreshold: 2,
      inStock: 'Yes',
      attributesJson: '{"size":"US 7","diameterMm":17.3}',
    },
  ];

  sampleVariants.forEach((v) => {
    variantsSheet.addRow(variantColumnDefs.map((col) => v[col.key] ?? ''));
  });

  variantsSheet.dataValidations.add('D3:D500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"color,size,weight,custom"'],
  });
  variantsSheet.dataValidations.add('I3:I500', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Yes,No"'],
  });

  // ----------------------------------------------------
  // SHEET 4: INVENTORY
  // ----------------------------------------------------
  const inventorySheet = workbook.addWorksheet('Inventory', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  const invColumnDefs = [
    { header: 'Product Code *', key: 'productCode', width: 26, type: 'mandatory' },
    { header: 'Variant SKU', key: 'sku', width: 22, type: 'optional' },
    { header: 'New Stock Quantity *', key: 'newStock', width: 22, type: 'mandatory' },
    { header: 'Low Stock Threshold', key: 'threshold', width: 20, type: 'optional' },
    { header: 'Adjustment Reason *', key: 'reason', width: 36, type: 'mandatory' },
  ];

  invColumnDefs.forEach((col, idx) => {
    inventorySheet.getColumn(idx + 1).width = col.width;
  });

  const invBanner = inventorySheet.getRow(1);
  invBanner.height = 28;
  invBanner.getCell(1).value =
    'NOTE: Used exclusively in "Initial Inventory Import" mode to set or audit warehouse stock counts with official audit reasons.';
  invBanner.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
  invBanner.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' },
  };

  const invHeader = inventorySheet.getRow(2);
  invHeader.height = 28;
  invColumnDefs.forEach((col, idx) => {
    const cell = invHeader.getCell(idx + 1);
    cell.value = col.header;
    cell.font = headerFontWhite;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = col.type === 'mandatory' ? mandatoryHeaderFill : optionalHeaderFill;
  });

  const sampleInventory = [
    {
      productCode: 'f-sample-moringa-soup',
      sku: '',
      newStock: 50,
      threshold: 5,
      reason: 'Initial Batch Warehouse Stocking',
    },
    {
      productCode: 's-sample-royal-wine-silk',
      sku: 'SAR-WINE-01',
      newStock: 8,
      threshold: 2,
      reason: 'Fresh Handloom Lot Arrival',
    },
  ];

  sampleInventory.forEach((item) => {
    inventorySheet.addRow(invColumnDefs.map((col) => item[col.key] ?? ''));
  });

  // ----------------------------------------------------
  // SHEET 5: FIELD GUIDE (Complete Column Reference & Explanations)
  // ----------------------------------------------------
  const guideSheet = workbook.addWorksheet('Field Guide', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const guideColumns = [
    { header: 'Column Header', key: 'header', width: 30 },
    { header: 'Requirement', key: 'requirement', width: 16 },
    { header: 'Applicable Collection', key: 'collection', width: 22 },
    { header: 'Description & Business Purpose', key: 'description', width: 50 },
    { header: 'Accepted Values / Format', key: 'format', width: 32 },
    { header: 'Example Value', key: 'example', width: 30 },
  ];

  guideSheet.columns = guideColumns;
  const guideHeaderRow = guideSheet.getRow(1);
  guideHeaderRow.height = 28;
  guideHeaderRow.eachCell((cell) => {
    cell.font = headerFontWhite;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = optionalHeaderFill;
  });

  const fieldGuideEntries = [
    // Mandatory Common Fields
    {
      header: 'Collection Code *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'System collection key to place the product into the correct universe.',
      format: 'food, tea, sarees, jewellery',
      example: 'food',
    },
    {
      header: 'Product Code *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'Unique internal SKU or identifier used for imports and inventory tracking.',
      format: 'Unique alphanumeric text (lowercase & hyphens recommended)',
      example: 'f-moringa-soup-01',
    },
    {
      header: 'Product Name *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'Customer-facing product title displayed on storefront and order invoices.',
      format: 'Text string (up to 150 chars)',
      example: 'Organic Moringa & Pepper Soup Mix',
    },
    {
      header: 'Category Code *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'Subcategory identifier matching the chosen collection.',
      format: 'See "Collections & Categories" sheet',
      example: 'soups (for food), silk (for sarees)',
    },
    {
      header: 'Description *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'Detailed product story, ingredients summary, origin, or drape description.',
      format: 'Plain text or rich paragraphs',
      example: 'Hand-harvested organic drumstick leaves dried and stone-ground...',
    },
    {
      header: 'Primary Image URL *',
      requirement: 'MANDATORY *',
      collection: 'All Collections',
      description: 'Publicly reachable HTTPS image URL or media path. Local files (C:\\...) NOT allowed.',
      format: 'HTTPS URL or /images/... or /uploads/...',
      example: '/images/food-soups-hero.jpg',
    },

    // Core Optional Fields
    {
      header: 'Slug (Auto-generated if blank)',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'URL-friendly product handle. If left empty, auto-generated from Product Name.',
      format: 'Lowercase letters, numbers, and hyphens',
      example: 'organic-moringa-pepper-soup',
    },
    {
      header: 'Category Name',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Human-friendly category display name. Auto-filled from Category Code if empty.',
      format: 'Text string',
      example: 'Soup Mixes',
    },
    {
      header: 'Tagline',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Short promotional subtitle appearing under product title.',
      format: 'Text string (up to 100 chars)',
      example: 'Wholesome drumstick leaf soup infused with pepper',
    },
    {
      header: 'Gallery Image URLs',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Additional secondary product images for gallery carousel.',
      format: 'Comma-separated URLs',
      example: 'https://..., https://...',
    },
    {
      header: 'Pack Size / Weight',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Physical pack size or measurement displayed next to price.',
      format: 'Text string',
      example: '150 g Glass Jar, 6.3 m with blouse',
    },
    {
      header: 'Selling Price (INR)',
      requirement: 'CONDITIONAL',
      collection: 'All Collections',
      description: 'Selling price in Indian Rupees. Required if product is Published and has no variant prices.',
      format: 'Positive number without currency symbols',
      example: '249',
    },
    {
      header: 'MRP / Compare Price (INR)',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Strikethrough reference price in Rupees to show discount.',
      format: 'Positive number',
      example: '299',
    },
    {
      header: 'Discount Label',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Badge indicating savings or promo.',
      format: 'Text string',
      example: '17% OFF',
    },
    {
      header: 'SKU (Auto-generated if blank)',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Stock Keeping Unit. Leave blank to auto-generate based on category sequence (e.g. AMOGA-SAR001, AMOGA-TEA001, AMOGA-MAS001, AMOGA-SOUP001, AMOGA-MIL001, AMOGA-POD001, AMOGA-SIL001). Custom SKUs must be unique.',
      format: 'Alphanumeric, hyphens, underscores (3-40 chars)',
      example: 'AMOGA-SAR001',
    },
    {
      header: 'HSN Code *',
      requirement: 'MANDATORY (For Live Sale)',
      collection: 'All Collections',
      description: 'Harmonized System of Nomenclature code for statutory GST compliance. 2 to 8 digit numeric code (e.g. 5007 for Silk Sarees, 7113 for Silver Jewellery, 0902 for Tea, 2106 for Food/Soup mixes, 1904 for Millets, 0910 for Spices/Podis). Required for published products.',
      format: '2 to 8 digits numeric string',
      example: '5007',
    },
    {
      header: 'GST Rate % *',
      requirement: 'MANDATORY (For Live Sale)',
      collection: 'All Collections',
      description: 'Applicable GST rate percentage. Standard slabs: 0, 3, 5, 12, 18, 28 (e.g. 3% for Silver, 5% for Sarees & Tea, 12% for Soups/Food mixes). Required for published products.',
      format: 'Number (0, 3, 5, 12, 18, 28)',
      example: '5',
    },
    {
      header: 'Tax Inclusive (Yes/No)',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Specifies whether selling price already includes GST. Defaults to Yes for retail transparency.',
      format: 'Yes, No',
      example: 'Yes',
    },
    {
      header: 'GST Cess Rate %',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Additional GST Compensation Cess percentage if applicable to the luxury item.',
      format: 'Non-negative number',
      example: '0',
    },
    {
      header: 'Tax Classification',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Supply classification. Defaults to GOODS.',
      format: 'GOODS, SERVICES',
      example: 'GOODS',
    },
    {
      header: 'Publication Status',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Visibility on storefront. Defaults to "Draft" for safety.',
      format: 'Draft, Published',
      example: 'Published',
    },
    {
      header: 'In Stock',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Availability flag. Defaults to Yes.',
      format: 'Yes, No',
      example: 'Yes',
    },
    {
      header: 'Stock Quantity',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Initial available inventory units. Defaults to 50.',
      format: 'Non-negative integer',
      example: '45',
    },
    {
      header: 'Low Stock Threshold',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Triggers admin warning when stock falls below this quantity. Defaults to 5.',
      format: 'Integer >= 0',
      example: '5',
    },
    {
      header: 'Featured',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Highlights item on category hero grids and collection homepages.',
      format: 'Yes, No',
      example: 'Yes',
    },
    {
      header: 'Badge',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Small tag pill on product card.',
      format: 'Text string',
      example: 'Bestseller, Silk Mark, BIS 925',
    },
    {
      header: 'Tags',
      requirement: 'OPTIONAL',
      collection: 'All Collections',
      description: 'Search keywords separated by commas.',
      format: 'Comma-separated keywords',
      example: 'organic, soup, gluten-free',
    },

    // Category Specific - Wholesome Pantry
    {
      header: 'Pantry: Ingredients',
      requirement: 'RECOMMENDED',
      collection: 'Wholesome Pantry (food)',
      description: 'Full ingredients list. Strongly recommended for Indian food compliance.',
      format: 'Comma-separated ingredients',
      example: 'Organic Moringa, Toor Dal, Black Pepper, Cumin',
    },
    {
      header: 'Pantry: Allergens',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Allergen advisory or facility warnings.',
      format: 'Text string',
      example: 'Processed in facility handling nuts and sesame',
    },
    {
      header: 'Pantry: Dietary Details',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Dietary highlights (vegetarian, vegan, preservative-free).',
      format: 'Text string',
      example: '100% Vegetarian, Gluten-Free',
    },
    {
      header: 'Pantry: Servings',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Approximate number of servings per pack.',
      format: 'Text string',
      example: '6-8 bowls',
    },
    {
      header: 'Pantry: Preparation Instructions',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Cooking or reconstitution instructions for customer.',
      format: 'Text string',
      example: 'Mix 2 tbsp with 200ml boiling water. Simmer 2 mins.',
    },
    {
      header: 'Pantry: Storage Instructions',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Recommended storage environment.',
      format: 'Text string',
      example: 'Store in airtight container in cool, dry place',
    },
    {
      header: 'Pantry: Shelf Life',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'Best before duration from manufacture.',
      format: 'Text string',
      example: '9 Months from manufacture',
    },
    {
      header: 'Pantry: FSSAI / Compliance',
      requirement: 'OPTIONAL',
      collection: 'Wholesome Pantry (food)',
      description: 'FSSAI License number or regulatory registration.',
      format: 'Text string / license number',
      example: 'FSSAI Lic. No. 22425540000677',
    },

    // Category Specific - Wellness Tea
    {
      header: 'Tea: Ingredients',
      requirement: 'RECOMMENDED',
      collection: 'Wellness Tea (tea)',
      description: 'Tea leaves, herbs, and botanicals list.',
      format: 'Text string',
      example: 'Whole Chamomile Blossoms, Himalayan Spearmint',
    },
    {
      header: 'Tea: Form',
      requirement: 'OPTIONAL',
      collection: 'Wellness Tea (tea)',
      description: 'Physical presentation of tea leaves.',
      format: 'Loose Leaf, Whole Flower & Leaf, Pyramid Bags',
      example: 'Whole Flower & Leaf',
    },
    {
      header: 'Tea: Caffeine Info',
      requirement: 'OPTIONAL',
      collection: 'Wellness Tea (tea)',
      description: 'Caffeine strength level.',
      format: 'Naturally Caffeine Free, Low, Medium, High',
      example: 'Naturally Caffeine Free',
    },
    {
      header: 'Tea: Brewing Temp (°C)',
      requirement: 'OPTIONAL',
      collection: 'Wellness Tea (tea)',
      description: 'Ideal water temperature for steeping.',
      format: 'Degrees Celsius (e.g. 85°C - 90°C)',
      example: '90°C',
    },
    {
      header: 'Tea: Brewing Time (mins)',
      requirement: 'OPTIONAL',
      collection: 'Wellness Tea (tea)',
      description: 'Recommended steeping duration.',
      format: 'Minutes (e.g. 4-5 mins)',
      example: '4-5 mins',
    },

    // Category Specific - Heritage Sarees
    {
      header: 'Sarees: Fabric',
      requirement: 'RECOMMENDED',
      collection: 'Heritage Sarees (sarees)',
      description: 'Specific silk or textile composition.',
      format: 'Text string',
      example: '100% Pure Mulberry Silk / Katan Silk',
    },
    {
      header: 'Sarees: Weave Type',
      requirement: 'OPTIONAL',
      collection: 'Heritage Sarees (sarees)',
      description: 'Traditional weaving technique.',
      format: 'Text string',
      example: 'Handloom Korvai Interlocking Weave',
    },
    {
      header: 'Sarees: Length (m)',
      requirement: 'OPTIONAL',
      collection: 'Heritage Sarees (sarees)',
      description: 'Full saree length in metres.',
      format: 'Length in metres',
      example: '6.3 m (including blouse piece)',
    },
    {
      header: 'Sarees: Blouse Piece Details',
      requirement: 'OPTIONAL',
      collection: 'Heritage Sarees (sarees)',
      description: 'Details on blouse fabric included with the saree.',
      format: 'Text string',
      example: 'Unstitched contrast silk blouse (80 cm)',
    },
    {
      header: 'Sarees: Care Instructions',
      requirement: 'OPTIONAL',
      collection: 'Heritage Sarees (sarees)',
      description: 'Washing and storage advice for fine silks.',
      format: 'Text string',
      example: 'Strictly Dry Clean Only. Store in muslin wrap.',
    },

    // Category Specific - Sterling Silver Jewellery
    {
      header: 'Jewellery: Type',
      requirement: 'RECOMMENDED',
      collection: 'Sterling Silver (jewellery)',
      description: 'Classification of jewellery item.',
      format: 'Ring, Necklace, Earrings, Bracelet, Cuff',
      example: 'Ring',
    },
    {
      header: 'Jewellery: Metal Type',
      requirement: 'RECOMMENDED',
      collection: 'Sterling Silver (jewellery)',
      description: 'Metal composition and hallmark grade.',
      format: 'Text string',
      example: '925 Sterling Silver',
    },
    {
      header: 'Jewellery: Gross Weight (g)',
      requirement: 'OPTIONAL',
      collection: 'Sterling Silver (jewellery)',
      description: 'Item weight in grams.',
      format: 'Grams (e.g. 5.8 g)',
      example: '5.8 g',
    },
    {
      header: 'Jewellery: Stone Details',
      requirement: 'OPTIONAL',
      collection: 'Sterling Silver (jewellery)',
      description: 'Natural or lab gemstones incorporated into the piece.',
      format: 'Text string',
      example: 'Natural Rainbow Moonstone',
    },
    {
      header: 'Jewellery: Hallmark Details',
      requirement: 'OPTIONAL',
      collection: 'Sterling Silver (jewellery)',
      description: 'Official hallmarking certification info.',
      format: 'Text string',
      example: 'BIS 925 Hallmarked',
    },
  ];

  fieldGuideEntries.forEach((entry) => {
    guideSheet.addRow(entry);
  });

  // ----------------------------------------------------
  // SHEET 6: COLLECTIONS & CATEGORIES (Reference List)
  // ----------------------------------------------------
  const collectionsSheet = workbook.addWorksheet('Collections & Categories', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  collectionsSheet.columns = [
    { header: 'Collection Code', key: 'code', width: 18 },
    { header: 'Collection Name', key: 'name', width: 24 },
    { header: 'Approved Category Codes', key: 'cats', width: 45 },
    { header: 'Category Display Names', key: 'catNames', width: 55 },
    { header: 'Collection Scope & Description', key: 'desc', width: 60 },
  ];

  const colHeaderRow = collectionsSheet.getRow(1);
  colHeaderRow.height = 28;
  colHeaderRow.eachCell((cell) => {
    cell.font = headerFontWhite;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = mandatoryHeaderFill;
  });

  Object.values(COLLECTION_INFO).forEach((col) => {
    collectionsSheet.addRow({
      code: col.id,
      name: col.name,
      cats: col.categories.join(', '),
      catNames: Object.values(col.categoryNames).join(', '),
      desc: col.description,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Validates a user-uploaded Excel workbook buffer before committing to the database.
 */
export async function validateProductImportWorkbook(buffer, options = {}) {
  const { mode = 'CREATE_NEW', selectedCollection = 'all' } = options;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const errors = [];
  const warnings = [];

  // 1. Verify required sheets
  const productsSheet = workbook.getWorksheet('Products');
  const inventorySheet = workbook.getWorksheet('Inventory');

  if (!productsSheet && mode !== 'INITIAL_INVENTORY') {
    errors.push({
      sheet: 'Workbook',
      row: 0,
      column: 'N/A',
      code: 'MISSING_PRODUCTS_SHEET',
      message: 'The workbook is missing the required "Products" worksheet.',
    });
    return {
      valid: false,
      templateVersion: 'UNKNOWN',
      summary: { totalProducts: 0, validProducts: 0, invalidProducts: 0, errorsCount: errors.length, warningsCount: 0 },
      parsedProducts: [],
      parsedVariants: [],
      parsedInventory: [],
      errors,
      warnings,
    };
  }

  // 2. Read template version if Start Here or Read Me exists
  let templateVersion = TEMPLATE_VERSION;
  const startHereSheet = workbook.getWorksheet('Start Here') || workbook.getWorksheet('Read Me');
  if (startHereSheet) {
    try {
      const vCell = startHereSheet.getCell('B2').value || startHereSheet.getCell('B3').value;
      if (vCell) templateVersion = String(vCell).trim();
    } catch {
      // Non-blocking
    }
  }

  // Fetch existing collections from DB
  const dbCollections = await prisma.collection.findMany({
    select: { id: true, name: true, slug: true },
  });
  const validCollectionIds = new Set(dbCollections.map((c) => c.id));

  // Fetch all existing product sourceIds, slugs, and variant SKUs for conflict detection
  const [existingProducts, existingVariants] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, sourceId: true, slug: true, collectionId: true, name: true, price: true, stockQuantity: true, sku: true },
    }),
    prisma.productVariant.findMany({
      select: { id: true, sku: true, productId: true, name: true },
    }),
  ]);

  const existingSourceIdMap = new Map();
  const existingSlugCollectionMap = new Map(); // key: `${collectionId}::${slug}`
  const existingSkuMap = new Map();

  existingProducts.forEach((p) => {
    existingSourceIdMap.set(p.sourceId.toLowerCase(), p);
    existingSlugCollectionMap.set(`${p.collectionId}::${p.slug.toLowerCase()}`, p);
    if (p.sku) existingSkuMap.set(p.sku.toLowerCase(), { type: 'Product', id: p.id, name: p.name });
  });

  existingVariants.forEach((v) => {
    if (v.sku) existingSkuMap.set(v.sku.toLowerCase(), { type: 'Variant', id: v.id, name: v.name });
  });

  // Track in-sheet uniqueness
  const seenSourceIdsInSheet = new Set();
  const seenSlugsInSheet = new Set();
  const seenSkusInSheet = new Set();
  const parsedProducts = [];

  if (productsSheet) {
    // Dynamic Header Detection
    const { headerRowNumber, headerMap, rawHeaderMap } = findHeaderRow(productsSheet, [
      'collection code',
      'product code',
      'product name',
    ]);

    // Check critical mandatory columns using normalized names
    const mandatoryKeys = [
      { key: 'collection code', label: 'Collection Code *' },
      { key: 'product code', label: 'Product Code *' },
      { key: 'product name', label: 'Product Name *' },
      { key: 'category code', label: 'Category Code *' },
      { key: 'description', label: 'Description *' },
      { key: 'primary image url', label: 'Primary Image URL *' },
    ];

    for (const m of mandatoryKeys) {
      if (!headerMap.has(m.key)) {
        errors.push({
          sheet: 'Products',
          row: headerRowNumber,
          column: m.label,
          code: 'MISSING_REQUIRED_COLUMN',
          message: `Mandatory column "${m.label}" was not found in the Products header row.`,
        });
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        templateVersion,
        summary: { totalProducts: 0, validProducts: 0, invalidProducts: 0, errorsCount: errors.length, warningsCount: 0 },
        parsedProducts: [],
        parsedVariants: [],
        parsedInventory: [],
        errors,
        warnings,
      };
    }

    const rowCount = productsSheet.rowCount;
    for (let r = headerRowNumber + 1; r <= rowCount; r++) {
      const row = productsSheet.getRow(r);
      let hasAnyData = false;
      row.eachCell(() => {
        hasAnyData = true;
      });
      if (!hasAnyData) continue;

      const collectionId = getCellByNormalized(row, headerMap, 'collection code', 'collectionid').toLowerCase();
      const sourceId = getCellByNormalized(row, headerMap, 'product code', 'sourceid');
      const name = getCellByNormalized(row, headerMap, 'product name', 'name');
      let slug = getCellByNormalized(row, headerMap, 'slug', 'slug auto-generated if blank');
      const category = getCellByNormalized(row, headerMap, 'category code', 'category');
      const categoryName = getCellByNormalized(row, headerMap, 'category name');
      const tagline = getCellByNormalized(row, headerMap, 'tagline');
      const description = getCellByNormalized(row, headerMap, 'description');
      const image = getCellByNormalized(row, headerMap, 'primary image url', 'image');
      const galleryRaw = getCellByNormalized(row, headerMap, 'gallery image urls', 'gallery');
      const packSize = getCellByNormalized(row, headerMap, 'pack size / weight', 'pack size', 'packsize');
      const priceVal = getNumericByNormalized(row, headerMap, 'selling price inr', 'selling price', 'price');
      const origPriceVal = getNumericByNormalized(row, headerMap, 'mrp / compare price inr', 'original price / mrp inr', 'compare price');
      const discount = getCellByNormalized(row, headerMap, 'discount label', 'discount');
      const skuRaw = getCellByNormalized(row, headerMap, 'sku (auto-generated if blank)', 'sku', 'product sku');
      const hsnCodeRaw = getCellByNormalized(row, headerMap, 'hsn code *', 'hsn code', 'hsn', 'hsn/sac code');
      const gstRateVal = getNumericByNormalized(row, headerMap, 'gst rate % *', 'gst rate %', 'gst rate', 'gst %');
      const isTaxInclusiveRaw = getCellByNormalized(row, headerMap, 'tax inclusive (yes/no)', 'tax inclusive', 'is tax inclusive').toLowerCase();
      const cessRateVal = getNumericByNormalized(row, headerMap, 'gst cess rate %', 'cess rate', 'cess %');
      const taxClassification = getCellByNormalized(row, headerMap, 'tax classification') || 'GOODS';
      const taxVerificationStatusRaw = getCellByNormalized(row, headerMap, 'tax verification status', 'tax verification', 'tax status', 'verification status');
      const taxTreatmentRaw = getCellByNormalized(row, headerMap, 'tax treatment', 'tax treatment type');
      const taxNotes = getCellByNormalized(row, headerMap, 'tax notes', 'tax comments', 'tax note');
      const statusRaw = getCellByNormalized(row, headerMap, 'publication status', 'status').toLowerCase();
      const inStockRaw = getCellByNormalized(row, headerMap, 'in stock').toLowerCase();
      const stockQtyVal = getNumericByNormalized(row, headerMap, 'stock quantity');
      const thresholdVal = getNumericByNormalized(row, headerMap, 'low stock threshold');
      const featuredRaw = getCellByNormalized(row, headerMap, 'featured').toLowerCase();
      const badge = getCellByNormalized(row, headerMap, 'badge');
      const tagsRaw = getCellByNormalized(row, headerMap, 'tags');

      // 1. Validate Collection
      if (!collectionId) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Collection Code *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Collection Code is required (e.g. food, tea, sarees, jewellery).',
        });
      } else if (!validCollectionIds.has(collectionId)) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Collection Code *',
          code: 'INVALID_COLLECTION',
          message: `Collection "${collectionId}" does not exist. Permitted: ${Array.from(validCollectionIds).join(', ')}.`,
        });
      } else if (selectedCollection !== 'all' && collectionId !== selectedCollection) {
        warnings.push({
          sheet: 'Products',
          row: r,
          column: 'Collection Code *',
          code: 'COLLECTION_MISMATCH',
          message: `Product belongs to "${collectionId}", but import filter is set to "${selectedCollection}".`,
        });
      }

      // 2. Validate Product Code
      if (!sourceId) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Product Code *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product Code is required for unique identification.',
        });
      } else {
        const lowerSourceId = sourceId.toLowerCase();
        if (seenSourceIdsInSheet.has(lowerSourceId)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Product Code *',
            code: 'DUPLICATE_IN_WORKBOOK',
            message: `Product Code "${sourceId}" is duplicated within this workbook.`,
          });
        } else {
          seenSourceIdsInSheet.add(lowerSourceId);
        }

        if (mode === 'CREATE_NEW' && existingSourceIdMap.has(lowerSourceId)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Product Code *',
            code: 'PRODUCT_ALREADY_EXISTS',
            message: `Product Code "${sourceId}" already exists in database. In "Create New" mode, existing products cannot be overwritten.`,
          });
        } else if (mode === 'UPDATE_EXISTING' && !existingSourceIdMap.has(lowerSourceId)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Product Code *',
            code: 'PRODUCT_NOT_FOUND',
            message: `Product Code "${sourceId}" was not found in database to update.`,
          });
        }
      }

      // 3. Validate Name & Auto-Generate Slug if Blank
      if (!name) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Product Name *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product Name is required.',
        });
      } else {
        if (!slug) {
          slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        } else {
          slug = slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }

        const slugKey = `${collectionId}::${slug}`;
        if (seenSlugsInSheet.has(slugKey)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Slug',
            code: 'DUPLICATE_SLUG_IN_WORKBOOK',
            message: `Slug "${slug}" is duplicated within collection "${collectionId}" in this workbook.`,
          });
        } else {
          seenSlugsInSheet.add(slugKey);
        }

        if (mode === 'CREATE_NEW' && existingSlugCollectionMap.has(slugKey)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Slug',
            code: 'SLUG_ALREADY_EXISTS',
            message: `Slug "${slug}" already exists in collection "${collectionId}". Please specify a distinct slug.`,
          });
        }
      }

      // 4. Validate Category Code Against Collection
      const allowedCategories = COLLECTION_INFO[collectionId]?.categories || [];
      if (!category) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Category Code *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: `Category Code is required. Valid categories for "${collectionId}": ${allowedCategories.join(', ')}.`,
        });
      } else if (allowedCategories.length > 0 && !allowedCategories.includes(category.toLowerCase())) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Category Code *',
          code: 'INVALID_CATEGORY',
          message: `Category Code "${category}" is not valid for collection "${collectionId}". Allowed: ${allowedCategories.join(', ')}.`,
        });
      }

      // 5. Validate Description
      if (!description) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Description *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product description is required.',
        });
      }

      // 6. Validate Image URL (Reject Local Paths)
      if (!image) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Primary Image URL *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Primary Image URL is required to display the product on the storefront.',
        });
      } else if (/^[a-zA-Z]:\\|^file:\/\//i.test(image)) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Primary Image URL *',
          code: 'LOCAL_IMAGE_PATH_INVALID',
          message: `Local file path "${image}" cannot be accessed by the server. Please provide an HTTPS image URL or upload the file in Admin Panel to get an /uploads/ path.`,
        });
      } else if (!image.startsWith('/') && !image.startsWith('http://') && !image.startsWith('https://')) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Primary Image URL *',
          code: 'INVALID_IMAGE_URL',
          message: `Primary image URL "${image}" must start with https://, http://, or a server path like /images/... or /uploads/...`,
        });
      }

      // 7. Validate Numeric Prices
      if (priceVal === 'INVALID') {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Selling Price (INR)',
          code: 'INVALID_NUMERIC',
          message: 'Selling Price must be a valid number or left blank.',
        });
      } else if (priceVal !== null && priceVal < 0) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Selling Price (INR)',
          code: 'NEGATIVE_PRICE',
          message: 'Selling Price cannot be negative.',
        });
      }

      if (origPriceVal === 'INVALID') {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'MRP / Compare Price (INR)',
          code: 'INVALID_NUMERIC',
          message: 'Compare Price must be a valid number or left blank.',
        });
      } else if (origPriceVal !== null && origPriceVal < 0) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'MRP / Compare Price (INR)',
          code: 'NEGATIVE_PRICE',
          message: 'Compare Price cannot be negative.',
        });
      }

      // Publication status
      const wantsPublish = statusRaw === 'published' || statusRaw === 'active' || statusRaw === 'live';

      // 7.1 Validate SKU (if provided)
      let parsedSku = null;
      if (skuRaw) {
        if (!isValidSkuFormat(skuRaw)) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'SKU (Auto-generated if blank)',
            code: 'INVALID_SKU_FORMAT',
            message: `SKU "${skuRaw}" is invalid. Must be 3-40 alphanumeric characters, hyphens or underscores.`,
          });
        } else {
          const lowerSku = skuRaw.toLowerCase();
          if (seenSkusInSheet.has(lowerSku)) {
            errors.push({
              sheet: 'Products',
              row: r,
              column: 'SKU (Auto-generated if blank)',
              code: 'DUPLICATE_SKU_IN_WORKBOOK',
              message: `SKU "${skuRaw}" is duplicated within this workbook.`,
            });
          } else {
            seenSkusInSheet.add(lowerSku);
            parsedSku = skuRaw.toUpperCase();
          }

          if (mode === 'CREATE_NEW' && existingSkuMap.has(lowerSku)) {
            errors.push({
              sheet: 'Products',
              row: r,
              column: 'SKU (Auto-generated if blank)',
              code: 'SKU_ALREADY_EXISTS',
              message: `SKU "${skuRaw}" already exists in the database.`,
            });
          }
        }
      }

      // 7.2 Validate HSN Code
      let parsedHsn = null;
      if (hsnCodeRaw) {
        const hsnCheck = validateHsnCode(hsnCodeRaw);
        if (!hsnCheck.isValid) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'HSN Code *',
            code: 'INVALID_HSN_FORMAT',
            message: hsnCheck.message,
          });
        } else {
          parsedHsn = hsnCheck.cleanHsn;
        }
      }

      // 7.3 Validate GST Rate
      let parsedGstRate = null;
      if (gstRateVal !== null && gstRateVal !== '') {
        if (gstRateVal === 'INVALID') {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'GST Rate % *',
            code: 'INVALID_NUMERIC',
            message: 'GST Rate must be a valid number.',
          });
        } else {
          const gstCheck = validateGstRate(gstRateVal);
          if (!gstCheck.isValid) {
            errors.push({
              sheet: 'Products',
              row: r,
              column: 'GST Rate % *',
              code: 'INVALID_GST_RATE',
              message: gstCheck.message,
            });
          } else {
            parsedGstRate = gstCheck.rate;
          }
        }
      }

      // 7.4 Validate Cess Rate
      let parsedCessRate = 0;
      if (cessRateVal !== null && cessRateVal !== '') {
        if (cessRateVal === 'INVALID' || cessRateVal < 0) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'GST Cess Rate %',
            code: 'INVALID_CESS_RATE',
            message: 'GST Cess Rate must be a non-negative number.',
          });
        } else {
          parsedCessRate = cessRateVal;
        }
      }

      // 7.4.1 Validate Tax Inclusive
      let parsedIsTaxInclusive = true;
      if (isTaxInclusiveRaw) {
        if (['yes', 'true', '1', 'y', 'inclusive'].includes(isTaxInclusiveRaw)) {
          parsedIsTaxInclusive = true;
        } else if (['no', 'false', '0', 'n', 'exclusive'].includes(isTaxInclusiveRaw)) {
          parsedIsTaxInclusive = false;
        } else {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Tax Inclusive (Yes/No)',
            code: 'INVALID_TAX_INCLUSIVE',
            message: `Tax Inclusive value "${isTaxInclusiveRaw}" is invalid. Expected "Yes" or "No".`,
          });
        }
      }

      // 7.4.2 Validate Tax Treatment
      let parsedTaxTreatment = 'TAXABLE';
      if (taxTreatmentRaw) {
        const normTreatment = taxTreatmentRaw.toUpperCase();
        if (['TAXABLE', 'NIL_RATED', 'EXEMPT', 'NON_GST'].includes(normTreatment)) {
          parsedTaxTreatment = normTreatment;
        } else {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Tax Treatment',
            code: 'INVALID_TAX_TREATMENT',
            message: `Tax Treatment "${taxTreatmentRaw}" is invalid. Permitted: TAXABLE, NIL_RATED, EXEMPT, NON_GST.`,
          });
        }
      }

      // 7.4.3 Validate Tax Verification Status without silently guessing
      let parsedTaxVerificationStatus = 'PENDING_VERIFICATION';
      if (taxVerificationStatusRaw) {
        const normStatus = taxVerificationStatusRaw.toUpperCase().replace(/\s+/g, '_');
        if (['VERIFIED', 'PENDING_VERIFICATION', 'EXEMPT', 'UNCLASSIFIED'].includes(normStatus)) {
          parsedTaxVerificationStatus = normStatus;
        } else {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Tax Verification Status',
            code: 'INVALID_TAX_VERIFICATION_STATUS',
            message: `Tax Verification Status "${taxVerificationStatusRaw}" is invalid. Permitted: VERIFIED, PENDING_VERIFICATION, EXEMPT, UNCLASSIFIED.`,
          });
        }
      }

      if (parsedTaxVerificationStatus === 'VERIFIED') {
        if (!parsedHsn || parsedGstRate === null) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Tax Verification Status',
            code: 'CANNOT_VERIFY_WITHOUT_TAX_DETAILS',
            message: 'Product cannot be marked as VERIFIED when HSN Code or GST Rate is missing or invalid.',
          });
        }
      }

      // 7.5 Tax Compliance Publication Safeguard:
      // If product lacks required HSN/GST, safeguard statutory compliance by falling back to Draft status
      let isTaxCompliant = Boolean(parsedHsn && parsedGstRate !== null);
      let effectivelyActive = wantsPublish;
      if (wantsPublish && !isTaxCompliant) {
        effectivelyActive = false;
        warnings.push({
          sheet: 'Products',
          row: r,
          column: 'Publication Status',
          code: 'TAX_COMPLIANCE_DRAFT_FALLBACK',
          message: 'Product lacks valid HSN Code and/or GST Rate. To ensure statutory GST compliance, publication status has been defaulted to Draft.',
        });
      }

      // 8. Validate Stock Quantity
      let parsedStockQty = 50;
      if (stockQtyVal === 'INVALID') {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Stock Quantity',
          code: 'INVALID_NUMERIC',
          message: 'Stock Quantity must be an integer.',
        });
      } else if (stockQtyVal !== null) {
        if (stockQtyVal < 0) {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Stock Quantity',
            code: 'NEGATIVE_STOCK',
            message: 'Stock Quantity cannot be negative.',
          });
        } else {
          parsedStockQty = Math.floor(stockQtyVal);
        }
      }

      let parsedThreshold = 5;
      if (thresholdVal === 'INVALID') {
        warnings.push({
          sheet: 'Products',
          row: r,
          column: 'Low Stock Threshold',
          code: 'INVALID_NUMERIC',
          message: 'Low Stock Threshold was not a valid number; using default threshold of 5.',
        });
      } else if (thresholdVal !== null && thresholdVal >= 0) {
        parsedThreshold = Math.floor(thresholdVal);
      }

      // 9. Collect Category-Specific Specs & Pack Size
      const specs = {};
      let finalPackSize = packSize ? String(packSize).trim() : null;

      if (collectionId === 'food') {
        const ing = getCellByNormalized(row, headerMap, 'pantry: ingredients', 'pantry ingredients');
        const allg = getCellByNormalized(row, headerMap, 'pantry: allergens', 'pantry allergens');
        const diet = getCellByNormalized(row, headerMap, 'pantry: dietary details', 'pantry dietary');
        const packW = getCellByNormalized(row, headerMap, 'pantry: pack weight / size', 'pantry pack weight');
        const serv = getCellByNormalized(row, headerMap, 'pantry: servings', 'pantry servings');
        const prep = getCellByNormalized(row, headerMap, 'pantry: preparation instructions', 'pantry prep');
        const stor = getCellByNormalized(row, headerMap, 'pantry: storage instructions', 'pantry storage');
        const life = getCellByNormalized(row, headerMap, 'pantry: shelf life', 'pantry shelf life');
        const comp = getCellByNormalized(row, headerMap, 'pantry: fssai / compliance', 'pantry fssai compliance');

        if (ing) specs.ingredients = ing;
        if (allg) specs.allergens = allg;
        if (diet) specs.dietary = diet;
        if (packW) specs.packWeight = packW;
        if (serv) specs.servings = serv;
        if (prep) specs.preparation = prep;
        if (stor) specs.storage = stor;
        if (life) specs.shelfLife = life;
        if (comp) specs.compliance = comp;

        if (!ing) {
          warnings.push({
            sheet: 'Products',
            row: r,
            column: 'Pantry: Ingredients',
            code: 'MISSING_FOOD_INGREDIENTS',
            message: 'Listing food ingredients is strongly recommended for Indian food compliance.',
          });
        }
      } else if (collectionId === 'tea') {
        const ing = getCellByNormalized(row, headerMap, 'tea: ingredients', 'tea ingredients');
        const typ = getCellByNormalized(row, headerMap, 'tea: type', 'tea type');
        const form = getCellByNormalized(row, headerMap, 'tea: form', 'tea form');
        const caff = getCellByNormalized(row, headerMap, 'tea: caffeine info', 'tea caffeine');
        const temp = getCellByNormalized(row, headerMap, 'tea: brewing temp °c', 'tea brewing temp');
        const time = getCellByNormalized(row, headerMap, 'tea: brewing time mins', 'tea brewing time');
        const serv = getCellByNormalized(row, headerMap, 'tea: serving size', 'tea serving');
        const harv = getCellByNormalized(row, headerMap, 'tea: harvest season', 'tea harvest');
        const stor = getCellByNormalized(row, headerMap, 'tea: storage instructions', 'tea storage');
        const disc = getCellByNormalized(row, headerMap, 'tea: disclaimer', 'tea disclaimer');

        if (ing) specs.ingredients = ing;
        if (typ) specs.teaType = typ;
        if (form) specs.teaForm = form;
        if (caff) specs.caffeineLevel = caff;
        if (temp) specs.brewingTemp = temp;
        if (time) specs.steepTime = time;
        if (serv) specs.servingSize = serv;
        if (harv) specs.harvestSeason = harv;
        if (stor) specs.storage = stor;
        if (disc) specs.disclaimer = disc;

        // Validate Pack Size / Weight for Wellness Tea
        if (!finalPackSize) {
          finalPackSize = '25 g';
        } else {
          const match = finalPackSize.match(/^(\d+(?:\.\d+)?)\s*(?:g|gm|grams?|kg)?$/i);
          let num = null;
          if (match) {
            num = parseFloat(match[1]);
            if (/kg/i.test(finalPackSize)) num = num * 1000;
          }
          if (!match || isNaN(num) || num <= 0 || num > 5000) {
            errors.push({
              sheet: 'Products',
              row: r,
              column: 'Pack Size / Weight',
              code: 'INVALID_TEA_WEIGHT',
              message: `Invalid tea pack weight "${packSize}". Wellness Tea weight must be a positive number in grams (e.g. 25 g).`,
            });
          } else {
            const formattedNum = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
            finalPackSize = `${formattedNum} g`;
          }
        }
      } else if (collectionId === 'sarees') {
        const fab = getCellByNormalized(row, headerMap, 'sarees: fabric', 'sarees fabric');
        const wea = getCellByNormalized(row, headerMap, 'sarees: weave type', 'sarees weave');
        const len = getCellByNormalized(row, headerMap, 'sarees: length m', 'sarees length');
        const blo = getCellByNormalized(row, headerMap, 'sarees: blouse piece details', 'sarees blouse');
        const col = getCellByNormalized(row, headerMap, 'sarees: primary colour', 'sarees color');
        const bor = getCellByNormalized(row, headerMap, 'sarees: border details', 'sarees border');
        const occ = getCellByNormalized(row, headerMap, 'sarees: occasion', 'sarees occasion');
        const car = getCellByNormalized(row, headerMap, 'sarees: care instructions', 'sarees care');
        const aut = getCellByNormalized(row, headerMap, 'sarees: authenticity / mark', 'sarees authenticity');

        if (fab) specs.fabric = fab;
        if (wea) specs.weave = wea;
        if (len) specs.sareeLength = len;
        if (blo) specs.blousePiece = blo;
        if (col) specs.primaryColor = col;
        if (bor) specs.borderDetails = bor;
        if (occ) specs.occasion = occ;
        if (car) specs.careInstructions = car;
        if (aut) specs.authenticity = aut;
      } else if (collectionId === 'jewellery') {
        const typ = getCellByNormalized(row, headerMap, 'jewellery: type', 'jewellery type');
        const met = getCellByNormalized(row, headerMap, 'jewellery: metal type', 'jewellery metal');
        const pur = getCellByNormalized(row, headerMap, 'jewellery: verified purity', 'jewellery purity');
        const wei = getCellByNormalized(row, headerMap, 'jewellery: gross weight g', 'jewellery weight');
        const sto = getCellByNormalized(row, headerMap, 'jewellery: stone details', 'jewellery stone');
        const fin = getCellByNormalized(row, headerMap, 'jewellery: plating / finish', 'jewellery plating');
        const siz = getCellByNormalized(row, headerMap, 'jewellery: size', 'jewellery standard size');
        const hal = getCellByNormalized(row, headerMap, 'jewellery: hallmark details', 'jewellery hallmark');
        const car = getCellByNormalized(row, headerMap, 'jewellery: care instructions', 'jewellery care');

        if (typ) specs.jewelleryType = typ;
        if (met) specs.metal = met;
        if (pur) specs.purity = pur;
        if (wei) specs.weight = wei;
        if (sto) specs.gemstone = sto;
        if (fin) specs.plating = fin;
        if (siz) specs.standardSize = siz;
        if (hal) specs.hallmark = hal;
        if (car) specs.careInstructions = car;
      }

      // 10. Parse Custom Specs JSON if provided
      const customJsonRaw = getCellByNormalized(row, headerMap, 'custom specs json');
      if (customJsonRaw) {
        try {
          const parsedCustom = JSON.parse(customJsonRaw);
          if (typeof parsedCustom === 'object' && parsedCustom !== null) {
            Object.assign(specs, parsedCustom);
          }
        } catch {
          errors.push({
            sheet: 'Products',
            row: r,
            column: 'Custom Specs JSON',
            code: 'MALFORMED_JSON',
            message: 'Custom Specs JSON is not valid JSON.',
          });
        }
      }

      // Parse Gallery URLs
      let gallery = [];
      if (galleryRaw) {
        gallery = galleryRaw
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean);
      }

      parsedProducts.push({
        rowNumber: r,
        collectionId,
        sourceId,
        name,
        slug,
        category,
        categoryName: categoryName || category,
        tagline: tagline || null,
        description,
        image,
        gallery,
        packSize: finalPackSize || null,
        price: priceVal !== 'INVALID' ? priceVal : null,
        originalPrice: origPriceVal !== 'INVALID' ? origPriceVal : null,
        discount: discount || null,
        isActive: effectivelyActive,
        wantsPublish,
        taxCompliant: isTaxCompliant,
        inStock: inStockRaw === 'no' || inStockRaw === 'false' ? false : parsedStockQty > 0,
        stockQuantity: parsedStockQty,
        lowStockThreshold: parsedThreshold,
        isFeatured: featuredRaw === 'yes' || featuredRaw === 'true',
        badge: badge || null,
        specs,
        sku: parsedSku,
        hsnCode: parsedHsn,
        gstRate: parsedGstRate,
        isTaxInclusive: parsedIsTaxInclusive,
        cessRate: parsedCessRate,
        taxClassification: String(taxClassification || 'GOODS').trim().toUpperCase(),
        taxTreatment: parsedTaxTreatment,
        taxVerificationStatus: parsedTaxVerificationStatus,
        taxNotes: taxNotes || null,
        variants: [],
      });
    }
  }

  // ----------------------------------------------------
  // Parse Variants Worksheet (if present)
  // ----------------------------------------------------
  const parsedVariants = [];
  const variantsSheet = workbook.getWorksheet('Variants');
  const seenVariantSkus = new Set();

  if (variantsSheet) {
    const { headerRowNumber, headerMap } = findHeaderRow(variantsSheet, [
      'product code',
      'variant name',
      'variant sku',
    ]);

    const vRowCount = variantsSheet.rowCount;
    for (let r = headerRowNumber + 1; r <= vRowCount; r++) {
      const row = variantsSheet.getRow(r);
      let hasData = false;
      row.eachCell(() => {
        hasData = true;
      });
      if (!hasData) continue;

      const productCode = getCellByNormalized(row, headerMap, 'product code');
      const variantName = getCellByNormalized(row, headerMap, 'variant name');
      const sku = getCellByNormalized(row, headerMap, 'variant sku', 'sku');
      const type = getCellByNormalized(row, headerMap, 'variant type', 'type') || 'custom';
      const optionVal = getCellByNormalized(row, headerMap, 'option value');
      const priceVal = getNumericByNormalized(row, headerMap, 'selling price inr', 'selling price', 'price');
      const stockVal = getNumericByNormalized(row, headerMap, 'stock quantity');
      const threshVal = getNumericByNormalized(row, headerMap, 'low stock threshold');
      const inStockRaw = getCellByNormalized(row, headerMap, 'in stock').toLowerCase();
      const attrsJsonRaw = getCellByNormalized(row, headerMap, 'variant attributes json');

      if (!productCode) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Product Code *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product Code is required to link variant to its parent product.',
        });
      } else {
        const matchesInSheet = parsedProducts.find((p) => p.sourceId.toLowerCase() === productCode.toLowerCase());
        const existsInDb = existingSourceIdMap.has(productCode.toLowerCase());
        if (!matchesInSheet && !existsInDb) {
          errors.push({
            sheet: 'Variants',
            row: r,
            column: 'Product Code *',
            code: 'PARENT_PRODUCT_NOT_FOUND',
            message: `Parent product "${productCode}" was not found in the Products sheet or database.`,
          });
        }
      }

      if (!variantName) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Variant Name *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Variant Name is required (e.g. Royal Wine, US 7).',
        });
      }

      if (!sku) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Variant SKU *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Variant SKU is required and must be unique.',
        });
      } else {
        const lowerSku = sku.toLowerCase();
        if (seenVariantSkus.has(lowerSku)) {
          errors.push({
            sheet: 'Variants',
            row: r,
            column: 'Variant SKU *',
            code: 'DUPLICATE_SKU_IN_WORKBOOK',
            message: `Variant SKU "${sku}" is duplicated within this workbook.`,
          });
        } else {
          seenVariantSkus.add(lowerSku);
        }

        if (mode === 'CREATE_NEW' && existingSkuMap.has(lowerSku)) {
          errors.push({
            sheet: 'Variants',
            row: r,
            column: 'Variant SKU *',
            code: 'SKU_ALREADY_EXISTS',
            message: `SKU "${sku}" already exists in the database.`,
          });
        }
      }

      let parsedAttrs = { type, optionValue: optionVal };
      if (attrsJsonRaw) {
        try {
          const parsed = JSON.parse(attrsJsonRaw);
          if (typeof parsed === 'object' && parsed !== null) {
            parsedAttrs = { ...parsedAttrs, ...parsed };
          }
        } catch {
          errors.push({
            sheet: 'Variants',
            row: r,
            column: 'Variant Attributes JSON',
            code: 'MALFORMED_JSON',
            message: 'Variant Attributes JSON is not valid JSON.',
          });
        }
      }

      const variantRecord = {
        rowNumber: r,
        productCode,
        variantName,
        sku,
        type,
        optionValue: optionVal,
        price: priceVal !== 'INVALID' ? priceVal : null,
        stockQuantity: stockVal !== null && stockVal !== 'INVALID' ? Math.max(0, Math.floor(stockVal)) : 25,
        lowStockThreshold: threshVal !== null && threshVal !== 'INVALID' ? Math.max(0, Math.floor(threshVal)) : 5,
        inStock: inStockRaw === 'no' || inStockRaw === 'false' ? false : true,
        attributes: parsedAttrs,
      };

      parsedVariants.push(variantRecord);

      // Link to parent in parsedProducts
      const parent = parsedProducts.find((p) => p.sourceId.toLowerCase() === productCode.toLowerCase());
      if (parent) {
        parent.variants.push(variantRecord);
      }
    }
  }

  // Publication pricing check: verify unpriced products cannot be published
  for (const prod of parsedProducts) {
    if (prod.wantsPublish) {
      const hasBasePrice = prod.price !== null && prod.price > 0;
      const hasVariantPrice = prod.variants.some((v) => v.price !== null && v.price > 0);
      if (!hasBasePrice && !hasVariantPrice) {
        errors.push({
          sheet: 'Products',
          row: prod.rowNumber,
          column: 'Publication Status',
          code: 'UNPRICED_CANNOT_BE_PUBLISHED',
          message: 'Unpriced products cannot be published directly. Provide an approved selling price (on Products or Variants sheet) or set Publication Status to "Draft".',
        });
      }
    }
  }

  // ----------------------------------------------------
  // Parse Inventory Worksheet (if present)
  // ----------------------------------------------------
  const parsedInventory = [];
  if (inventorySheet) {
    const { headerRowNumber, headerMap } = findHeaderRow(inventorySheet, [
      'product code',
      'new stock quantity',
      'adjustment reason',
    ]);

    const iRowCount = inventorySheet.rowCount;
    for (let r = headerRowNumber + 1; r <= iRowCount; r++) {
      const row = inventorySheet.getRow(r);
      let hasData = false;
      row.eachCell(() => {
        hasData = true;
      });
      if (!hasData) continue;

      const productCode = getCellByNormalized(row, headerMap, 'product code');
      const sku = getCellByNormalized(row, headerMap, 'variant sku', 'sku');
      const newStockRaw = getCellByNormalized(row, headerMap, 'new stock quantity', 'new stock');
      const threshRaw = getCellByNormalized(row, headerMap, 'low stock threshold');
      const reason = getCellByNormalized(row, headerMap, 'adjustment reason', 'reason');

      if (!productCode) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'Product Code *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product Code is required for inventory adjustment.',
        });
      }

      const stockNum = Number(newStockRaw);
      if (isNaN(stockNum) || stockNum < 0) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'New Stock Quantity *',
          code: 'INVALID_STOCK_QTY',
          message: 'New Stock Quantity must be a non-negative integer.',
        });
      }

      if (!reason) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'Adjustment Reason *',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'An audit reason note is strictly required for stock updates.',
        });
      }

      parsedInventory.push({
        rowNumber: r,
        productCode,
        sku: sku || null,
        newStock: Math.max(0, Math.floor(stockNum)),
        threshold: threshRaw ? Math.max(0, parseInt(threshRaw, 10)) : undefined,
        reason: reason || 'Bulk inventory adjustment',
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    templateVersion,
    summary: {
      totalProducts: parsedProducts.length,
      validProducts: isValid ? parsedProducts.length : parsedProducts.length - errors.length,
      invalidProducts: isValid ? 0 : errors.length,
      totalVariants: parsedVariants.length,
      totalInventoryRows: parsedInventory.length,
      errorsCount: errors.length,
      warningsCount: warnings.length,
    },
    parsedProducts,
    parsedVariants,
    parsedInventory,
    errors,
    warnings,
  };
}

/**
 * Commits validated workbook items to the database within a safe Prisma transaction.
 */
export async function executeProductImport(validationResult, options = {}, adminUser = null) {
  const { mode = 'CREATE_NEW' } = options;
  const { parsedProducts = [], parsedVariants = [], parsedInventory = [] } = validationResult;

  if (!validationResult.valid && (!parsedProducts.length && !parsedInventory.length)) {
    throw new Error('Cannot execute import on an unvalidated or invalid workbook.');
  }

  const adminEmail = adminUser?.email || 'admin@amoga.com';
  let validAdminId = null;
  if (adminUser?.id) {
    const adminRec = await prisma.adminUser.findUnique({
      where: { id: adminUser.id },
      select: { id: true },
    });
    if (adminRec) validAdminId = adminRec.id;
  }
  if (!validAdminId && adminUser?.email) {
    const adminRec = await prisma.adminUser.findUnique({
      where: { email: adminUser.email },
      select: { id: true },
    });
    if (adminRec) validAdminId = adminRec.id;
  }

  const result = await prisma.$transaction(
    async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let createdVariantsCount = 0;
      let inventoryAdjustmentsCount = 0;
      const importedProductIds = [];

      // ----------------------------------------------------
      // MODE 1 & 2: CREATE_NEW or UPDATE_EXISTING
      // ----------------------------------------------------
      if (mode === 'CREATE_NEW' || mode === 'UPDATE_EXISTING') {
        for (const prod of parsedProducts) {
          const lowerSourceId = prod.sourceId.toLowerCase();
          const existing = await tx.product.findUnique({
            where: { sourceId: lowerSourceId },
            include: { variants: true },
          });

          if (mode === 'CREATE_NEW') {
            if (existing) {
              throw new Error(`Product Code "${prod.sourceId}" already exists in the database.`);
            }

            const finalProdSku = prod.sku || (await generateProductSku(prod.collectionId, prod.category, tx));

            const created = await tx.product.create({
              data: {
                sourceId: lowerSourceId,
                collectionId: prod.collectionId,
                name: prod.name,
                slug: prod.slug,
                category: prod.category,
                categoryName: prod.categoryName,
                tagline: prod.tagline,
                description: prod.description,
                image: prod.image,
                gallery: prod.gallery,
                packSize: prod.packSize,
                price: prod.price !== null ? prod.price : null,
                originalPrice: null,
                discount: null,
                isActive: Boolean(prod.isActive),
                inStock: Boolean(prod.inStock),
                stockQuantity: prod.stockQuantity,
                lowStockThreshold: prod.lowStockThreshold,
                isFeatured: Boolean(prod.isFeatured),
                badge: prod.badge,
                specs: prod.specs,
                verified: true,
                sku: finalProdSku,
                hsnCode: prod.hsnCode,
                gstRate: prod.gstRate !== null ? Number(prod.gstRate) : null,
                isTaxInclusive: Boolean(prod.isTaxInclusive),
                cessRate: Number(prod.cessRate || 0),
                taxClassification: prod.taxClassification || 'GOODS',
                taxTreatment: prod.taxTreatment || 'TAXABLE',
                taxVerificationStatus: prod.taxVerificationStatus || 'PENDING_VERIFICATION',
                taxConfirmedBy: prod.taxVerificationStatus === 'VERIFIED' ? adminEmail : null,
                taxConfirmedAt: prod.taxVerificationStatus === 'VERIFIED' ? new Date() : null,
                taxNotes: prod.taxNotes || null,
              },
            });

            importedProductIds.push(created.id);
            createdCount++;

            // Create initial InventoryLog
            await tx.inventoryLog.create({
              data: {
                productId: created.id,
                variantId: null,
                previousStock: 0,
                adjustedStock: prod.stockQuantity,
                delta: prod.stockQuantity,
                reason: 'Initial Bulk Excel Import',
                adminEmail,
                adminId: validAdminId,
                actor: `ADMIN: ${adminEmail}`,
                type: 'RESTOCK',
              },
            });
            inventoryAdjustmentsCount++;

            // Create child variants if mapped
            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
              let varIdx = 1;
              for (const v of prod.variants) {
                const varSku = v.sku || generateVariantSku(finalProdSku, varIdx++);
                const createdVar = await tx.productVariant.create({
                  data: {
                    productId: created.id,
                    name: v.variantName,
                    sku: varSku,
                    price: v.price !== null ? v.price : prod.price,
                    hsnCode: v.hsnCode || prod.hsnCode,
                    gstRate: v.gstRate !== undefined && v.gstRate !== null ? Number(v.gstRate) : (prod.gstRate !== null ? Number(prod.gstRate) : null),
                    isTaxInclusive: v.isTaxInclusive !== undefined ? Boolean(v.isTaxInclusive) : Boolean(prod.isTaxInclusive),
                    cessRate: v.cessRate !== undefined ? Number(v.cessRate) : Number(prod.cessRate || 0),
                    stockQuantity: v.stockQuantity,
                    lowStockThreshold: v.lowStockThreshold,
                    inStock: Boolean(v.inStock),
                    attributes: v.attributes,
                  },
                });
                createdVariantsCount++;

                // Log inventory for variant
                await tx.inventoryLog.create({
                  data: {
                    productId: created.id,
                    variantId: createdVar.id,
                    previousStock: 0,
                    adjustedStock: v.stockQuantity,
                    delta: v.stockQuantity,
                    reason: `Initial Variant Stocking: ${v.sku}`,
                    adminEmail,
                    adminId: validAdminId,
                    actor: `ADMIN: ${adminEmail}`,
                    type: 'RESTOCK',
                  },
                });
                inventoryAdjustmentsCount++;
              }
            }
          } else if (mode === 'UPDATE_EXISTING') {
            if (!existing) {
              throw new Error(`Product Code "${prod.sourceId}" was not found in the database to update.`);
            }

            const updated = await tx.product.update({
              where: { id: existing.id },
              data: {
                name: prod.name,
                slug: prod.slug,
                category: prod.category,
                categoryName: prod.categoryName,
                tagline: prod.tagline,
                description: prod.description,
                image: prod.image,
                gallery: prod.gallery,
                packSize: prod.packSize,
                price: prod.price !== null ? prod.price : existing.price,
                originalPrice: prod.originalPrice !== null ? prod.originalPrice : existing.originalPrice,
                discount: prod.discount,
                isActive: Boolean(prod.isActive),
                isFeatured: Boolean(prod.isFeatured),
                badge: prod.badge,
                specs: Object.assign({}, existing.specs || {}, prod.specs || {}),
                lowStockThreshold: prod.lowStockThreshold,
                sku: prod.sku || existing.sku,
                hsnCode: prod.hsnCode || existing.hsnCode,
                gstRate: prod.gstRate !== null ? Number(prod.gstRate) : existing.gstRate,
                isTaxInclusive: prod.isTaxInclusive !== undefined ? Boolean(prod.isTaxInclusive) : existing.isTaxInclusive,
                cessRate: prod.cessRate !== undefined ? Number(prod.cessRate) : existing.cessRate,
                taxClassification: prod.taxClassification || existing.taxClassification,
                taxTreatment: prod.taxTreatment || existing.taxTreatment || 'TAXABLE',
                taxVerificationStatus: prod.taxVerificationStatus || existing.taxVerificationStatus || 'PENDING_VERIFICATION',
                taxConfirmedBy: prod.taxVerificationStatus === 'VERIFIED' ? adminEmail : existing.taxConfirmedBy,
                taxConfirmedAt: prod.taxVerificationStatus === 'VERIFIED' ? new Date() : existing.taxConfirmedAt,
                taxNotes: prod.taxNotes !== undefined ? prod.taxNotes : existing.taxNotes,
              },
            });

            importedProductIds.push(updated.id);
            updatedCount++;

            // Update or add variants
            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
              for (const v of prod.variants) {
                const existingVar = existing.variants.find(
                  (ev) => ev.sku && ev.sku.toLowerCase() === v.sku.toLowerCase()
                );

                if (existingVar) {
                  await tx.productVariant.update({
                    where: { id: existingVar.id },
                    data: {
                      name: v.variantName,
                      price: v.price !== null ? v.price : existingVar.price,
                      lowStockThreshold: v.lowStockThreshold,
                      attributes: v.attributes,
                    },
                  });
                } else {
                  await tx.productVariant.create({
                    data: {
                      productId: existing.id,
                      name: v.variantName,
                      sku: v.sku,
                      price: v.price !== null ? v.price : prod.price,
                      stockQuantity: v.stockQuantity,
                      lowStockThreshold: v.lowStockThreshold,
                      inStock: Boolean(v.inStock),
                      attributes: v.attributes,
                    },
                  });
                  createdVariantsCount++;
                }
              }
            }
          }
        }
      }

      // ----------------------------------------------------
      // MODE 3: INITIAL_INVENTORY
      // ----------------------------------------------------
      if (mode === 'INITIAL_INVENTORY' && parsedInventory.length > 0) {
        for (const item of parsedInventory) {
          const lowerCode = item.productCode.toLowerCase();
          const prod = await tx.product.findUnique({
            where: { sourceId: lowerCode },
            include: { variants: true },
          });

          if (!prod) {
            throw new Error(`Inventory target product "${item.productCode}" not found in database.`);
          }

          if (item.sku) {
            const variant = prod.variants.find((v) => v.sku && v.sku.toLowerCase() === item.sku.toLowerCase());
            if (!variant) {
              throw new Error(`Target SKU "${item.sku}" not found for product "${item.productCode}".`);
            }

            const prevStock = variant.stockQuantity;
            const delta = item.newStock - prevStock;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockQuantity: item.newStock,
                inStock: item.newStock > 0,
                ...(item.threshold !== undefined ? { lowStockThreshold: item.threshold } : {}),
              },
            });

            await tx.inventoryLog.create({
              data: {
                productId: prod.id,
                variantId: variant.id,
                previousStock: prevStock,
                adjustedStock: item.newStock,
                delta,
                reason: item.reason,
                adminEmail,
                adminId: validAdminId,
                actor: `ADMIN: ${adminEmail}`,
                type: delta >= 0 ? 'RESTOCK' : 'ADJUSTMENT',
              },
            });
            inventoryAdjustmentsCount++;
          } else {
            const prevStock = prod.stockQuantity;
            const delta = item.newStock - prevStock;

            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: item.newStock,
                inStock: item.newStock > 0,
                ...(item.threshold !== undefined ? { lowStockThreshold: item.threshold } : {}),
              },
            });

            await tx.inventoryLog.create({
              data: {
                productId: prod.id,
                variantId: null,
                previousStock: prevStock,
                adjustedStock: item.newStock,
                delta,
                reason: item.reason,
                adminEmail,
                adminId: validAdminId,
                actor: `ADMIN: ${adminEmail}`,
                type: delta >= 0 ? 'RESTOCK' : 'ADJUSTMENT',
              },
            });
            inventoryAdjustmentsCount++;
          }
        }
      }

      return {
        createdCount,
        updatedCount,
        createdVariantsCount,
        inventoryAdjustmentsCount,
        importedProductIds,
        summary: {
          productsCreated: createdCount,
          productsUpdated: updatedCount,
          variantsCreated: createdVariantsCount,
          inventoryLogsCreated: inventoryAdjustmentsCount,
        },
      };
    },
    { timeout: 30000 }
  );

  // Broadcast revalidation across all collections
  try {
    for (const cId of VALID_COLLECTION_IDS) {
      broadcastProductUpdate(cId);
    }
  } catch {
    // Non-blocking for background SSE
  }

  return result;
}

/**
 * Generates an Excel error report workbook for download.
 */
export async function generateErrorReportExcel(errors = [], warnings = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amoga Validation Engine';

  // Sheet 1: Errors
  const errSheet = workbook.addWorksheet('Validation Errors', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  errSheet.columns = [
    { header: 'Worksheet', key: 'sheet', width: 20 },
    { header: 'Row #', key: 'row', width: 10 },
    { header: 'Column Name', key: 'column', width: 28 },
    { header: 'Error Code', key: 'code', width: 28 },
    { header: 'Explanation & Guidance', key: 'message', width: 65 },
  ];

  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const errFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } }; // Deep Red

  const errHeader = errSheet.getRow(1);
  errHeader.height = 26;
  errHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = errFill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  errors.forEach((e) => {
    errSheet.addRow({
      sheet: e.sheet || 'General',
      row: e.row || '-',
      column: e.column || '-',
      code: e.code || 'UNKNOWN_ERROR',
      message: e.message || 'Validation failed.',
    });
  });

  // Sheet 2: Warnings
  const warnSheet = workbook.addWorksheet('Warnings & Recommendations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  warnSheet.columns = [
    { header: 'Worksheet', key: 'sheet', width: 20 },
    { header: 'Row #', key: 'row', width: 10 },
    { header: 'Column Name', key: 'column', width: 28 },
    { header: 'Warning Code', key: 'code', width: 28 },
    { header: 'Recommendation Note', key: 'message', width: 65 },
  ];

  const warnFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }; // Amber

  const warnHeader = warnSheet.getRow(1);
  warnHeader.height = 26;
  warnHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = warnFill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  warnings.forEach((w) => {
    warnSheet.addRow({
      sheet: w.sheet || 'General',
      row: w.row || '-',
      column: w.column || '-',
      code: w.code || 'UNKNOWN_WARNING',
      message: w.message || 'Advisory notice.',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
