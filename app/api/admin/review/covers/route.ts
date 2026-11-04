import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/** Products with recently uploaded cover images needing review */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const products = await db.product.findMany({
    where: {
      images: { some: { isCover: true } },
      reviewStatus: "rejected",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      slug: true,
      title: true,
      sku: true,
      type: true,
      images: { where: { isCover: true }, select: { id: true, url: true, cloudinaryId: true }, take: 1 },
    },
  });

  return NextResponse.json({ products });
}

/** Mark a cover image as reviewed */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { reviewStatus: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Mark the product as approved if it's still rejected
  if (product.reviewStatus === "rejected") {
    await db.product.update({
      where: { id: productId },
      data: { reviewStatus: "approved", reviewedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
