-- AMOGA ASSISTED GST/HSN CLASSIFICATION & VERIFIED RATE MASTER SYSTEM
-- Migration: 20261016163000_add_gst_hsn_system
-- Additive only, non-destructive

-- 1. Alter Product to add assisted tax workflow fields
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxTreatment" TEXT DEFAULT 'TAXABLE';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxVerificationStatus" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxConfirmedBy" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxConfirmedAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxNotes" TEXT;

-- 2. Alter ProductVariant to support variant-level tax overrides
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "taxTreatment" TEXT DEFAULT 'TAXABLE';
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "taxVerificationStatus" TEXT DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "taxConfirmedBy" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "taxConfirmedAt" TIMESTAMP(3);
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "taxNotes" TEXT;

-- 3. Alter StoreSetting to support checkout tax verification enforcement
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "requireTaxVerificationForCheckout" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "strictTaxCompliance" BOOLEAN NOT NULL DEFAULT false;

-- 4. Create HSN Reference Catalogue Table
CREATE TABLE IF NOT EXISTS "hsn_references" (
    "id" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "codeLength" INTEGER NOT NULL,
    "sourceFileName" TEXT NOT NULL DEFAULT 'HSN_SAC.pdf',
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hsn_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hsn_references_hsnCode_idx" ON "hsn_references"("hsnCode");
CREATE INDEX IF NOT EXISTS "hsn_references_level_idx" ON "hsn_references"("level");

-- 5. Create Verified GST Rate Master Table
CREATE TABLE IF NOT EXISTS "gst_rate_master" (
    "id" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "taxTreatment" TEXT NOT NULL DEFAULT 'TAXABLE',
    "cessRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "officialSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gst_rate_master_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gst_rate_master_hsnCode_idx" ON "gst_rate_master"("hsnCode");
CREATE INDEX IF NOT EXISTS "gst_rate_master_status_idx" ON "gst_rate_master"("status");
