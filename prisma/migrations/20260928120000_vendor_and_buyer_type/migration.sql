-- ============================================================================
-- Splits Order.channel (Website vs Physical Store) from a new Order.buyerType
-- (Individual vs Vendor vs School), and adds a full Vendor entity mirroring
-- School (Vendor, VendorPayment). `channel` no longer carries buyer-type
-- meaning — a school/vendor transaction is `channel = 'offline'` with
-- `buyerType` set accordingly.
--
-- Existing data: every current `channel = 'school'` order is backfilled to
-- `buyerType = 'school', channel = 'offline'` before the SalesChannel enum is
-- shrunk to just ('online', 'offline') — done in that order so the cast never
-- sees a row still holding the literal 'school' value.
-- ============================================================================

-- New buyer-type enum
CREATE TYPE "BuyerType" AS ENUM ('individual', 'vendor', 'school');

-- orders.buyerType (additive; default keeps existing rows correct until the
-- backfill below runs)
ALTER TABLE "orders" ADD COLUMN "buyerType" "BuyerType" NOT NULL DEFAULT 'individual';

-- New stock-movement reason for vendor issues. Not referenced anywhere else in
-- this file, so it's safe to add within the same transaction as everything
-- else here (Postgres only forbids *using* a new enum value in the same
-- transaction that added it).
ALTER TYPE "StockReason" ADD VALUE 'vendor_issue';

-- ── Vendor entity — mirrors School exactly ──────────────────────────────────

CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendors_code_key" ON "vendors"("code");
CREATE INDEX "vendors_active_idx" ON "vendors"("active");
CREATE INDEX "vendor_payments_vendorId_idx" ON "vendor_payments"("vendorId");

ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- orders.vendorId (additive)
ALTER TABLE "orders" ADD COLUMN "vendorId" TEXT;
CREATE INDEX "orders_vendorId_idx" ON "orders"("vendorId");
CREATE INDEX "orders_buyerType_idx" ON "orders"("buyerType");
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Backfill + shrink SalesChannel (must happen in this order) ─────────────

BEGIN;

-- Move school-channel orders' buyer info onto the new column BEFORE the old
-- enum value disappears.
UPDATE "orders" SET "buyerType" = 'school', "channel" = 'offline' WHERE "channel" = 'school';

CREATE TYPE "SalesChannel_new" AS ENUM ('online', 'offline');
ALTER TABLE "orders" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "channel" TYPE "SalesChannel_new" USING ("channel"::text::"SalesChannel_new");
ALTER TYPE "SalesChannel" RENAME TO "SalesChannel_old";
ALTER TYPE "SalesChannel_new" RENAME TO "SalesChannel";
DROP TYPE "SalesChannel_old";
ALTER TABLE "orders" ALTER COLUMN "channel" SET DEFAULT 'online';

COMMIT;
