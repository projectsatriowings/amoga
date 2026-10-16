import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';

describe('Admin Create/Edit Product Form Optimization Suite', () => {
  const baseUrl = 'http://localhost:5001';
  let catalogueToken = '';
  const createdProductIds = [];

  before(async () => {
    // Authenticate as Catalogue Manager
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'catalogue@amoga.com',
        password: 'Catalogue@Amoga2026!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    catalogueToken = loginJson.token;
    assert.ok(catalogueToken, 'Catalogue token must be acquired');
  });

  after(async () => {
    // Clean up created products and variants
    for (const id of createdProductIds) {
      try {
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        await prisma.inventoryLog.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });
      } catch {
        // Ignore deletion errors during teardown
      }
    }
  });

  // ================= 1. SIMPLE PRODUCTS ACROSS 4 COLLECTIONS =================
  describe('1. Simple Product Creation Across All 4 Collections', () => {
    it('creates Wholesome Pantry product with auto-SKU AMOGA-MAS or AMOGA-SOUP', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Artisanal Madras Gunpowder Podi',
          collectionId: 'food',
          category: 'podis',
          categoryName: 'Rice Podis',
          price: 249,
          originalPrice: 299,
          stockQuantity: 50,
          inStock: true,
          status: 'active',
          hsnCode: '2103',
          gstRate: 5,
          isTaxInclusive: true,
          specs: {
            shelfLife: '9 Months',
            storage: 'Airtight container',
            dietary: 'Gluten-Free, Vegan',
          },
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.product.id);
      createdProductIds.push(data.product.id);

      assert.match(data.product.sku, /^AMOGA-POD\d{3,}$/);
      assert.equal(data.product.price, 249);
      assert.equal(data.product.isActive, true);
      assert.equal(data.product.slug, 'artisanal-madras-gunpowder-podi');
    });

    it('creates Wellness Tea product with auto-SKU AMOGA-TEA', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Nilgiri Scarlet Hibiscus Infusion',
          collectionId: 'tea',
          category: 'flower',
          categoryName: 'Botanical Flower Brews',
          price: 399,
          stockQuantity: 30,
          inStock: true,
          status: 'active',
          hsnCode: '0902',
          gstRate: 5,
          isTaxInclusive: true,
          specs: {
            teaForm: 'Whole Dried Calyces',
            steepTime: '4 mins at 90°C',
            storage: 'Store airtight in cool shade',
          },
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      createdProductIds.push(data.product.id);

      assert.match(data.product.sku, /^AMOGA-TEA\d{3,}$/);
      assert.equal(data.product.price, 399);
      assert.equal(data.product.isActive, true);
    });

    it('creates Heritage Sarees product with auto-SKU AMOGA-SAR', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Kanchipuram Korvai Temple Silk Saree',
          collectionId: 'sarees',
          category: 'silk',
          categoryName: 'Silk Sarees',
          price: 24500,
          originalPrice: 28000,
          stockQuantity: 5,
          inStock: true,
          status: 'active',
          hsnCode: '5007',
          gstRate: 5,
          isTaxInclusive: true,
          specs: {
            fabric: '100% Pure Mulberry Silk',
            sareeLength: '6.3m (including blouse)',
            blousePiece: 'Contrast Mulberry Silk (80cm)',
            careInstructions: 'Strictly Dry Clean Only',
          },
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      createdProductIds.push(data.product.id);

      assert.match(data.product.sku, /^AMOGA-SAR\d{3,}$/);
      assert.equal(data.product.price, 24500);
      assert.equal(data.product.isActive, true);
    });

    it('creates Silver Jewellery product with auto-SKU AMOGA-SIL', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Solstice Moonstone Statement Ring in 925 Silver',
          collectionId: 'jewellery',
          category: 'rings',
          categoryName: 'Rings',
          price: 3499,
          stockQuantity: 15,
          inStock: true,
          status: 'active',
          hsnCode: '7113',
          gstRate: 3,
          isTaxInclusive: true,
          specs: {
            metal: '925 Sterling Silver',
            gemstone: 'Natural Rainbow Moonstone',
            weight: '5.8g',
            dimensions: 'US 7',
            plating: 'Anti-Tarnish Rhodium Plating',
          },
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      createdProductIds.push(data.product.id);

      assert.match(data.product.sku, /^AMOGA-SIL\d{3,}$/);
      assert.equal(data.product.price, 3499);
      assert.equal(data.product.isActive, true);
    });
  });

  // ================= 2. PRODUCTS WITH VARIANTS =================
  describe('2. Multi-Variant Products & Sequential Variant SKUs', () => {
    it('creates product with child variants inheriting parent SKU prefix with unique suffix', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Organic Sprouted Ragi Malt',
          collectionId: 'food',
          category: 'millets',
          price: 199,
          stockQuantity: 100,
          status: 'active',
          hsnCode: '1106',
          gstRate: 5,
          variants: [
            { name: '250g Glass Jar', price: 199, stockQuantity: 60 },
            { name: '500g Value Pack', price: 349, stockQuantity: 40 },
          ],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      createdProductIds.push(data.product.id);

      const parentSku = data.product.sku;
      assert.ok(parentSku);
      assert.equal(data.product.variants.length, 2);

      // Verify variant SKUs
      assert.equal(data.product.variants[0].sku, `${parentSku}-V01`);
      assert.equal(Number(data.product.variants[0].price), 199);
      assert.equal(data.product.variants[1].sku, `${parentSku}-V02`);
      assert.equal(Number(data.product.variants[1].price), 349);
    });
  });

  // ================= 3. DRAFT VS ACTIVE VALIDATION RULES =================
  describe('3. Draft vs Active Business Rules & Safeguards', () => {
    it('allows saving as Draft without final price or tax details', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Bespoke Heirloom Royal Kanchipuram (Custom Order)',
          collectionId: 'sarees',
          category: 'silk',
          price: null, // Unpriced draft
          hsnCode: '', // Missing tax details
          gstRate: null,
          status: 'draft',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      createdProductIds.push(data.product.id);

      assert.equal(data.product.isActive, false);
      assert.equal(data.product.price, null);
    });

    it('blocks publishing as Active when price is missing', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Unpriced Active Attempt',
          collectionId: 'tea',
          category: 'flower',
          price: null,
          status: 'active',
          hsnCode: '0902',
          gstRate: 5,
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'TAX_COMPLIANCE_REQUIRED');
      assert.ok(data.message.includes('valid selling price is required'));
    });

    it('blocks publishing as Active when tax details are missing', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Untaxed Active Attempt',
          collectionId: 'tea',
          category: 'flower',
          price: 299,
          status: 'active',
          hsnCode: '', // Missing HSN
          gstRate: null,
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'TAX_COMPLIANCE_REQUIRED');
      assert.ok(data.message.includes('HSN code is required'));
    });
  });

  // ================= 4. CUSTOM SKU VALIDATION =================
  describe('4. Custom SKU Format & Duplicate Prevention', () => {
    it('accepts valid custom SKU and stores uppercase', async () => {
      const customSku = `AMOGA-CUSTOM-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogueToken}`,
        },
        body: JSON.stringify({
          name: 'Special Edition Artisanal Reserve',
          collectionId: 'tea',
          category: 'herbal',
          sku: customSku,
          price: 499,
          hsnCode: '0902',
          gstRate: 5,
          status: 'active',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      createdProductIds.push(data.product.id);
      assert.equal(data.product.sku, customSku);
    });

    it('rejects duplicate SKU with HTTP 400', async () => {
      const existingProduct = await prisma.product.findFirst({
        where: { sku: { not: null } },
        select: { sku: true },
      });

      if (existingProduct?.sku) {
        const res = await fetch(`${baseUrl}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${catalogueToken}`,
          },
          body: JSON.stringify({
            name: 'Duplicate SKU Attempt Product',
            collectionId: 'tea',
            category: 'herbal',
            sku: existingProduct.sku,
            price: 299,
            status: 'draft',
          }),
        });

        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.error, 'INVALID_SKU');
        assert.ok(data.message.includes('already in use'));
      }
    });
  });
});
