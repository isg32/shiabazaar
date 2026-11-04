-- Internal product review (swipe approve/disapprove). Additive: every product starts as pending.
CREATE TYPE "ProductReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "products" ADD COLUMN "reviewStatus" "ProductReviewStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT;

CREATE INDEX "products_reviewStatus_idx" ON "products"("reviewStatus");
