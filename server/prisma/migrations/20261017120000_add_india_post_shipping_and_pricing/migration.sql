-- AMOGA INDIA POST SHIPPING RULES & GST-INCLUSIVE PRICING SYSTEM
-- Migration: 20261017120000_add_india_post_shipping_and_pricing
-- Strictly safe, additive only, non-destructive

-- 1. Alter StoreSetting to support India Post shipping brackets, carrier configuration, and threshold comparison
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingCarrierName" TEXT DEFAULT 'India Post';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingRulesEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingThresholdOperator" TEXT NOT NULL DEFAULT 'GTE';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingBrackets" JSONB DEFAULT '[{"minQty":1,"maxQty":2,"charge":100},{"minQty":3,"maxQty":3,"charge":150},{"minQty":4,"maxQty":4,"charge":200}]'::jsonb;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingBeyondMaxRule" TEXT NOT NULL DEFAULT 'PER_PIECE';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingBeyondMaxBaseCharge" DECIMAL(10,2) NOT NULL DEFAULT 200.00;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingBeyondMaxChargePerPiece" DECIMAL(10,2) NOT NULL DEFAULT 50.00;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingConfiguredBy" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "shippingConfiguredAt" TIMESTAMP(3);

-- Safely update default store settings threshold to 2500.00 if at initial 2000.00
UPDATE "store_settings"
SET "freeShippingThreshold" = 2500.00,
    "shippingCarrierName" = COALESCE("shippingCarrierName", 'India Post'),
    "shippingRulesEnabled" = COALESCE("shippingRulesEnabled", true),
    "shippingThresholdOperator" = COALESCE("shippingThresholdOperator", 'GTE'),
    "shippingBrackets" = COALESCE("shippingBrackets", '[{"minQty":1,"maxQty":2,"charge":100},{"minQty":3,"maxQty":3,"charge":150},{"minQty":4,"maxQty":4,"charge":200}]'::jsonb),
    "shippingBeyondMaxRule" = COALESCE("shippingBeyondMaxRule", 'PER_PIECE'),
    "shippingBeyondMaxBaseCharge" = COALESCE("shippingBeyondMaxBaseCharge", 200.00),
    "shippingBeyondMaxChargePerPiece" = COALESCE("shippingBeyondMaxChargePerPiece", 50.00)
WHERE "id" = 'default' AND ("freeShippingThreshold" = 2000.00 OR "freeShippingThreshold" IS NULL);

-- 2. Alter Order to persist immutable shipping and pricing snapshots
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingSnapshot" JSONB;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pricingSnapshot" JSONB;

-- 3. Alter OrderItem to persist immutable item pricing snapshot
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "pricingSnapshot" JSONB;
