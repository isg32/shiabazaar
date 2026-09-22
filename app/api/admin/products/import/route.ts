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
  stock?: string | number;
  badge?: string;
  category_names?: string; // comma-separated category names
  description?: string;
  author?: string;
  publisher?: string;
  language?: string;
  genre?: string;
  isbn?: string;
  edition?: string;
  page_count?: string | number;
  extra_delivery?: string | number;
};

function parseStock(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.max(0, n) : undefined;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const {
    rows,
    on_duplicate = "skip",
    default_stock,
  }: { rows: ProductRow[]; on_duplicate?: "skip" | "update"; default_stock?: string | number } =
    await req.json();

  // Batch-wide fallback for rows that don't carry their own `stock` value.
  const batchStock = parseStock(default_stock);

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

      // Parse comma-separated category names. `undefined` (column absent) means
      // "leave existing category tags alone" — same convention as `stock` below;
      // an empty string means "clear all tags", same as an explicit "" stock.
      const categoryNamesProvided = row.category_names !== undefined;
      const categoryNames = row.category_names?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
      const categoryIds = [...new Set(
        categoryNames.map((name) => catMap.get(name.toLowerCase())).filter((id): id is string => id !== undefined)
      )];

      // Resolve the on-hand count: row value → batch default → (undefined).
      const rowStock = parseStock(row.stock);
      const stock = rowStock ?? batchStock;

      // Keep inStock consistent with the count. An explicit in_stock column
      // still wins; otherwise it's derived from stock when we have one.
      const inStockExplicit = row.in_stock !== undefined && row.in_stock !== "";
      const inStock = inStockExplicit
        ? row.in_stock === true || row.in_stock === "true" || row.in_stock === "1"
        : stock !== undefined
          ? stock > 0
          : true;

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
        pageCount:     row.page_count ? Number(row.page_count) : null,
        extraDelivery: row.extra_delivery ? Math.round(Number(row.extra_delivery) * 100) : 0,
      };

      if (usedSlugs.has(baseSlug)) {
        if (on_duplicate === "skip") {
          // count as skipped — no error, just omitted from created
          continue;
        }
        // update — only touch stock/categories when this import actually carried a value
        await db.$transaction(async (tx) => {
          const p = await tx.product.update({
            where: { slug: baseSlug },
            data: stock !== undefined ? { ...data, stock } : data,
            select: { id: true },
          });
          if (categoryNamesProvided) {
            // p.id, not baseSlug — product_categories.productId is a FK to products.id
            await tx.productCategory.deleteMany({ where: { productId: p.id } });
            if (categoryIds.length > 0) {
              await tx.productCategory.createMany({
                data: categoryIds.map((categoryId) => ({ productId: p.id, categoryId })),
              });
            }
          }
        });
        updated++;
      } else {
        // new product — resolve slug collision from this batch
        let slug = baseSlug;
        let suffix = 2;
        while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
        usedSlugs.add(slug);

        await db.product.create({ data: { slug, ...data, stock: stock ?? 0, categories: { create: categoryIds.map(categoryId => ({ categoryId })) } } });
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
