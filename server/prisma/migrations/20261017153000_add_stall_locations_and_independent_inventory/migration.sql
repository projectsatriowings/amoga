-- Add stockLocationId to pos_sales
ALTER TABLE "pos_sales" ADD COLUMN IF NOT EXISTS "stockLocationId" TEXT;

-- CreateTable stock_locations
CREATE TABLE IF NOT EXISTS "stock_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STALL',
    "stallEventId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable location_inventories
CREATE TABLE IF NOT EXISTS "location_inventories" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "onHandQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 5,
    "lastMovementAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable stock_transfers
CREATE TABLE IF NOT EXISTS "stock_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceLocationId" TEXT NOT NULL,
    "destinationLocationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "initiatedById" TEXT,
    "initiatedByEmail" TEXT NOT NULL,
    "receivedById" TEXT,
    "receivedByEmail" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "transferredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable stock_transfer_items
CREATE TABLE IF NOT EXISTS "stock_transfer_items" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER,
    "notes" TEXT,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable location_movement_logs
CREATE TABLE IF NOT EXISTS "location_movement_logs" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "previousQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "movementType" TEXT NOT NULL,
    "reference" TEXT,
    "actorEmail" TEXT NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_movement_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "stock_locations_code_key" ON "stock_locations"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_locations_stallEventId_key" ON "stock_locations"("stallEventId");
CREATE INDEX IF NOT EXISTS "stock_locations_type_idx" ON "stock_locations"("type");
CREATE INDEX IF NOT EXISTS "stock_locations_isActive_idx" ON "stock_locations"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "location_inventories_locationId_productId_variantId_key" ON "location_inventories"("locationId", "productId", "variantId");
CREATE INDEX IF NOT EXISTS "location_inventories_locationId_idx" ON "location_inventories"("locationId");
CREATE INDEX IF NOT EXISTS "location_inventories_productId_idx" ON "location_inventories"("productId");
CREATE INDEX IF NOT EXISTS "location_inventories_variantId_idx" ON "location_inventories"("variantId");

CREATE UNIQUE INDEX IF NOT EXISTS "stock_transfers_transferNumber_key" ON "stock_transfers"("transferNumber");
CREATE INDEX IF NOT EXISTS "stock_transfers_sourceLocationId_idx" ON "stock_transfers"("sourceLocationId");
CREATE INDEX IF NOT EXISTS "stock_transfers_destinationLocationId_idx" ON "stock_transfers"("destinationLocationId");
CREATE INDEX IF NOT EXISTS "stock_transfers_status_idx" ON "stock_transfers"("status");
CREATE INDEX IF NOT EXISTS "stock_transfers_createdAt_idx" ON "stock_transfers"("createdAt");

CREATE INDEX IF NOT EXISTS "stock_transfer_items_transferId_idx" ON "stock_transfer_items"("transferId");
CREATE INDEX IF NOT EXISTS "stock_transfer_items_productId_idx" ON "stock_transfer_items"("productId");

CREATE INDEX IF NOT EXISTS "location_movement_logs_locationId_idx" ON "location_movement_logs"("locationId");
CREATE INDEX IF NOT EXISTS "location_movement_logs_productId_idx" ON "location_movement_logs"("productId");
CREATE INDEX IF NOT EXISTS "location_movement_logs_reference_idx" ON "location_movement_logs"("reference");
CREATE INDEX IF NOT EXISTS "location_movement_logs_createdAt_idx" ON "location_movement_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "pos_sales_stockLocationId_idx" ON "pos_sales"("stockLocationId");

-- Foreign key constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_locations_stallEventId_fkey') THEN
        ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_stallEventId_fkey" FOREIGN KEY ("stallEventId") REFERENCES "stall_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_sales_stockLocationId_fkey') THEN
        ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_inventories_locationId_fkey') THEN
        ALTER TABLE "location_inventories" ADD CONSTRAINT "location_inventories_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_inventories_productId_fkey') THEN
        ALTER TABLE "location_inventories" ADD CONSTRAINT "location_inventories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_inventories_variantId_fkey') THEN
        ALTER TABLE "location_inventories" ADD CONSTRAINT "location_inventories_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfers_sourceLocationId_fkey') THEN
        ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfers_destinationLocationId_fkey') THEN
        ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfer_items_transferId_fkey') THEN
        ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfer_items_productId_fkey') THEN
        ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfer_items_variantId_fkey') THEN
        ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_movement_logs_locationId_fkey') THEN
        ALTER TABLE "location_movement_logs" ADD CONSTRAINT "location_movement_logs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_movement_logs_productId_fkey') THEN
        ALTER TABLE "location_movement_logs" ADD CONSTRAINT "location_movement_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_movement_logs_variantId_fkey') THEN
        ALTER TABLE "location_movement_logs" ADD CONSTRAINT "location_movement_logs_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
