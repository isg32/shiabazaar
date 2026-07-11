import { db } from "./db";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Product as DBProduct, ProductImage, ProductVariant, Category } from "@prisma/client";

type DBProductFull = DBProduct & {
  images: ProductImage[];
  variants: ProductVariant[];
  category?: Category | null;
};

export interface ProductUI {
  id: string;
  slug: string;
  type: "book" | "gift" | "ladies" | "gents";
  title: string;
  author?: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  images?: string[];
  badge?: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  isbn?: string;
  publisher?: string;
  language?: string;
  genre?: string;
  pageCount?: number;
  edition?: string;
  description?: string;
  tableOfContents?: string;
  variants?: { id: string; label: string; stock: number; price?: number }[];
  categoryId?: string;
  categoryName?: string;
}

export function toUI(p: DBProductFull): ProductUI {
  const sorted = [...p.images].sort((a, b) => a.position - b.position);
  const cover = sorted.find((i) => i.isCover) ?? sorted[0];
  return {
    id: p.id,
    slug: p.slug,
    type: p.type as ProductUI["type"],
    title: p.title,
    author: p.author ?? undefined,
    price: p.price / 100,
    originalPrice: p.originalPrice ? p.originalPrice / 100 : undefined,
    coverImage: cover?.url ?? "/placeholder-book.jpg",
    images: sorted.filter((i) => !i.isCover).map((i) => i.url),
    badge: p.badge ?? undefined,
    inStock: p.inStock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isbn: p.isbn ?? undefined,
    publisher: p.publisher ?? undefined,
    language: p.language ?? undefined,
    genre: p.genre ?? undefined,
    pageCount: p.pageCount ?? undefined,
    edition: p.edition ?? undefined,
    description: p.description ?? undefined,
    tableOfContents: p.tableOfContents ?? undefined,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      stock: v.stock,
      price: v.price ? v.price / 100 : undefined,
    })),
    categoryId: p.categoryId ?? undefined,
    categoryName: p.category?.name ?? undefined,
  };
}

export const include = { images: true, variants: true, category: true } as const;

export const getFeaturedProducts = unstable_cache(
  async (limit = 8): Promise<ProductUI[]> => {
    const featured = await db.homepageFeatured.findMany({
      orderBy: { position: "asc" },
      take: limit,
      include: { product: { include } },
    });
    if (featured.length) return featured.map((f) => toUI(f.product as DBProductFull));
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include,
    });
    return products.map((p) => toUI(p as DBProductFull));
  },
  ["featured-products"],
  { tags: ["products", "homepage"] }
);

export const getPopularBooks = unstable_cache(
  async (limit = 12): Promise<ProductUI[]> => {
    const rows = await db.homepagePopularBook.findMany({
      orderBy: { position: "asc" },
      take: limit,
      include: { product: { include } },
    });
    return rows.map((r) => toUI(r.product as DBProductFull));
  },
  ["popular-books"],
  { tags: ["homepage"] }
);

// ponytail: React.cache deduplicates within a request (generateMetadata + page both call this)
export const getProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<ProductUI | null> => {
      const p = await db.product.findUnique({ where: { slug }, include });
      return p ? toUI(p as DBProductFull) : null;
    },
    ["product-by-slug"],
    { tags: ["products"] }
  )
);

export const getProducts = unstable_cache(
  async (opts: {
    type?: string;
    limit?: number;
    orderBy?: "newest" | "price-asc" | "price-desc";
    categoryId?: string;
    publisherContains?: string;
    publisherNotContains?: string;
  } = {}): Promise<ProductUI[]> => {
    const { type, limit, orderBy = "newest", categoryId, publisherContains, publisherNotContains } = opts;
    const products = await db.product.findMany({
      where: {
        ...(type ? { type: type as DBProduct["type"] } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(publisherContains ? { publisher: { contains: publisherContains, mode: "insensitive" } } : {}),
        ...(publisherNotContains ? { NOT: { publisher: { contains: publisherNotContains, mode: "insensitive" } } } : {}),
      },
      orderBy:
        orderBy === "newest"    ? { createdAt: "desc" } :
        orderBy === "price-asc" ? { price: "asc" }      :
                                  { price: "desc" },
      take: limit,
      include,
    });
    return products.map((p) => toUI(p as DBProductFull));
  },
  ["products"],
  { tags: ["products"] }
);

export const searchProducts = unstable_cache(
  async (query: string): Promise<ProductUI[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return getProducts({ limit: 100 });
    const products = await db.product.findMany({
      where: {
        OR: [
          { title:       { contains: q, mode: "insensitive" } },
          { author:      { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { genre:       { contains: q, mode: "insensitive" } },
        ],
      },
      take: 100,
      include,
    });
    return products.map((p) => toUI(p as DBProductFull));
  },
  ["search-products"],
  { tags: ["products"] }
);

// Renamed: takes categoryId directly, no second DB lookup
export const getProductsByCategoryId = unstable_cache(
  async (categoryId: string): Promise<ProductUI[]> => {
    const products = await db.product.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
      include,
    });
    return products.map((p) => toUI(p as DBProductFull));
  },
  ["products-by-category"],
  { tags: ["products"] }
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, type: string, limit = 4): Promise<ProductUI[]> => {
    const products = await db.product.findMany({
      where: { type: type as DBProduct["type"], NOT: { id: productId } },
      take: limit,
      include,
    });
    return products.map((p) => toUI(p as DBProductFull));
  },
  ["related-products"],
  { tags: ["products"] }
);

// ── Homepage data helpers ───────────────────────────────────────────────────

export const getBanners = unstable_cache(
  async () => db.banner.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
  ["banners"],
  { tags: ["homepage"] }
);

export const getCategoryCounts = unstable_cache(
  async () => db.product.groupBy({ by: ["type"], _count: { id: true } }),
  ["category-counts"],
  { tags: ["products", "homepage"] }
);

export const getActivePopup = unstable_cache(
  async () => db.popup.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ["active-popup"],
  { tags: ["homepage"] }
);
