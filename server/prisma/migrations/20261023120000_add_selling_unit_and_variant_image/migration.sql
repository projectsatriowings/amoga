-- Safe Additive Migration: Add sellingUnit to products and image to product_variants
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sellingUnit" TEXT DEFAULT 'Pack';
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "image" TEXT;
