import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import { db } from "@/lib/db";
import { applyStockMovement } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const productId = req.nextUrl.searchParams.get("productId") ?? undefined;

  const movements = await db.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { title: true } },
      variant: { select: { label: true } },
      user:    { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ movements });
}

/**
 * Manual stock change from the desk.
 * Body: { productId, variantId?, mode: "restock" | "adjust", value, note? }
 *  - restock: `value` is a positive quantity added
 *  - adjust:  `value` is the new absolute on-hand count
 */
export async function POST(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();

  const { productId, variantId, mode, value, note } = await req.json();
  if (!productId || (mode !== "restock" && mode !== "adjust")) {
    return NextResponse.json({ error: "productId and mode (restock|adjust) are required." }, { status: 400 });
  }
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "value must be a number." }, { status: 400 });
  }
  if (mode === "restock" && n <= 0) {
    return NextResponse.json({ error: "Restock quantity must be positive." }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    let delta: number;
    let reason: "restock" | "adjustment";

    if (mode === "restock") {
      delta = n;
      reason = "restock";
    } else {
      const current = variantId
        ? (await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true } })).stock
        : (await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { stock: true } })).stock;
      delta = n - current;
      reason = "adjustment";
    }

    if (delta === 0) return;

    await applyStockMovement(tx, {
      productId,
      variantId: variantId ?? null,
      delta,
      reason,
      refType: "manual",
      note: note ?? null,
      userId: staff?.id ?? null,
    });
  });

  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
