import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";
import { filterWhere, REVIEW_FILTERS, reviewCounts, type ReviewFilter } from "@/lib/product-review";

export const dynamic = "force-dynamic";

/** Next pending products to review, oldest first, plus overall counts. */
export async function GET(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const sp = req.nextUrl.searchParams;
  const filter = (REVIEW_FILTERS.includes(sp.get("filter") as ReviewFilter) ? sp.get("filter") : "all") as ReviewFilter;
  const take = Math.min(30, Math.max(1, Number(sp.get("take")) || 15));
  const exclude = (sp.get("exclude") ?? "").split(",").filter(Boolean).slice(0, 200);

  const where = { reviewStatus: "pending" as const, ...filterWhere(filter), ...(exclude.length ? { id: { notIn: exclude } } : {}) };
  const [products, remaining, counts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take,
      select: {
        id: true, title: true, sku: true, type: true, price: true, originalPrice: true,
        author: true, publisher: true, language: true, description: true, slug: true,
        images: { select: { url: true, isCover: true, position: true }, orderBy: [{ isCover: "desc" }, { position: "asc" }] },
        categories: { select: { category: { select: { name: true } } } },
      },
    }),
    db.product.count({ where: { reviewStatus: "pending", ...filterWhere(filter) } }),
    reviewCounts(),
  ]);
  return NextResponse.json({ products, remaining, counts });
}
