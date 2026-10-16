import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma.js';
import { logAdminAction } from '../utils/adminAuth.js';
import { broadcastProductUpdate } from '../controllers/productsController.js';

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
  },
  sarees: {
    id: 'sarees',
    name: 'Heritage Sarees',
    categories: ['silk', 'traditional', 'festive', 'wedding', 'contemporary'],
    categoryNames: {
      silk: 'Silk Sarees',
      traditional: 'Traditional Weaves',
      festive: 'Festive Collection',
      wedding: 'Bridal & Wedding Sarees',
      contemporary: 'Contemporary Weaves',
    },
  },
  jewellery: {
    id: 'jewellery',
    name: 'Sterling Silver',
    categories: ['rings', 'necklaces', 'earrings', 'bracelets', 'traditional'],
    categoryNames: {
      rings: 'Rings',
      necklaces: 'Necklaces & Pendants',
      earrings: 'Earrings',
      bracelets: 'Bracelets & Cuffs',
      traditional: 'Traditional Silver',
    },
  },
};

/**
 * Generates the official multi-sheet Excel workbook template for bulk product import.
 */
export async function generateProductImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amoga E-Commerce Architecture';
  workbook.lastModifiedBy = 'Amoga Administrator';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Style constants
  const primaryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF722F37' }, // Amoga luxury deep burgundy
  };
  const secondaryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };
  const categoryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4A3B32' }, // Warm artisanal brown
  };
  const headerFont = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  // ----------------------------------------------------
  // SHEET 1: READ ME
  // ----------------------------------------------------
  const readMeSheet = workbook.addWorksheet('Read Me', {
    views: [{ showGridLines: true }],
  });
  readMeSheet.getColumn(1).width = 28;
  readMeSheet.getColumn(2).width = 85;

  readMeSheet.addRow(['AMOGA BULK PRODUCT IMPORT GUIDE', '']);
  readMeSheet.addRow(['Template Version', TEMPLATE_VERSION]);
  readMeSheet.addRow(['Supported Collections', 'Wholesome Pantry (food), Wellness Tea (tea), Heritage Sarees (sarees), Sterling Silver (jewellery)']);
  readMeSheet.addRow(['Currency', 'Indian Rupee (INR ₹)']);
  readMeSheet.addRow(['', '']);

  readMeSheet.addRow(['INSTRUCTIONS & USAGE RULES', '']);
  readMeSheet.addRow([
    '1. Products Sheet',
    'Add your base products here. Each product must have a unique Product Code (sourceId). Required fields: Collection Code, Product Code, Product Name, Category Code, Description, Primary Image URL.',
  ]);
  readMeSheet.addRow([
    '2. Category-Specific Fields',
    'Columns are grouped for Pantry (food), Tea, Sarees, and Jewellery. Fill in the columns corresponding to your collection.',
  ]);
  readMeSheet.addRow([
    '3. Variants Sheet',
    'If a product has multiple colors, sizes, or weights (e.g. Sarees with different shades, Rings with different sizes, Teas with multiple pack sizes), list them on the Variants sheet mapped to the parent Product Code.',
  ]);
  readMeSheet.addRow([
    '4. Inventory Sheet',
    'Use this sheet when running in "Initial Inventory Import" mode to audit, establish, or update stock counts with an official reason note.',
  ]);
  readMeSheet.addRow([
    '5. Collections Reference',
    'Consult the "Collections" sheet for valid collection codes and approved category IDs.',
  ]);
  readMeSheet.addRow([
    '6. Pricing & Publication',
    'Products without a valid selling price will automatically remain in Draft mode and will not be purchasable. For items intended for immediate sale, provide a valid Selling Price and set Publication Status to "Published".',
  ]);
  readMeSheet.addRow(['', '']);

  readMeSheet.addRow(['IMPORT MODES EXPLAINED', '']);
  readMeSheet.addRow([
    'Create New Products',
    'Creates products that do not exist yet. Fails or skips if a product code or slug already exists in the database. Safe for new catalogue releases.',
  ]);
  readMeSheet.addRow([
    'Update Existing Products',
    'Matches existing products by Product Code and updates their fields, images, descriptions, pricing, and variants.',
  ]);
  readMeSheet.addRow([
    'Initial Inventory Import',
    'Processes stock counts separately and records audit entries in the Inventory Log. Does not overwrite descriptive product copy.',
  ]);

  // Style Read Me
  readMeSheet.getRow(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF722F37' } };
  readMeSheet.getRow(6).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };
  readMeSheet.getRow(14).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1A1817' } };

  // ----------------------------------------------------
  // SHEET 2: PRODUCTS
  // ----------------------------------------------------
  const productsSheet = workbook.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const productColumns = [
    // Core shared fields
    { header: 'Collection Code*', key: 'collectionId', width: 16 },
    { header: 'Product Code*', key: 'sourceId', width: 22 },
    { header: 'Product Name*', key: 'name', width: 32 },
    { header: 'Slug', key: 'slug', width: 26 },
    { header: 'Category Code*', key: 'category', width: 18 },
    { header: 'Category Name', key: 'categoryName', width: 22 },
    { header: 'Tagline', key: 'tagline', width: 35 },
    { header: 'Description*', key: 'description', width: 50 },
    { header: 'Primary Image URL*', key: 'image', width: 35 },
    { header: 'Gallery Image URLs', key: 'gallery', width: 40 },
    { header: 'Pack Size / Weight', key: 'packSize', width: 20 },
    { header: 'Selling Price (INR)', key: 'price', width: 18 },
    { header: 'Original Price / MRP (INR)', key: 'originalPrice', width: 24 },
    { header: 'Discount Label', key: 'discount', width: 16 },
    { header: 'Publication Status', key: 'status', width: 18 },
    { header: 'In Stock', key: 'inStock', width: 12 },
    { header: 'Stock Quantity', key: 'stockQuantity', width: 16 },
    { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20 },
    { header: 'Featured', key: 'isFeatured', width: 12 },
    { header: 'Badge', key: 'badge', width: 16 },
    { header: 'Tags', key: 'tags', width: 25 },

    // Category Specific - Pantry (Food)
    { header: 'Pantry: Ingredients', key: 'food_ingredients', width: 32 },
    { header: 'Pantry: Allergens', key: 'food_allergens', width: 22 },
    { header: 'Pantry: Dietary Details', key: 'food_dietary', width: 24 },
    { header: 'Pantry: Servings', key: 'food_servings', width: 16 },
    { header: 'Pantry: Preparation Instructions', key: 'food_prep', width: 35 },
    { header: 'Pantry: Storage Instructions', key: 'food_storage', width: 25 },
    { header: 'Pantry: Shelf Life', key: 'food_shelfLife', width: 18 },
    { header: 'Pantry: FSSAI / Compliance', key: 'food_compliance', width: 24 },

    // Category Specific - Wellness Tea
    { header: 'Tea: Ingredients', key: 'tea_ingredients', width: 30 },
    { header: 'Tea: Form', key: 'tea_form', width: 18 },
    { header: 'Tea: Caffeine Info', key: 'tea_caffeine', width: 24 },
    { header: 'Tea: Brewing Temp (°C)', key: 'tea_temp', width: 22 },
    { header: 'Tea: Brewing Time (mins)', key: 'tea_time', width: 22 },
    { header: 'Tea: Serving Size', key: 'tea_serving', width: 18 },
    { header: 'Tea: Harvest Season', key: 'tea_harvest', width: 24 },

    // Category Specific - Heritage Sarees
    { header: 'Sarees: Fabric', key: 'saree_fabric', width: 30 },
    { header: 'Sarees: Weave Type', key: 'saree_weave', width: 28 },
    { header: 'Sarees: Length (m)', key: 'saree_length', width: 18 },
    { header: 'Sarees: Blouse Piece Details', key: 'saree_blouse', width: 30 },
    { header: 'Sarees: Primary Colour', key: 'saree_color', width: 20 },
    { header: 'Sarees: Border Details', key: 'saree_border', width: 30 },
    { header: 'Sarees: Care Instructions', key: 'saree_care', width: 24 },

    // Category Specific - Sterling Silver Jewellery
    { header: 'Jewellery: Type', key: 'jewel_type', width: 18 },
    { header: 'Jewellery: Metal Type', key: 'jewel_metal', width: 22 },
    { header: 'Jewellery: Verified Purity', key: 'jewel_purity', width: 20 },
    { header: 'Jewellery: Gross Weight (g)', key: 'jewel_weight', width: 24 },
    { header: 'Jewellery: Stone Details', key: 'jewel_stone', width: 28 },
    { header: 'Jewellery: Plating / Finish', key: 'jewel_finish', width: 24 },
    { header: 'Jewellery: Standard Size', key: 'jewel_size', width: 20 },
    { header: 'Jewellery: Hallmark Info', key: 'jewel_hallmark', width: 24 },
    { header: 'Jewellery: Care Instructions', key: 'jewel_care', width: 28 },

    // Custom Raw Specs JSON
    { header: 'Custom Specs JSON', key: 'custom_specs', width: 25 },
  ];

  productsSheet.columns = productColumns;

  // Style header row
  const prodHeaderRow = productsSheet.getRow(1);
  prodHeaderRow.height = 26;
  prodHeaderRow.eachCell((cell, colNumber) => {
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (colNumber <= 11) {
      cell.fill = primaryHeaderFill;
    } else if (colNumber <= 21) {
      cell.fill = secondaryHeaderFill;
    } else {
      cell.fill = categoryHeaderFill;
    }
  });

  // Pre-populate with 4 sample products (one per collection)
  const sampleProducts = [
    {
      collectionId: 'food',
      sourceId: 'f-sample-moringa-soup',
      name: 'Organic Moringa & Pepper Soup Mix',
      slug: 'organic-moringa-pepper-soup-mix',
      category: 'soups',
      categoryName: 'Soup Mixes',
      tagline: 'Wholesome drumstick leaf soup infused with Malabar black pepper',
      description: 'Hand-harvested organic moringa leaves naturally dried and stone-ground with roasted lentils, cumin, and Malabar black pepper. Nutritious, warming, and 100% natural.',
      image: '/images/food/food-soups-hero.jpg',
      gallery: '',
      packSize: '150 g',
      price: 249,
      originalPrice: 299,
      discount: '17% OFF',
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
      food_servings: '6-8 bowls',
      food_prep: 'Mix 2 tbsp with 200ml boiling water. Simmer for 2 mins and serve hot.',
      food_storage: 'Store in an airtight container in a cool, dry place.',
      food_shelfLife: '9 Months',
      food_compliance: 'FSSAI Certified',
    },
    {
      collectionId: 'tea',
      sourceId: 'tea-sample-chamomile-calm',
      name: 'Kashmir Chamomile & Mint Tea',
      slug: 'kashmir-chamomile-mint-tea',
      category: 'flower',
      categoryName: 'Botanical Flower Brews',
      tagline: 'Whole Egyptian chamomile blossoms with Himalayan spearmint',
      description: 'Soothe the senses with whole chamomile blossoms blended with refreshing mountain mint. Caffeine-free evening relaxation ritual.',
      image: '/images/tea/tea-chamomile.jpg',
      gallery: '',
      packSize: '50 g Tin',
      price: 499,
      originalPrice: 599,
      discount: '16% OFF',
      status: 'Published',
      inStock: 'Yes',
      stockQuantity: 30,
      lowStockThreshold: 5,
      isFeatured: 'No',
      badge: 'Artisanal',
      tags: 'tea, herbal, chamomile, caffeine-free',
      tea_ingredients: 'Whole Chamomile Blossoms, Himalayan Spearmint Leaves',
      tea_form: 'Whole Flower & Leaf',
      tea_caffeine: 'Naturally Caffeine Free',
      tea_temp: '90°C',
      tea_time: '4-5 mins',
      tea_serving: '1 tsp (2g) per cup',
      tea_harvest: 'Spring 2026',
    },
    {
      collectionId: 'sarees',
      sourceId: 's-sample-royal-wine-silk',
      name: 'Kanchipuram Silk Saree in Royal Wine',
      slug: 'kanchipuram-silk-saree-royal-wine',
      category: 'silk',
      categoryName: 'Silk Sarees',
      tagline: 'Handwoven pure mulberry silk with rich gold zari peacock border',
      description: 'Handwoven on traditional pit looms in Kanchipuram by master weavers. Features authentic interlocking Korvai technique, rich temple motifs, and contrast pallu.',
      image: '/images/sarees/saree-kanchipuram.jpg',
      gallery: '',
      packSize: 'Standard (6.3 m)',
      price: 18999,
      originalPrice: 22000,
      discount: '14% OFF',
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
      saree_color: 'Royal Wine',
      saree_border: 'Traditional Temple Border with Tested Gold Zari',
      saree_care: 'Strictly Dry Clean Only',
    },
    {
      collectionId: 'jewellery',
      sourceId: 'j-sample-solstice-ring',
      name: 'Solstice Moonstone Ring in 925 Silver',
      slug: 'solstice-moonstone-ring-925-silver',
      category: 'rings',
      categoryName: 'Rings',
      tagline: 'Hand-set natural rainbow moonstone in architectural 925 sterling silver',
      description: 'Featuring a luminous natural oval moonstone held in a contemporary sculptural bezel. Finished with anti-tarnish rhodium plating for lasting brilliance.',
      image: '/images/jewellery/jewellery-solstice-ring.jpg',
      gallery: '',
      packSize: '1 Piece',
      price: 3499,
      originalPrice: 4200,
      discount: '17% OFF',
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
      jewel_care: 'Store in provided airtight velvet pouch; keep away from water and perfume',
    },
  ];

  sampleProducts.forEach((item) => {
    productsSheet.addRow(item);
  });

  // ----------------------------------------------------
  // SHEET 3: VARIANTS
  // ----------------------------------------------------
  const variantsSheet = workbook.addWorksheet('Variants', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const variantColumns = [
    { header: 'Product Code*', key: 'productCode', width: 24 },
    { header: 'Variant Name*', key: 'variantName', width: 26 },
    { header: 'Variant SKU*', key: 'sku', width: 24 },
    { header: 'Variant Type', key: 'type', width: 18 },
    { header: 'Option Value', key: 'optionValue', width: 22 },
    { header: 'Selling Price (INR)', key: 'price', width: 18 },
    { header: 'Stock Quantity', key: 'stockQuantity', width: 16 },
    { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20 },
    { header: 'In Stock', key: 'inStock', width: 12 },
    { header: 'Variant Attributes JSON', key: 'attributesJson', width: 30 },
  ];

  variantsSheet.columns = variantColumns;
  const varHeaderRow = variantsSheet.getRow(1);
  varHeaderRow.height = 26;
  varHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = secondaryHeaderFill;
  });

  // Sample variants
  const sampleVariants = [
    {
      productCode: 's-sample-royal-wine-silk',
      variantName: 'Royal Wine',
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
      variantName: 'Temple Crimson',
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

  sampleVariants.forEach((v) => variantsSheet.addRow(v));

  // ----------------------------------------------------
  // SHEET 4: INVENTORY
  // ----------------------------------------------------
  const inventorySheet = workbook.addWorksheet('Inventory', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const invColumns = [
    { header: 'Product Code*', key: 'productCode', width: 26 },
    { header: 'Variant SKU', key: 'sku', width: 22 },
    { header: 'New Stock Quantity*', key: 'newStock', width: 20 },
    { header: 'Low Stock Threshold', key: 'threshold', width: 20 },
    { header: 'Adjustment Reason*', key: 'reason', width: 35 },
  ];

  inventorySheet.columns = invColumns;
  const invHeaderRow = inventorySheet.getRow(1);
  invHeaderRow.height = 26;
  invHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = primaryHeaderFill;
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

  sampleInventory.forEach((item) => inventorySheet.addRow(item));

  // ----------------------------------------------------
  // SHEET 5: COLLECTIONS REFERENCE
  // ----------------------------------------------------
  const collectionsSheet = workbook.addWorksheet('Collections', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  collectionsSheet.columns = [
    { header: 'Collection Code', key: 'code', width: 18 },
    { header: 'Collection Name', key: 'name', width: 25 },
    { header: 'Approved Category Codes', key: 'cats', width: 45 },
    { header: 'Category Display Names', key: 'catNames', width: 55 },
  ];

  const colHeaderRow = collectionsSheet.getRow(1);
  colHeaderRow.height = 26;
  colHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = categoryHeaderFill;
  });

  Object.values(COLLECTION_INFO).forEach((col) => {
    collectionsSheet.addRow({
      code: col.id,
      name: col.name,
      cats: col.categories.join(', '),
      catNames: Object.values(col.categoryNames).join(', '),
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

  // 2. Read template version if Read Me exists
  let templateVersion = '1.0.0';
  const readMeSheet = workbook.getWorksheet('Read Me');
  if (readMeSheet) {
    try {
      const vCell = readMeSheet.getCell('B2').value || readMeSheet.getCell('B3').value;
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
      select: { id: true, sourceId: true, slug: true, collectionId: true, name: true, price: true, stockQuantity: true },
    }),
    prisma.productVariant.findMany({
      select: { id: true, sku: true, productId: true, name: true },
    }),
  ]);

  const existingSourceIdMap = new Map();
  const existingSlugCollectionMap = new Map(); // key: `${collectionId}::${slug}`
  existingProducts.forEach((p) => {
    existingSourceIdMap.set(p.sourceId.toLowerCase(), p);
    existingSlugCollectionMap.set(`${p.collectionId}::${p.slug.toLowerCase()}`, p);
  });

  const existingSkuMap = new Map();
  existingVariants.forEach((v) => {
    if (v.sku) existingSkuMap.set(v.sku.toLowerCase(), v);
  });

  // Track in-sheet uniqueness
  const seenSourceIdsInSheet = new Set();
  const seenSlugsInSheet = new Set();
  const parsedProducts = [];

  if (productsSheet) {
    // Parse Products Worksheet
    const headerRow = productsSheet.getRow(1);
    const colIndexMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').trim();
      colIndexMap[val] = colNumber;
    });

    // Check critical header columns
    const requiredHeaders = [
      'Collection Code*',
      'Product Code*',
      'Product Name*',
      'Category Code*',
      'Description*',
      'Primary Image URL*',
    ];

    for (const reqH of requiredHeaders) {
      if (!colIndexMap[reqH]) {
        errors.push({
          sheet: 'Products',
          row: 1,
          column: reqH,
          code: 'MISSING_REQUIRED_COLUMN',
          message: `Required column "${reqH}" was not found in the Products header row.`,
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

  const getCellVal = (row, headerName) => {
    const colIdx = colIndexMap[headerName];
    if (!colIdx) return '';
    const cell = row.getCell(colIdx);
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object') {
      if (cell.value.text) return String(cell.value.text).trim();
      if (cell.value.result) return String(cell.value.result).trim();
    }
    return String(cell.value).trim();
  };

  const getNumericVal = (row, headerName) => {
    const raw = getCellVal(row, headerName);
    if (!raw) return null;
    const clean = raw.replace(/[₹,\s]/g, '');
    const num = Number(clean);
    return isNaN(num) ? 'INVALID' : num;
  };

  const rowCount = productsSheet.rowCount;
  for (let r = 2; r <= rowCount; r++) {
    const row = productsSheet.getRow(r);
    // If row is entirely blank, skip
    let hasAnyData = false;
    row.eachCell(() => {
      hasAnyData = true;
    });
    if (!hasAnyData) continue;

    const collectionId = getCellVal(row, 'Collection Code*').toLowerCase();
    const sourceId = getCellVal(row, 'Product Code*');
    const name = getCellVal(row, 'Product Name*');
    let slug = getCellVal(row, 'Slug');
    const category = getCellVal(row, 'Category Code*');
    const categoryName = getCellVal(row, 'Category Name');
    const tagline = getCellVal(row, 'Tagline');
    const description = getCellVal(row, 'Description*');
    const image = getCellVal(row, 'Primary Image URL*');
    const galleryRaw = getCellVal(row, 'Gallery Image URLs');
    const packSize = getCellVal(row, 'Pack Size / Weight');
    const priceVal = getNumericVal(row, 'Selling Price (INR)');
    const origPriceVal = getNumericVal(row, 'Original Price / MRP (INR)');
    const discount = getCellVal(row, 'Discount Label');
    const statusRaw = getCellVal(row, 'Publication Status').toLowerCase();
    const inStockRaw = getCellVal(row, 'In Stock').toLowerCase();
    const stockQtyVal = getNumericVal(row, 'Stock Quantity');
    const thresholdVal = getNumericVal(row, 'Low Stock Threshold');
    const featuredRaw = getCellVal(row, 'Featured').toLowerCase();
    const badge = getCellVal(row, 'Badge');
    const tagsRaw = getCellVal(row, 'Tags');

    // 1. Validate Collection
    if (!collectionId) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Collection Code*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Collection Code is required (e.g. food, tea, sarees, jewellery).',
      });
    } else if (!validCollectionIds.has(collectionId)) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Collection Code*',
        code: 'INVALID_COLLECTION',
        message: `Collection "${collectionId}" does not exist. Permitted: ${Array.from(validCollectionIds).join(', ')}.`,
      });
    } else if (selectedCollection !== 'all' && collectionId !== selectedCollection) {
      warnings.push({
        sheet: 'Products',
        row: r,
        column: 'Collection Code*',
        code: 'COLLECTION_MISMATCH',
        message: `Product belongs to "${collectionId}", but import filter is set to "${selectedCollection}".`,
      });
    }

    // 2. Validate Product Code
    if (!sourceId) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Product Code*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Product Code is required and must be unique.',
      });
    } else {
      const lowerSourceId = sourceId.toLowerCase();
      if (seenSourceIdsInSheet.has(lowerSourceId)) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Product Code*',
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
          column: 'Product Code*',
          code: 'PRODUCT_ALREADY_EXISTS',
          message: `Product Code "${sourceId}" already exists in database. In "Create New" mode, existing products cannot be overwritten.`,
        });
      } else if (mode === 'UPDATE_EXISTING' && !existingSourceIdMap.has(lowerSourceId)) {
        errors.push({
          sheet: 'Products',
          row: r,
          column: 'Product Code*',
          code: 'PRODUCT_NOT_FOUND',
          message: `Product Code "${sourceId}" was not found in database to update.`,
        });
      }
    }

    // 3. Validate Name & Slug
    if (!name) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Product Name*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Product Name is required.',
      });
    } else {
      if (!slug) {
        slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      } else {
        slug = slug
          .toLowerCase()
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

    // 4. Validate Category Code
    if (!category) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Category Code*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Category Code is required.',
      });
    }

    // 5. Validate Description
    if (!description) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Description*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Product description is required.',
      });
    }

    // 6. Validate Image URL
    if (!image) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Primary Image URL*',
        code: 'REQUIRED_FIELD_EMPTY',
        message: 'Primary Image URL is required.',
      });
    } else if (!image.startsWith('/') && !image.startsWith('http://') && !image.startsWith('https://')) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Primary Image URL*',
        code: 'INVALID_IMAGE_URL',
        message: `Primary image "${image}" must be a root path (e.g. /images/...) or a valid HTTP/HTTPS URL.`,
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
        column: 'Original Price / MRP (INR)',
        code: 'INVALID_NUMERIC',
        message: 'Original Price must be a valid number or left blank.',
      });
    } else if (origPriceVal !== null && origPriceVal < 0) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Original Price / MRP (INR)',
        code: 'NEGATIVE_PRICE',
        message: 'Original Price cannot be negative.',
      });
    }

    // Publication rules: unpriced products cannot be published
    const wantsPublish = statusRaw === 'published' || statusRaw === 'active' || statusRaw === 'live';
    if (wantsPublish && (priceVal === null || priceVal === 0)) {
      errors.push({
        sheet: 'Products',
        row: r,
        column: 'Publication Status',
        code: 'UNPRICED_CANNOT_BE_PUBLISHED',
        message: 'Unpriced products cannot be published directly. Provide an approved selling price or set status to "Draft".',
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

    // 9. Collect Category-Specific Specs
    const specs = {};
    if (collectionId === 'food') {
      const ing = getCellVal(row, 'Pantry: Ingredients');
      const allg = getCellVal(row, 'Pantry: Allergens');
      const diet = getCellVal(row, 'Pantry: Dietary Details');
      const serv = getCellVal(row, 'Pantry: Servings');
      const prep = getCellVal(row, 'Pantry: Preparation Instructions');
      const stor = getCellVal(row, 'Pantry: Storage Instructions');
      const life = getCellVal(row, 'Pantry: Shelf Life');
      const comp = getCellVal(row, 'Pantry: FSSAI / Compliance');
      if (ing) specs.ingredients = ing;
      if (allg) specs.allergens = allg;
      if (diet) specs.dietary = diet;
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
      const ing = getCellVal(row, 'Tea: Ingredients');
      const form = getCellVal(row, 'Tea: Form');
      const caff = getCellVal(row, 'Tea: Caffeine Info');
      const temp = getCellVal(row, 'Tea: Brewing Temp (°C)');
      const time = getCellVal(row, 'Tea: Brewing Time (mins)');
      const serv = getCellVal(row, 'Tea: Serving Size');
      const harv = getCellVal(row, 'Tea: Harvest Season');
      if (ing) specs.ingredients = ing;
      if (form) specs.teaForm = form;
      if (caff) specs.caffeineLevel = caff;
      if (temp) specs.brewingTemp = temp;
      if (time) specs.steepTime = time;
      if (serv) specs.servingSize = serv;
      if (harv) specs.harvestSeason = harv;
    } else if (collectionId === 'sarees') {
      const fab = getCellVal(row, 'Sarees: Fabric');
      const wea = getCellVal(row, 'Sarees: Weave Type');
      const len = getCellVal(row, 'Sarees: Length (m)');
      const blo = getCellVal(row, 'Sarees: Blouse Piece Details');
      const col = getCellVal(row, 'Sarees: Primary Colour');
      const bor = getCellVal(row, 'Sarees: Border Details');
      const car = getCellVal(row, 'Sarees: Care Instructions');
      if (fab) specs.fabric = fab;
      if (wea) specs.weave = wea;
      if (len) specs.sareeLength = len;
      if (blo) specs.blousePiece = blo;
      if (col) specs.primaryColor = col;
      if (bor) specs.borderDetails = bor;
      if (car) specs.careInstructions = car;
    } else if (collectionId === 'jewellery') {
      const typ = getCellVal(row, 'Jewellery: Type');
      const met = getCellVal(row, 'Jewellery: Metal Type');
      const pur = getCellVal(row, 'Jewellery: Verified Purity');
      const wei = getCellVal(row, 'Jewellery: Gross Weight (g)');
      const sto = getCellVal(row, 'Jewellery: Stone Details');
      const fin = getCellVal(row, 'Jewellery: Plating / Finish');
      const siz = getCellVal(row, 'Jewellery: Standard Size');
      const hal = getCellVal(row, 'Jewellery: Hallmark Info');
      const car = getCellVal(row, 'Jewellery: Care Instructions');
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

    // 10. Parse Custom Raw Specs JSON if provided
    const customJsonRaw = getCellVal(row, 'Custom Specs JSON');
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
      packSize: packSize || null,
      price: priceVal !== 'INVALID' ? priceVal : null,
      originalPrice: origPriceVal !== 'INVALID' ? origPriceVal : null,
      discount: discount || null,
      isActive: wantsPublish,
      inStock: inStockRaw === 'no' || inStockRaw === 'false' ? false : parsedStockQty > 0,
      stockQuantity: parsedStockQty,
      lowStockThreshold: parsedThreshold,
      isFeatured: featuredRaw === 'yes' || featuredRaw === 'true',
      badge: badge || null,
      specs,
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
    const varHeaderRow = variantsSheet.getRow(1);
    const varColIndexMap = {};
    varHeaderRow.eachCell((cell, colNumber) => {
      varColIndexMap[String(cell.value || '').trim()] = colNumber;
    });

    const getVarCellVal = (row, headerName) => {
      const idx = varColIndexMap[headerName];
      if (!idx) return '';
      const cell = row.getCell(idx);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      return String(cell.value).trim();
    };

    const getVarNumeric = (row, headerName) => {
      const raw = getVarCellVal(row, headerName);
      if (!raw) return null;
      const clean = raw.replace(/[₹,\s]/g, '');
      const num = Number(clean);
      return isNaN(num) ? 'INVALID' : num;
    };

    const vRowCount = variantsSheet.rowCount;
    for (let r = 2; r <= vRowCount; r++) {
      const row = variantsSheet.getRow(r);
      let hasData = false;
      row.eachCell(() => {
        hasData = true;
      });
      if (!hasData) continue;

      const productCode = getVarCellVal(row, 'Product Code*');
      const variantName = getVarCellVal(row, 'Variant Name*');
      const sku = getVarCellVal(row, 'Variant SKU*');
      const type = getVarCellVal(row, 'Variant Type') || 'custom';
      const optionVal = getVarCellVal(row, 'Option Value');
      const priceVal = getVarNumeric(row, 'Selling Price (INR)');
      const stockVal = getVarNumeric(row, 'Stock Quantity');
      const threshVal = getVarNumeric(row, 'Low Stock Threshold');
      const inStockRaw = getVarCellVal(row, 'In Stock').toLowerCase();
      const attrsJsonRaw = getVarCellVal(row, 'Variant Attributes JSON');

      if (!productCode) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Product Code*',
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
            column: 'Product Code*',
            code: 'PARENT_PRODUCT_NOT_FOUND',
            message: `Parent product "${productCode}" was not found in the Products sheet or database.`,
          });
        }
      }

      if (!variantName) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Variant Name*',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Variant Name is required (e.g. Royal Wine, US 7).',
        });
      }

      if (!sku) {
        errors.push({
          sheet: 'Variants',
          row: r,
          column: 'Variant SKU*',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Variant SKU is required and must be unique.',
        });
      } else {
        const lowerSku = sku.toLowerCase();
        if (seenVariantSkus.has(lowerSku)) {
          errors.push({
            sheet: 'Variants',
            row: r,
            column: 'Variant SKU*',
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
            column: 'Variant SKU*',
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

      parsedVariants.push({
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
      });

      // Link to parent in parsedProducts
      const parent = parsedProducts.find((p) => p.sourceId.toLowerCase() === productCode.toLowerCase());
      if (parent) {
        parent.variants.push(parsedVariants[parsedVariants.length - 1]);
      }
    }
  }

  // ----------------------------------------------------
  // Parse Inventory Worksheet (if present)
  // ----------------------------------------------------
  const parsedInventory = [];
  if (inventorySheet) {
    const invHeaderRow = inventorySheet.getRow(1);
    const invColIndexMap = {};
    invHeaderRow.eachCell((cell, colNumber) => {
      invColIndexMap[String(cell.value || '').trim()] = colNumber;
    });

    const getInvCellVal = (row, headerName) => {
      const idx = invColIndexMap[headerName];
      if (!idx) return '';
      const cell = row.getCell(idx);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      return String(cell.value).trim();
    };

    const iRowCount = inventorySheet.rowCount;
    for (let r = 2; r <= iRowCount; r++) {
      const row = inventorySheet.getRow(r);
      let hasData = false;
      row.eachCell(() => {
        hasData = true;
      });
      if (!hasData) continue;

      const productCode = getInvCellVal(row, 'Product Code*');
      const sku = getInvCellVal(row, 'Variant SKU');
      const newStockRaw = getInvCellVal(row, 'New Stock Quantity*');
      const threshRaw = getInvCellVal(row, 'Low Stock Threshold');
      const reason = getInvCellVal(row, 'Adjustment Reason*');

      if (!productCode) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'Product Code*',
          code: 'REQUIRED_FIELD_EMPTY',
          message: 'Product Code is required for inventory adjustment.',
        });
      }

      const stockNum = Number(newStockRaw);
      if (isNaN(stockNum) || stockNum < 0) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'New Stock Quantity*',
          code: 'INVALID_STOCK_QTY',
          message: 'New Stock Quantity must be a non-negative integer.',
        });
      }

      if (!reason) {
        errors.push({
          sheet: 'Inventory',
          row: r,
          column: 'Adjustment Reason*',
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
                originalPrice: prod.originalPrice !== null ? prod.originalPrice : null,
                discount: prod.discount,
                isActive: Boolean(prod.isActive),
                inStock: Boolean(prod.inStock),
                stockQuantity: prod.stockQuantity,
                lowStockThreshold: prod.lowStockThreshold,
                isFeatured: Boolean(prod.isFeatured),
                badge: prod.badge,
                specs: prod.specs,
                verified: true,
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
              for (const v of prod.variants) {
                const createdVar = await tx.productVariant.create({
                  data: {
                    productId: created.id,
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

                await tx.inventoryLog.create({
                  data: {
                    productId: created.id,
                    variantId: createdVar.id,
                    previousStock: 0,
                    adjustedStock: v.stockQuantity,
                    delta: v.stockQuantity,
                    reason: 'Initial Bulk Excel Variant Import',
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
              throw new Error(`Product Code "${prod.sourceId}" does not exist to update.`);
            }

            const updateData = {
              name: prod.name,
              category: prod.category,
              categoryName: prod.categoryName,
              description: prod.description,
              image: prod.image,
              gallery: prod.gallery,
              specs: prod.specs,
              isActive: Boolean(prod.isActive),
            };

            if (prod.tagline !== undefined) updateData.tagline = prod.tagline;
            if (prod.packSize !== undefined) updateData.packSize = prod.packSize;
            if (prod.price !== null) updateData.price = prod.price;
            if (prod.originalPrice !== null) updateData.originalPrice = prod.originalPrice;
            if (prod.discount !== undefined) updateData.discount = prod.discount;
            if (prod.badge !== undefined) updateData.badge = prod.badge;
            if (prod.isFeatured !== undefined) updateData.isFeatured = prod.isFeatured;

            const updated = await tx.product.update({
              where: { id: existing.id },
              data: updateData,
            });

            importedProductIds.push(updated.id);
            updatedCount++;

            // Sync or update variants if provided
            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
              for (const v of prod.variants) {
                const matchVar = existing.variants.find(
                  (ev) => ev.sku && ev.sku.toLowerCase() === v.sku.toLowerCase()
                );
                if (matchVar) {
                  await tx.productVariant.update({
                    where: { id: matchVar.id },
                    data: {
                      name: v.variantName,
                      price: v.price !== null ? v.price : matchVar.price,
                      attributes: v.attributes,
                    },
                  });
                } else {
                  await tx.productVariant.create({
                    data: {
                      productId: existing.id,
                      name: v.variantName,
                      sku: v.sku,
                      price: v.price !== null ? v.price : existing.price,
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
      // MODE 3: INITIAL_INVENTORY / INVENTORY AUDIT IMPORT
      // ----------------------------------------------------
      if (mode === 'INITIAL_INVENTORY' || (parsedInventory.length > 0 && mode === 'CREATE_NEW')) {
        for (const item of parsedInventory) {
          const prod = await tx.product.findUnique({
            where: { sourceId: item.productCode.toLowerCase() },
            include: { variants: true },
          });

          if (!prod) continue;

          if (item.sku) {
            const v = prod.variants.find(
              (varItem) => varItem.sku && varItem.sku.toLowerCase() === item.sku.toLowerCase()
            );
            if (v) {
              const prev = v.stockQuantity;
              const delta = item.newStock - prev;
              await tx.productVariant.update({
                where: { id: v.id },
                data: {
                  stockQuantity: item.newStock,
                  inStock: item.newStock > 0,
                  ...(item.threshold !== undefined ? { lowStockThreshold: item.threshold } : {}),
                },
              });

              await tx.inventoryLog.create({
                data: {
                  productId: prod.id,
                  variantId: v.id,
                  previousStock: prev,
                  adjustedStock: item.newStock,
                  delta,
                  reason: item.reason,
                  adminEmail,
                  adminId: validAdminId,
                  actor: `ADMIN: ${adminEmail}`,
                  type: delta >= 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
                },
              });
              inventoryAdjustmentsCount++;
            }
          } else {
            const prev = prod.stockQuantity;
            const delta = item.newStock - prev;
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
                previousStock: prev,
                adjustedStock: item.newStock,
                delta,
                reason: item.reason,
                adminEmail,
                adminId: validAdminId,
                actor: `ADMIN: ${adminEmail}`,
                type: delta >= 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
              },
            });
            inventoryAdjustmentsCount++;
          }
        }
      }

      // Log master admin audit action
      await logAdminAction({
        adminId: validAdminId,
        adminEmail,
        action: 'BULK_PRODUCT_IMPORT',
        entityType: 'ProductCatalogue',
        entityId: null,
        details: {
          mode,
          createdCount,
          updatedCount,
          createdVariantsCount,
          inventoryAdjustmentsCount,
          productCodes: parsedProducts.map((p) => p.sourceId),
        },
      });

      return {
        createdCount,
        updatedCount,
        createdVariantsCount,
        inventoryAdjustmentsCount,
        importedProductIds,
      };
    },
    {
      maxWait: 20000,
      timeout: 45000,
    }
  );

  // Broadcast live refresh across all active storefronts
  for (const cid of VALID_COLLECTION_IDS) {
    try {
      broadcastProductUpdate(cid);
    } catch {
      // Non-blocking broadcast
    }
  }

  return {
    success: true,
    mode,
    summary: {
      productsCreated: result.createdCount,
      productsUpdated: result.updatedCount,
      variantsCreated: result.createdVariantsCount,
      inventoryLogsCreated: result.inventoryAdjustmentsCount,
    },
    importedProductIds: result.importedProductIds,
  };
}

/**
 * Generates an Excel error report workbook for download when validation errors occur.
 */
export async function generateErrorReportExcel(errors = [], warnings = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amoga E-Commerce Validation Engine';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Validation Issues', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Sheet Name', key: 'sheet', width: 18 },
    { header: 'Row Number', key: 'row', width: 14 },
    { header: 'Column Name', key: 'column', width: 28 },
    { header: 'Error Code', key: 'code', width: 24 },
    { header: 'Explanation & Suggested Fix', key: 'message', width: 65 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' }, // Strong warning crimson
    };
  });

  errors.forEach((err) => {
    const r = sheet.addRow({
      severity: 'ERROR',
      sheet: err.sheet,
      row: err.row || '-',
      column: err.column,
      code: err.code,
      message: err.message,
    });
    r.getCell('severity').font = { color: { argb: 'FFDC2626' }, bold: true };
  });

  warnings.forEach((warn) => {
    const r = sheet.addRow({
      severity: 'WARNING',
      sheet: warn.sheet,
      row: warn.row || '-',
      column: warn.column,
      code: warn.code,
      message: warn.message,
    });
    r.getCell('severity').font = { color: { argb: 'FFD97706' }, bold: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
