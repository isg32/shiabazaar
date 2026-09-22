-- CreateTable
CREATE TABLE "product_categories" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every product's existing single category becomes one row in the join table.
INSERT INTO "product_categories" ("productId", "categoryId")
SELECT "id", "categoryId" FROM "products" WHERE "categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- NOTE: products."categoryId" (and its FK + index) is intentionally NOT dropped here.
-- The currently deployed site still reads that column; dropping it before the new code is
-- live would break the storefront. It is no longer in schema.prisma, so nothing new uses it.
-- Once the new code is deployed, a follow-up migration can drop it:
--   ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";
--   DROP INDEX "products_categoryId_idx";
--   ALTER TABLE "products" DROP COLUMN "categoryId";
