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

## 2. Workbook Structure & Template

Always download the latest official template using the **Download Excel Template** button in the admin interface.

The template version is tracked via `AMOGA-TEMPLATE-v1.0` in the `Read Me` sheet.

### Sheets Included:
1. **Read Me**: Version tag, collection identifiers, instructions, and rules.
2. **Products**: Shared catalog fields and category-specific attributes.
3. **Variants**: Option dimensions, SKU mappings, variant pricing, and stock.
4. **Inventory**: SKU-level stock adjustment targets with warehouse locations and movement reasons.
5. **Collections**: Reference list of collection codes and descriptions.

---

## 3. Product Columns & Category Specifications

### Shared Product Fields (Sheet: `Products`)
| Column | Description | Required? | Example |
|---|---|---|---|
| `Product Code` | Unique SKU / Source identifier | Yes | `tea-himalayan-green` |
| `Collection Code` | One of `food`, `tea`, `sarees`, `jewellery` | Yes | `tea` |
| `Product Name` | Customer-facing title | Yes | `Himalayan Lemongrass Green Tea` |
| `Slug` | URL slug | Yes | `himalayan-lemongrass-green-tea` |
| `Description` | Rich markdown or plain text description | Yes | `Delicate whole leaf green tea with hand-crushed lemongrass...` |
| `Selling Price (INR)` | Selling price in Rupees (cannot be 0 if published) | Yes | `399` |
| `MRP / Compare Price (INR)`| Strikethrough price in Rupees | Optional | `499` |
| `Stock Quantity` | Base stock quantity | Yes | `50` |
| `Publication Status` | `published` or `draft` | Yes | `published` |
| `Primary Image URL` | Image URL (`.jpg`, `.jpeg`, `.png`, `.webp`) | Yes | `https://images.unsplash.com/...` |
| `Gallery Images` | Comma-separated image URLs | Optional | `https://..., https://...` |
| `Brand` | Brand name | Optional | `Amoga Wellness` |
| `Tags` | Comma-separated tags | Optional | `tea, green tea, wellness, organic` |
| `Weight (g)` | Net weight in grams | Optional | `100` |

### Category-Specific Specifications:
- **Wholesome Pantry (`food`)**:
  - `Ingredients`: Comma-separated list (e.g. `Horsegram, Black Pepper, Cumin, Sea Salt`)
  - `Allergens`: Allergen warnings (e.g. `Processed in a facility handling sesame and nuts`)
  - `Dietary Details`: e.g. `100% Vegetarian, No Preservatives, High Protein`
  - `Servings`: e.g. `10 cups`
  - `Preparation Instructions`: e.g. `Mix 1 tablespoon in 200ml boiling water for 3 minutes.`
  - `Storage Details`: e.g. `Store in a cool dry place away from direct sunlight.`
  - `FSSAI License`: e.g. `11522001000456`
- **Wellness Tea (`tea`)**:
  - `Tea Form`: e.g. `Loose Leaf`, `Pyramid Tea Bags`, `Single Estate Whole Leaf`
  - `Caffeine Level`: e.g. `Low`, `Medium`, `High`, `Caffeine Free`
  - `Brewing Temp`: e.g. `85°C - 90°C`
  - `Brewing Time`: e.g. `3 - 4 minutes`
  - `Serving Size`: e.g. `2g per 200ml cup`
- **Heritage Sarees (`sarees`)**:
  - `Fabric`: e.g. `Pure Kanchipuram Silk`, `Mysore Crepe Silk`, `Banarasi Georgette`
  - `Weave Type`: e.g. `Korvai Handloom`, `Jacquard Zari Weave`
  - `Saree Length`: e.g. `5.5 Metres`
  - `Blouse Piece`: e.g. `Included (0.8 Metres Unstitched)`
  - `Colour`: e.g. `Crimson Red & Antique Gold`
  - `Border`: e.g. `Traditional Temple Zari Border`
  - `Care Instructions`: e.g. `Dry Clean Only. Store in muslin wrap.`
- **Sterling Silver (`jewellery`)**:
  - `Jewellery Type`: e.g. `Stud Earrings`, `Choker Necklace`, `Stackable Ring`
  - `Metal Type`: e.g. `925 Sterling Silver`
  - `Verified Purity`: e.g. `92.5% Fine Silver`
  - `Metal Weight (g)`: e.g. `4.2`
  - `Stone Details`: e.g. `AAA Grade Cubic Zirconia`
  - `Plating`: e.g. `Rhodium Anti-Tarnish Finish`, `18K Gold Vermeil`
  - `Hallmark Info`: e.g. `BIS 925 Hallmarked`

---

## 4. Import Modes

1. **Create New Products (`CREATE_NEW`)**:
   - Creates new products that do not exist yet.
   - Rejects any rows with product codes, slugs, or SKUs already present in the database.
   - Prevents accidental overwrites.
2. **Update Existing Products (`UPDATE_EXISTING`)**:
   - Matches records using `Product Code` or `Slug`.
   - Updates title, description, prices, images, and category attributes.
   - Preserves historical records, existing variants, and orders.
3. **Initial Inventory Import (`INITIAL_INVENTORY`)**:
   - Dedicated mode to initialize or adjust inventory.
   - Creates immutable `InventoryLog` ledger entries (`INVENTORY_IMPORT` / `INITIAL_STOCK`).
   - Maintains audit trails with administrator ID and timestamp.

---

## 5. Pricing & Publication Safety Rules

- **Drafts by Default**: Products can be imported as `draft` for internal review.
- **Unpriced Products Cannot Be Published**: The system will automatically reject any row marked as `published` if the price is missing or zero.
- **Atomic Transactions**: If any unrecoverable database error occurs, Prisma rolls back the entire batch, preventing half-imported products or orphaned variants.
- **Automatic Storefront Synchronization**: Upon successful import, the server notifies all active storefront clients to refresh their catalog cache in real-time.

---

## 6. Error Handling & Downloadable Reports

If any validation issue occurs:
1. The admin UI displays the exact **Sheet Name**, **Row Number**, **Column Name**, and human-readable reason.
2. The **Import Products** button is locked until errors are resolved.
3. Click **Download Error Report** to receive an Excel file containing all failed rows and error details.
