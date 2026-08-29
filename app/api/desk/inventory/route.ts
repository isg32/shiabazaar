import { NextResponse } from "next/server";
import { requireClerk } from "@/lib/staff-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const products = await db.product.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      inStock: true,
      stock: true,
      variants: { select: { id: true, label: true, stock: true } },
    },
  });

  return NextResponse.json({ products });
}
