import { db } from "./db";
import type { Product as DBProduct, ProductImage, ProductVariant } from "@prisma/client";

type DBProductFull = DBProduct & {
  images: ProductImage[];
  variants: ProductVariant[];
};

// Shape that all existing components expect (mirrors data/mock.ts Product)
export interface ProductUI {
  id: string;
  slug: string;
  type: "book" | "gift" | "ladies" | "gents";
  title: string;
  author?: string;
  price: number;           // in rupees
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
}

function toUI(p: DBProductFull): ProductUI {
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
  };
}

const include = { images: true, variants: true } as const;

export async function getFeaturedProducts(limit = 8): Promise<ProductUI[]> {
  const featured = await db.homepageFeatured.findMany({
    orderBy: { position: "asc" },
    take: limit,
    include: { product: { include } },
  });
  if (featured.length) return featured.map((f) => toUI(f.product as DBProductFull));

  // fallback: newest products when no featured are set
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include,
  });
  return products.map((p) => toUI(p as DBProductFull));
}

export async function getProductBySlug(slug: string): Promise<ProductUI | null> {
  const p = await db.product.findUnique({ where: { slug }, include });
  return p ? toUI(p as DBProductFull) : null;
}

export async function getProducts(opts: {
  type?: string;
  limit?: number;
  orderBy?: "newest" | "price-asc" | "price-desc";
} = {}): Promise<ProductUI[]> {
  const { type, limit, orderBy = "newest" } = opts;
  const products = await db.product.findMany({
    where: type ? { type: type as DBProduct["type"] } : undefined,
    orderBy:
      orderBy === "newest"     ? { createdAt: "desc" } :
      orderBy === "price-asc"  ? { price: "asc" }      :
                                 { price: "desc" },
    take: limit,
    include,
  });
  return products.map((p) => toUI(p as DBProductFull));
}

export async function searchProducts(query: string): Promise<ProductUI[]> {
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
}

export async function getRelatedProducts(productId: string, type: string, limit = 4): Promise<ProductUI[]> {
  const products = await db.product.findMany({
    where: { type: type as DBProduct["type"], NOT: { id: productId } },
    take: limit,
    include,
  });
  return products.map((p) => toUI(p as DBProductFull));
}
