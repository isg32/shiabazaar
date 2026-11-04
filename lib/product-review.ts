import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type ReviewFilter = "all" | "books" | "other" | "noimage";
export const REVIEW_FILTERS: ReviewFilter[] = ["all", "books", "other", "noimage"];

export function filterWhere(f: ReviewFilter): Prisma.ProductWhereInput {
  if (f === "books") return { type: "book" };
  if (f === "other") return { type: { not: "book" } };
  if (f === "noimage") return { images: { none: {} } };
  return {};
}

export async function reviewCounts() {
  const rows = await db.product.groupBy({ by: ["reviewStatus"], _count: true });
  const get = (s: string) => rows.find((r) => r.reviewStatus === s)?._count ?? 0;
  return { pending: get("pending"), approved: get("approved"), rejected: get("rejected") };
}
