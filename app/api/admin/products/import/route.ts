import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type ProductRow = {
  title: string;
  slug?: string;
  type: string;
  price: string | number;
  original_price?: string | number;
  in_stock?: string | boolean;
  badge?: string;
  category_name?: string;
  description?: string;
  author?: string;
  publisher?: string;
  language?: string;
  genre?: string;
  isbn?: string;
  edition?: string;
  page_count?: string | number;
};

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { rows }: { rows: ProductRow[] } = await req.json();

  // Prefetch categories name→id map
  const categories = await db.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  // Prefetch existing slugs to detect collisions
  const existing = await db.product.findMany({ select: { slug: true } });
  const usedSlugs = new Set(existing.map((p) => p.slug));

  const created: string[] = [];
  const errors: { row: number; title: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Resolve slug
      let base = row.slug?.trim() || slugify(row.title);
      let slug = base;
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        slug = `${base}-${suffix++}`;
      }
      usedSlugs.add(slug);

      const price = Math.round(Number(row.price) * 100);
      if (!price || isNaN(price)) throw new Error("invalid price");

      const validTypes = ["book", "gift", "ladies", "gents", "other"];
      const type = row.type?.toLowerCase();
      if (!validTypes.includes(type)) throw new Error(`unknown type "${row.type}"`);

      const categoryId = row.category_name
        ? (catMap.get(row.category_name.toLowerCase()) ?? null)
        : null;

      const inStock =
        row.in_stock === true ||
        row.in_stock === "true" ||
        row.in_stock === "1" ||
        row.in_stock === undefined ||
        row.in_stock === "";

      const product = await db.product.create({
        data: {
          slug,
          title: row.title.trim(),
          type: type as "book" | "gift" | "ladies" | "gents" | "other",
          price,
          originalPrice: row.original_price ? Math.round(Number(row.original_price) * 100) : null,
          inStock,
          badge: row.badge || null,
          description: row.description || null,
          author: row.author || null,
          publisher: row.publisher || null,
          language: row.language || null,
          genre: row.genre || null,
          isbn: row.isbn || null,
          edition: row.edition || null,
          pageCount: row.page_count ? Number(row.page_count) : null,
          categoryId,
        },
      });

      created.push(product.slug);
    } catch (err) {
      errors.push({
        row: i + 1,
        title: row.title ?? `row ${i + 1}`,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  revalidateTag("products", "page");

  return NextResponse.json({ created: created.length, errors }, { status: 201 });
}
