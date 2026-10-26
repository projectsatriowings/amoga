-- Migration: 20261026110000_add_returns_and_fssai_compliance
-- Safe additive migration for return policy management, secure evidence tracking, and FSSAI business compliance

-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE "ReturnRequestReason" AS ENUM ('DAMAGED_PRODUCT', 'INCORRECT_PRODUCT', 'TRANSIT_SEAL_BROKEN', 'DEFECTIVE_OR_SPOILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReturnRequestStatus" AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'INFO_REQUESTED',
    'APPROVED',
    'PICKUP_SCHEDULED',
    'RECEIVED_AT_FACILITY',
    'INSPECTED_PASSED',
    'INSPECTED_REJECTED',
    'REPLACEMENT_DISPATCHED',
    'REFUND_APPROVED',
    'REFUND_COMPLETED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReturnResolutionType" AS ENUM ('REPLACEMENT', 'REFUND');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create return_requests Table
CREATE TABLE IF NOT EXISTS "return_requests" (
  "id" TEXT NOT NULL,
  "returnReference" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT,
  "reason" "ReturnRequestReason" NOT NULL,
  "resolutionPreference" "ReturnResolutionType" NOT NULL DEFAULT 'REPLACEMENT',
  "description" TEXT NOT NULL,
  "status" "ReturnRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "adminNotes" TEXT,
  "rejectionReason" TEXT,
  "infoRequestedDetails" TEXT,
  "inspectionNotes" TEXT,
  "inspectedBy" TEXT,
  "inspectedAt" TIMESTAMP(3),
  "returnCarrier" TEXT,
  "returnTrackingNumber" TEXT,
  "pickupScheduledAt" TIMESTAMP(3),
  "receivedAtFacilityAt" TIMESTAMP(3),
  "refundAmount" DECIMAL(10,2),
  "refundReference" TEXT,
  "refundStatus" TEXT DEFAULT 'NOT_APPLICABLE',
  "refundedAt" TIMESTAMP(3),
  "replacementOrderReference" TEXT,
  "replacementDispatchedAt" TIMESTAMP(3),
  "isRestocked" BOOLEAN NOT NULL DEFAULT false,
  "restockedAt" TIMESTAMP(3),
  "restockedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- 3. Create return_request_items Table
CREATE TABLE IF NOT EXISTS "return_request_items" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "productName" TEXT NOT NULL,
  "variantName" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "lineTotal" DECIMAL(10,2) NOT NULL,
  "itemConditionNotes" TEXT,

  CONSTRAINT "return_request_items_pkey" PRIMARY KEY ("id")
);

-- 4. Create return_evidences Table
CREATE TABLE IF NOT EXISTS "return_evidences" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "return_evidences_pkey" PRIMARY KEY ("id")
);

-- 5. Create return_status_histories Table
CREATE TABLE IF NOT EXISTS "return_status_histories" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "fromStatus" "ReturnRequestStatus",
  "toStatus" "ReturnRequestStatus" NOT NULL,
  "changedBy" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL DEFAULT 'ADMIN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "return_status_histories_pkey" PRIMARY KEY ("id")
);

-- 6. Add FSSAI & Return Policy Fields to store_settings
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "fssaiLicenseNumber" TEXT DEFAULT '11522001000456';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "fssaiLicenseHolder" TEXT DEFAULT 'Amoga Luxury Private Limited';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "fssaiLicenseType" TEXT DEFAULT 'State License';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "fssaiCertificateUrl" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "fssaiScopeNotice" TEXT DEFAULT 'Verified 14-digit FSSAI licence for proprietary food and botanical tea retail packaging.';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "foodReturnWindowHours" INTEGER NOT NULL DEFAULT 48;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "returnPolicyVersion" TEXT NOT NULL DEFAULT '2026.1';

-- 7. Add Policy Acknowledgement snapshot fields to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "returnPolicyAcknowledged" BOOLEAN DEFAULT true;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "returnPolicyVersion" TEXT DEFAULT '2026.1';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "returnPolicyAcknowledgedAt" TIMESTAMP(3);

-- 8. Unique Constraints & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "return_requests_returnReference_key" ON "return_requests"("returnReference");
CREATE INDEX IF NOT EXISTS "return_requests_orderId_idx" ON "return_requests"("orderId");
CREATE INDEX IF NOT EXISTS "return_requests_customerId_idx" ON "return_requests"("customerId");
CREATE INDEX IF NOT EXISTS "return_requests_customerEmail_idx" ON "return_requests"("customerEmail");
CREATE INDEX IF NOT EXISTS "return_requests_status_idx" ON "return_requests"("status");
CREATE INDEX IF NOT EXISTS "return_requests_returnReference_idx" ON "return_requests"("returnReference");

CREATE INDEX IF NOT EXISTS "return_request_items_returnRequestId_idx" ON "return_request_items"("returnRequestId");
CREATE INDEX IF NOT EXISTS "return_request_items_orderItemId_idx" ON "return_request_items"("orderItemId");

CREATE INDEX IF NOT EXISTS "return_evidences_returnRequestId_idx" ON "return_evidences"("returnRequestId");

CREATE INDEX IF NOT EXISTS "return_status_histories_returnRequestId_idx" ON "return_status_histories"("returnRequestId");
CREATE INDEX IF NOT EXISTS "return_status_histories_createdAt_idx" ON "return_status_histories"("createdAt");

-- 9. Foreign Keys with ON DELETE CASCADE / SET NULL
DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "return_evidences" ADD CONSTRAINT "return_evidences_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "return_status_histories" ADD CONSTRAINT "return_status_histories_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
