-- CreateTable
CREATE TABLE "homepage_popular_books" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "homepage_popular_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_popular_books_productId_key" ON "homepage_popular_books"("productId");

-- AddForeignKey
ALTER TABLE "homepage_popular_books" ADD CONSTRAINT "homepage_popular_books_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
