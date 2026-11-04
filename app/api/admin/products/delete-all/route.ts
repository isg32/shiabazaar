import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "DELETE ALL PRODUCTS";

/**
 * Products that past orders point at. `order_items.productId` is a required FK
 * with no cascade, so these can't be deleted without destroying order history —
 * they are always kept.
 */
async function protectedProductIds(): Promise<string[]> {
  const rows = await db.orderItem.findMany({ distinct: ["productId"], select: { productId: true } });
  return rows.map((r) => r.productId);
}

/** Preview: how many products a delete-all would remove vs. have to keep. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const keep = await protectedProductIds();
  const [total, cartItems, wishlists] = await Promise.all([
    db.product.count(),
    db.cartItem.count({ where: { productId: { notIn: keep } } }),
    db.wishlist.count({ where: { productId: { notIn: keep } } }),
  ]);

  return NextResponse.json({
    total,
    deletable: total - keep.length,
    protected: keep.length,
    cartItems,
    wishlists,
  });
}

/**
 * Delete every product except those referenced by past orders. Also removes the
 * cart / wishlist / review rows that point at the deleted products (their FKs
 * don't cascade). Images, variants, homepage featured/popular entries and stock
 * movements cascade from the product. Cloudinary assets are left untouched.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json({ error: `Confirmation phrase must be exactly "${CONFIRM_PHRASE}".` }, { status: 400 });
  }

  const keep = await protectedProductIds();
  const notKept = { productId: { notIn: keep } };

  // One atomic batch: if anything fails nothing is deleted.
  const [, , , products] = await db.$transaction([
    db.cartItem.deleteMany({ where: notKept }),
    db.wishlist.deleteMany({ where: notKept }),
    db.review.deleteMany({ where: notKept }),
    db.product.deleteMany({ where: { id: { notIn: keep } } }),
  ]);

  revalidateTag("products", "max");
  revalidateTag("homepage", "max");

  return NextResponse.json({ deleted: products.count, kept: keep.length });
}
