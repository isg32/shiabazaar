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

  const { rows, on_duplicate = "skip" }: { rows: ProductRow[]; on_duplicate?: "skip" | "update" } =
    await req.json();

  const categories = await db.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const existing = await db.product.findMany({ select: { slug: true } });
  const usedSlugs = new Set(existing.map((p) => p.slug));

  let created = 0;
  let updated = 0;
  const errors: { row: number; title: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const baseSlug = row.slug?.trim() || slugify(row.title);

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

      const data = {
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
      };

      if (usedSlugs.has(baseSlug)) {
        if (on_duplicate === "skip") {
          // count as skipped — no error, just omitted from created
          continue;
        }
        // update
        await db.product.update({ where: { slug: baseSlug }, data });
        updated++;
      } else {
        // new product — resolve slug collision from this batch
        let slug = baseSlug;
        let suffix = 2;
        while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
        usedSlugs.add(slug);

        await db.product.create({ data: { slug, ...data } });
        created++;
      }
    } catch (err) {
      errors.push({
        row: i + 1,
        title: row.title ?? `row ${i + 1}`,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  revalidateTag("products", "page");

  return NextResponse.json({ created, updated, errors }, { status: 201 });
}
