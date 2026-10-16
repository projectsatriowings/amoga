# AMOGA — Excel Bulk Product Import Guide

## Overview

The AMOGA Bulk Product Import system allows authorized Catalogue Managers and Admins to upload, validate, preview, and persist multiple products across all 4 collections:

1. **Wholesome Pantry (`food`)**
2. **Wellness Tea (`tea`)**
3. **Heritage Sarees (`sarees`)**
4. **Sterling Silver (`jewellery`)**

---

## 1. Accessing Bulk Product Upload

- **Navigation**: Open the Admin Panel (`/admin`) → click **Products** in the sidebar → select **Bulk Product Upload** (or click the **Bulk Upload** button on the Products list page).
- **Command Palette**: Press `Ctrl+K` (or `Cmd+K`) and type `bulk upload` to jump directly to the tool.
- **Required Permission**: `CATALOGUE_MANAGER` or higher.

---

## 2. Workbook Structure & Sheets

Always download the latest official template using the **Download Excel Template** button in the admin interface.

The template version is tracked via `AMOGA-TEMPLATE-v1.0` in the `Start Here` sheet.

### Sheets Included:
1. **`Start Here`**: Instructions, mandatory-field legend (`*`), step-by-step import workflow, and image URL guidance.
2. **`Products`**: Common product fields plus category-specific attribute groups.
3. **`Variants`**: Color, size, weight, and option variants mapped to parent products.
4. **`Inventory`**: SKU-level stock adjustment targets with audit movement reasons.
5. **`Field Guide`**: Complete column-by-column reference with required/optional status, collection scope, accepted formats, and real examples.
6. **`Collections & Categories`**: Master reference list of all supported collection codes, category codes, and category display names.

---

## 3. Mandatory vs. Optional Fields

### Mandatory Common Fields (Marked with `*` in Header Row)
A product **CANNOT** be created if any of these columns are empty:

| Header in Sheet | DB Mapping | Requirement | Accepted Values / Rules |
|---|---|---|---|
| `Collection Code *` | `collectionId` | **MANDATORY \*** | One of: `food`, `tea`, `sarees`, `jewellery` |
| `Product Code *` | `sourceId` | **MANDATORY \*** | Unique identifier per product (e.g. `f-moringa-01`) |
| `Product Name *` | `name` | **MANDATORY \*** | Customer-facing title |
| `Category Code *` | `category` | **MANDATORY \*** | Must match an approved category code for that collection |
| `Description *` | `description` | **MANDATORY \*** | Informative description of product |
| `Primary Image URL *` | `image` | **MANDATORY \*** | Valid HTTPS URL or root path (`/images/...` or `/uploads/...`) |

### Core Optional Fields (Blank values are safely defaulted)
| Header in Sheet | DB Mapping | Requirement | Default / Auto-handling |
|---|---|---|---|
| `Slug (Auto-generated if blank)` | `slug` | **OPTIONAL** | If left empty, **automatically generated** from `Product Name` (e.g. `organic-moringa-pepper-soup`) |
| `Category Name` | `categoryName` | **OPTIONAL** | Auto-filled from Category Code if blank |
| `Tagline` | `tagline` | **OPTIONAL** | Short subtitle under product title |
| `Gallery Image URLs` | `gallery` | **OPTIONAL** | Comma-separated secondary image URLs |
| `Pack Size / Weight` | `packSize` | **OPTIONAL** | Measurement text (e.g. `150 g`, `Standard 6.3m`) |
| `Selling Price (INR)` | `price` | **CONDITIONAL** | Required if `Publication Status` is `Published` (unless priced via Variants). Products without a price are saved as **Draft**. |
| `MRP / Compare Price (INR)`| `originalPrice` | **OPTIONAL** | Strikethrough price in Rupees (e.g. `299`) |
| `Discount Label` | `discount` | **OPTIONAL** | Promo badge (e.g. `17% OFF`) |
| `Publication Status` | `isActive` | **OPTIONAL** | `Draft` (default) or `Published` |
| `In Stock` | `inStock` | **OPTIONAL** | `Yes` (default) or `No` |
| `Stock Quantity` | `stockQuantity` | **OPTIONAL** | Available units. Defaults to `50` |
| `Low Stock Threshold` | `lowStockThreshold`| **OPTIONAL** | Reorder threshold. Defaults to `5` |
| `Featured` | `isFeatured` | **OPTIONAL** | `Yes` or `No` (defaults to `No`) |
| `Badge` | `badge` | **OPTIONAL** | e.g. `Bestseller`, `Silk Mark`, `BIS 925` |
| `Tags` | search tags | **OPTIONAL** | Comma-separated search keywords |

---

## 4. Category-Specific Fields (Enrichment Only)

Category-specific columns enrich filtering, technical specifications, and compliance details. They are **never blocking** for products of another collection:

### Wholesome Pantry (`food`)
- `Pantry: Ingredients` (Recommended for FSSAI compliance)
- `Pantry: Allergens`
- `Pantry: Dietary Details`
- `Pantry: Pack Weight / Size`
- `Pantry: Servings`
- `Pantry: Preparation Instructions`
- `Pantry: Storage Instructions`
- `Pantry: Shelf Life`
- `Pantry: FSSAI / Compliance`

### Wellness Tea (`tea`)
- `Tea: Ingredients` (Recommended)
- `Tea: Type`
- `Tea: Form`
- `Tea: Caffeine Info`
- `Tea: Brewing Temp (°C)`
- `Tea: Brewing Time (mins)`
- `Tea: Serving Size`
- `Tea: Harvest Season`
- `Tea: Storage Instructions`
- `Tea: Disclaimer`

### Heritage Sarees (`sarees`)
- `Sarees: Fabric` (Recommended)
- `Sarees: Weave Type`
- `Sarees: Length (m)`
- `Sarees: Blouse Piece Details`
- `Sarees: Primary Colour`
- `Sarees: Border Details`
- `Sarees: Occasion`
- `Sarees: Care Instructions`
- `Sarees: Authenticity / Mark`

### Sterling Silver (`jewellery`)
- `Jewellery: Type` (Recommended)
- `Jewellery: Metal Type` (Recommended)
- `Jewellery: Verified Purity`
- `Jewellery: Gross Weight (g)`
- `Jewellery: Stone Details`
- `Jewellery: Plating / Finish`
- `Jewellery: Size`
- `Jewellery: Hallmark Details`
- `Jewellery: Care Instructions`

---

## 5. Image URL Guidance

- `Primary Image URL *` must contain a publicly accessible web URL (`https://...`) or an internal path (`/images/...` or `/uploads/...`).
- **Do NOT use local computer paths** (e.g. `C:\Users\admin\Desktop\photo.jpg` or `file:///...`). The server and customers cannot view files from your local hard drive.
- **How to upload image files**:
  1. Open Admin Panel → Products → **Add Product**.
  2. Click **Upload File** in the Media section to select files from your computer.
  3. The system stores the file in `/uploads/` and provides the exact path for your spreadsheet.

---

## 6. Pricing & Publication Rules

1. **Unpriced Products Cannot Be Published**:
   - If `Publication Status` is `Published`, the product must have a positive selling price (> ₹0) either on the `Products` sheet or on its child `Variants` sheet.
   - Products without a price are automatically held in **Draft** mode.
2. **Variant-Priced Products**:
   - If items vary in price by size, color, or weight, leave the product-level price blank (or at the base price) and enter specific variant prices on the `Variants` sheet.

---

## 7. Import Modes

1. **Create New Products (`CREATE_NEW`)**:
   - Inserts products that do not exist yet.
   - Rejects duplicate product codes or slugs to prevent accidental overwrites.
2. **Update Existing Products (`UPDATE_EXISTING`)**:
   - Matches records by `Product Code` or `Slug`.
   - Safely updates descriptions, images, prices, category specs, and variants.
3. **Initial Inventory Import (`INITIAL_INVENTORY`)**:
   - Uses the `Inventory` sheet to adjust warehouse stock counts.
   - Creates immutable `InventoryLog` audit entries with timestamp and administrator email.
