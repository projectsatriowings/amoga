-- AMOGA INVENTORY MANAGEMENT & RESTOCK NOTIFICATION SYSTEM
-- Migration: 20261014000000_add_inventory_system
-- Additive only, non-destructive

-- 1. Alter Product and ProductVariant to track reserved stock & configurable low-stock threshold
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reservedQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "reservedQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- 2. Enhance InventoryLog with order linkage, actor identification, and event types
ALTER TABLE "inventory_logs" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "inventory_logs" ADD COLUMN IF NOT EXISTS "actor" TEXT;
ALTER TABLE "inventory_logs" ADD COLUMN IF NOT EXISTS "type" TEXT;

-- 3. Create Inventory Reservations Table for Concurrency-Safe Checkout
CREATE TABLE IF NOT EXISTS "inventory_reservations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderReference" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- 4. Create Customer Restock Subscriptions Table
CREATE TABLE IF NOT EXISTS "restock_subscriptions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "customerId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "destination" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notifiedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restock_subscriptions_pkey" PRIMARY KEY ("id")
);

-- 5. Create Inventory Alerts Table for Threshold Deduplication
CREATE TABLE IF NOT EXISTS "inventory_alerts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "alertType" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_alerts_pkey" PRIMARY KEY ("id")
);

-- 6. Create Restock Notification Jobs Table for Asynchronous Notification Lifecycle
CREATE TABLE IF NOT EXISTS "restock_notification_jobs" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "recipientType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "destination" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "restock_notification_jobs_pkey" PRIMARY KEY ("id")
);

-- Indexes for high-performance concurrent lookups
CREATE INDEX IF NOT EXISTS "inventory_reservations_status_expiresAt_idx" ON "inventory_reservations"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "inventory_reservations_orderId_idx" ON "inventory_reservations"("orderId");
CREATE INDEX IF NOT EXISTS "inventory_reservations_orderReference_idx" ON "inventory_reservations"("orderReference");
CREATE INDEX IF NOT EXISTS "inventory_reservations_productId_variantId_idx" ON "inventory_reservations"("productId", "variantId");

CREATE INDEX IF NOT EXISTS "restock_subscriptions_productId_variantId_status_idx" ON "restock_subscriptions"("productId", "variantId", "status");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_destination_idx" ON "restock_subscriptions"("destination");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_customerId_idx" ON "restock_subscriptions"("customerId");

CREATE INDEX IF NOT EXISTS "inventory_alerts_productId_variantId_status_idx" ON "inventory_alerts"("productId", "variantId", "status");
CREATE INDEX IF NOT EXISTS "inventory_alerts_createdAt_idx" ON "inventory_alerts"("createdAt");

CREATE INDEX IF NOT EXISTS "restock_notification_jobs_status_createdAt_idx" ON "restock_notification_jobs"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "restock_notification_jobs_productId_variantId_idx" ON "restock_notification_jobs"("productId", "variantId");

-- Foreign key constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_productId_fkey') THEN
        ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_variantId_fkey') THEN
        ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restock_subscriptions_productId_fkey') THEN
        ALTER TABLE "restock_subscriptions" ADD CONSTRAINT "restock_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restock_subscriptions_variantId_fkey') THEN
        ALTER TABLE "restock_subscriptions" ADD CONSTRAINT "restock_subscriptions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restock_subscriptions_customerId_fkey') THEN
        ALTER TABLE "restock_subscriptions" ADD CONSTRAINT "restock_subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_alerts_productId_fkey') THEN
        ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_alerts_variantId_fkey') THEN
        ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
