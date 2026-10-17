-- CreateTable
CREATE TABLE IF NOT EXISTS "stall_events" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "stateCode" TEXT DEFAULT '33',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "openingCashBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "assignedStaffIds" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stall_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pos_sales" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "publicReceiptToken" TEXT NOT NULL,
    "stallEventId" TEXT,
    "staffId" TEXT,
    "staffEmail" TEXT NOT NULL,
    "staffName" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "customerGstin" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "paymentReference" TEXT,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "changeDue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountReason" TEXT,
    "discountApprovedBy" TEXT,
    "taxableAmount" DECIMAL(10,2) NOT NULL,
    "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalTaxAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "totalItemsCount" INTEGER NOT NULL DEFAULT 0,
    "taxSnapshot" JSONB,
    "pricingSnapshot" JSONB,
    "whatsappDeliveryStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "whatsappMessageId" TEXT,
    "whatsappSentAt" TIMESTAMP(3),
    "whatsappError" TEXT,
    "whatsappOptOutTextIncluded" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "refundedAmount" DECIMAL(10,2) DEFAULT 0.00,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pos_sale_items" (
    "id" TEXT NOT NULL,
    "posSaleId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "collectionId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "sku" TEXT,
    "hsnCode" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "isTaxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "taxableAmount" DECIMAL(10,2) NOT NULL,
    "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalTax" DECIMAL(10,2) NOT NULL,
    "pricingSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pos_payment_records" (
    "id" TEXT NOT NULL,
    "posSaleId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pos_sequences" (
    "prefix" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sequences_pkey" PRIMARY KEY ("prefix")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pos_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultStallId" TEXT,
    "enableBarcodeScanner" BOOLEAN NOT NULL DEFAULT true,
    "enableThermalPrint" BOOLEAN NOT NULL DEFAULT true,
    "receiptPrinterWidth" TEXT NOT NULL DEFAULT '80mm',
    "enableWhatsAppReceipt" BOOLEAN NOT NULL DEFAULT true,
    "whatsAppChannel" TEXT NOT NULL DEFAULT 'MANUAL',
    "whatsAppPhoneNumberId" TEXT,
    "whatsAppTemplateName" TEXT DEFAULT 'amoga_pos_bill',
    "maxDiscountPercentWithoutApproval" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "requireCustomerPhone" BOOLEAN NOT NULL DEFAULT false,
    "posPrefix" TEXT NOT NULL DEFAULT 'AMOGA-POS-2026/',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "stall_events_code_key" ON "stall_events"("code");
CREATE INDEX IF NOT EXISTS "stall_events_status_idx" ON "stall_events"("status");
CREATE INDEX IF NOT EXISTS "stall_events_startDate_endDate_idx" ON "stall_events"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pos_sales_billNumber_key" ON "pos_sales"("billNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "pos_sales_idempotencyKey_key" ON "pos_sales"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "pos_sales_publicReceiptToken_key" ON "pos_sales"("publicReceiptToken");
CREATE INDEX IF NOT EXISTS "pos_sales_billNumber_idx" ON "pos_sales"("billNumber");
CREATE INDEX IF NOT EXISTS "pos_sales_stallEventId_idx" ON "pos_sales"("stallEventId");
CREATE INDEX IF NOT EXISTS "pos_sales_staffEmail_idx" ON "pos_sales"("staffEmail");
CREATE INDEX IF NOT EXISTS "pos_sales_status_idx" ON "pos_sales"("status");
CREATE INDEX IF NOT EXISTS "pos_sales_paymentStatus_idx" ON "pos_sales"("paymentStatus");
CREATE INDEX IF NOT EXISTS "pos_sales_createdAt_idx" ON "pos_sales"("createdAt");
CREATE INDEX IF NOT EXISTS "pos_sales_customerPhone_idx" ON "pos_sales"("customerPhone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pos_sale_items_posSaleId_idx" ON "pos_sale_items"("posSaleId");
CREATE INDEX IF NOT EXISTS "pos_sale_items_productId_idx" ON "pos_sale_items"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pos_payment_records_posSaleId_idx" ON "pos_payment_records"("posSaleId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_stallEventId_fkey" FOREIGN KEY ("stallEventId") REFERENCES "stall_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pos_sale_items" ADD CONSTRAINT "pos_sale_items_posSaleId_fkey" FOREIGN KEY ("posSaleId") REFERENCES "pos_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pos_sale_items" ADD CONSTRAINT "pos_sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pos_sale_items" ADD CONSTRAINT "pos_sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pos_payment_records" ADD CONSTRAINT "pos_payment_records_posSaleId_fkey" FOREIGN KEY ("posSaleId") REFERENCES "pos_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
