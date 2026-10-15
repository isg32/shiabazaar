import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { filterWhere, REVIEW_FILTERS, reviewCounts, type ReviewFilter } from "@/lib/product-review";

export const dynamic = "force-dynamic";

/** Disapproved products (the fix-list), newest decision first. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;
  const sp = req.nextUrl.searchParams;
  const filter = (REVIEW_FILTERS.includes(sp.get("filter") as ReviewFilter) ? sp.get("filter") : "all") as ReviewFilter;
  const q = (sp.get("q") ?? "").trim();
  const products = await db.product.findMany({
    where: {
      reviewStatus: "rejected",
      ...filterWhere(filter),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ reviewedAt: "desc" }, { id: "asc" }],
    take: 500,
    select: {
      id: true, title: true, sku: true, type: true, reviewedAt: true, reviewedById: true,
      images: { select: { url: true }, orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
    },
  });
  const ids = [...new Set(products.map((p) => p.reviewedById).filter(Boolean) as string[])];
  const users = ids.length ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } }) : [];
  const counts = await reviewCounts();
  return NextResponse.json({
    counts,
    products: products.map((p) => {
      const u = users.find((x) => x.id === p.reviewedById);
      return { ...p, reviewedBy: u ? u.name || u.email : null };
    }),
  });
}
