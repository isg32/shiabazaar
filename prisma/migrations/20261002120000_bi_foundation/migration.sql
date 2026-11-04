-- ============================================================================
-- BI / credit foundation. Purely additive — every new column is nullable or
-- defaulted, so code deployed before this migration keeps working.
--
--   • Auto codes: SCH-0001 / VEN-0001 for schools & vendors, SB-000001 SKUs for
--     products — assigned by a DB default so every insert path gets one.
--   • schools/vendors: city, state, paymentTermsDays (overrides the global).
--   • orders: amountPaid (paid at time of sale; total − amountPaid = credit
--     generated), customerId (walk-in customer), creditOverrideById (audit).
--   • order_items.mrp: unit MRP snapshot → per-line discount = (mrp − price) × qty.
--   • order_payments: per-mode amounts at time of sale (split payments).
--   • order_returns / order_return_lines: partial returns on offline orders.
--   • customers: walk-in customer identity keyed by normalised phone.
--   • business_settings: single row of configurable thresholds.
--   • users.isReader: read-only BI dashboard role.
--
-- NOTE: products."categoryId" is still intentionally left in place (see
-- 20260922120000_product_categories_many_to_many) — not touched here.
-- ============================================================================

-- ── Code generator ──────────────────────────────────────────────────────────
-- Never truncates: widths grow past `width` digits instead of wrapping.
CREATE FUNCTION next_entity_code(prefix text, seq regclass, width int)
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT prefix || lpad(n::text, greatest(width, length(n::text)), '0')
  FROM (SELECT nextval(seq) AS n) s
$$;

CREATE SEQUENCE "school_code_seq";
CREATE SEQUENCE "vendor_code_seq";
CREATE SEQUENCE "product_sku_seq";

-- ── Products: SKU ───────────────────────────────────────────────────────────
-- Column added without a default first so the backfill can number existing
-- products in creation order (a volatile default would number them randomly).
ALTER TABLE "products" ADD COLUMN "sku" TEXT;

WITH o AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn FROM "products"
)
UPDATE "products" p SET "sku" = 'SB-' || lpad(o.rn::text, 6, '0') FROM o WHERE p.id = o.id;

SELECT setval('product_sku_seq', greatest((SELECT count(*) FROM "products"), 1), (SELECT count(*) FROM "products") > 0);

ALTER TABLE "products" ALTER COLUMN "sku" SET DEFAULT next_entity_code('SB-'::text, 'product_sku_seq'::regclass, 6);
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- ── Schools & vendors: codes, location, payment terms ──────────────────────
ALTER TABLE "schools" ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "paymentTermsDays" INTEGER;

ALTER TABLE "vendors" ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "paymentTermsDays" INTEGER;

-- Backfill missing codes after the highest existing numeric code of the same
-- shape, so a hand-typed "SCH-0003" can never collide with a generated one.
WITH base AS (
  SELECT coalesce(max(substring(code FROM '^SCH-(\d+)$')::bigint), 0) AS b FROM "schools"
), o AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn FROM "schools" WHERE code IS NULL
)
UPDATE "schools" s SET code = 'SCH-' || lpad((base.b + o.rn)::text, 4, '0') FROM o, base WHERE s.id = o.id;

SELECT setval('school_code_seq',
  greatest(coalesce((SELECT max(substring(code FROM '^SCH-(\d+)$')::bigint) FROM "schools"), 0), 1),
  (SELECT count(*) FROM "schools" WHERE code ~ '^SCH-\d+$') > 0);

WITH base AS (
  SELECT coalesce(max(substring(code FROM '^VEN-(\d+)$')::bigint), 0) AS b FROM "vendors"
), o AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn FROM "vendors" WHERE code IS NULL
)
UPDATE "vendors" v SET code = 'VEN-' || lpad((base.b + o.rn)::text, 4, '0') FROM o, base WHERE v.id = o.id;

SELECT setval('vendor_code_seq',
  greatest(coalesce((SELECT max(substring(code FROM '^VEN-(\d+)$')::bigint) FROM "vendors"), 0), 1),
  (SELECT count(*) FROM "vendors" WHERE code ~ '^VEN-\d+$') > 0);

ALTER TABLE "schools" ALTER COLUMN "code" SET DEFAULT next_entity_code('SCH-'::text, 'school_code_seq'::regclass, 4);
ALTER TABLE "vendors" ALTER COLUMN "code" SET DEFAULT next_entity_code('VEN-'::text, 'vendor_code_seq'::regclass, 4);

-- ── Users: Reader role ──────────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN "isReader" BOOLEAN NOT NULL DEFAULT false;

-- ── Customers ───────────────────────────────────────────────────────────────
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- ── Orders / items ──────────────────────────────────────────────────────────
ALTER TABLE "orders" ADD COLUMN "amountPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "creditOverrideById" TEXT,
ADD COLUMN "customerId" TEXT;

CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD COLUMN "mrp" INTEGER;
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_payments_orderId_idx" ON "order_payments"("orderId");
CREATE INDEX "order_payments_method_idx" ON "order_payments"("method");
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "order_returns" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_returns_orderId_idx" ON "order_returns"("orderId");
CREATE INDEX "order_returns_createdAt_idx" ON "order_returns"("createdAt");
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "order_return_lines" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "order_return_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_return_lines_returnId_idx" ON "order_return_lines"("returnId");
CREATE INDEX "order_return_lines_orderItemId_idx" ON "order_return_lines"("orderItemId");
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "order_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Business settings (single row) ─────────────────────────────────────────
CREATE TABLE "business_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "creditWatchPct" INTEGER NOT NULL DEFAULT 70,
    "creditNearPct" INTEGER NOT NULL DEFAULT 90,
    "inactiveDays" INTEGER NOT NULL DEFAULT 90,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "business_settings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);

-- ── Backfills for existing orders ──────────────────────────────────────────

-- Legacy line items: MRP = selling price (no discount was recorded).
UPDATE "order_items" SET "mrp" = "price" WHERE "mrp" IS NULL;

-- Online orders paid via Razorpay, and walk-in desk sales, were paid in full.
-- School/vendor issues stay at 0 (the whole amount went onto their balance).
UPDATE "orders" SET "amountPaid" = "total"
WHERE ("channel" = 'online' AND "razorpayPaymentId" IS NOT NULL)
   OR ("channel" = 'offline' AND "buyerType" = 'individual');

INSERT INTO "order_payments" ("id", "orderId", "method", "amount", "createdAt")
SELECT 'bf_' || o.id, o.id,
       CASE WHEN o."channel" = 'online' THEN 'online' ELSE coalesce(o."paymentMethod", 'other') END,
       o."total", o."createdAt"
FROM "orders" o
WHERE o."amountPaid" > 0;

-- Walk-in customers from the "Customer: Name · Phone" note snapshot. Only rows
-- with a usable phone become customers; phone is digits only, a leading 91
-- country code on a 12-digit number is dropped.
WITH first_line AS (
  SELECT id, "createdAt", substring("notes" FROM '^Customer: ([^\n]*)') AS l
  FROM "orders"
  WHERE "channel" = 'offline' AND "buyerType" = 'individual' AND "notes" LIKE 'Customer: %'
), parts AS (
  SELECT id, "createdAt",
    CASE WHEN position(' · ' IN l) > 0 THEN split_part(l, ' · ', 1)
         WHEN l ~ '^[0-9+ ()-]+$' THEN NULL ELSE l END AS name,
    CASE WHEN position(' · ' IN l) > 0 THEN split_part(l, ' · ', 2)
         WHEN l ~ '^[0-9+ ()-]+$' THEN l ELSE NULL END AS raw_phone
  FROM first_line
), norm AS (
  SELECT id, "createdAt", nullif(trim(name), '') AS name,
    CASE WHEN length(d) = 12 AND d LIKE '91%' THEN right(d, 10) ELSE d END AS phone
  FROM (SELECT *, regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g') AS d FROM parts) x
), usable AS (
  SELECT * FROM norm WHERE length(phone) >= 6
), latest AS (
  SELECT DISTINCT ON (phone) phone, name, "createdAt" FROM usable ORDER BY phone, "createdAt" DESC
)
INSERT INTO "customers" ("id", "phone", "name", "createdAt", "updatedAt")
SELECT 'bf_' || phone, phone, name, "createdAt", CURRENT_TIMESTAMP FROM latest;

UPDATE "orders" o SET "customerId" = c.id
FROM "customers" c
WHERE o."channel" = 'offline' AND o."buyerType" = 'individual' AND o."customerId" IS NULL
  AND o."notes" LIKE 'Customer: %'
  AND c.phone = (
    SELECT CASE WHEN length(d) = 12 AND d LIKE '91%' THEN right(d, 10) ELSE d END
    FROM (SELECT regexp_replace(
      CASE WHEN position(' · ' IN l) > 0 THEN split_part(l, ' · ', 2) ELSE l END, '\D', '', 'g') AS d
      FROM (SELECT substring(o."notes" FROM '^Customer: ([^\n]*)') AS l) a) b
  );
