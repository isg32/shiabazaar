import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Returns the best active auto-apply coupon that qualifies for `subtotal` (paise).
export async function GET(req: NextRequest) {
  const subtotal = parseInt(req.nextUrl.searchParams.get("subtotal") ?? "0", 10);
  const now = new Date();

  const candidates = await db.coupon.findMany({
    where: {
      autoApply: true,
      active: true,
      minOrder: { lte: subtotal },
    },
    orderBy: { value: "desc" },
  });

  const coupon = candidates.find(
    (c) =>
      (!c.expiresAt || c.expiresAt > now) &&
      (!c.usageLimit || c.usageCount < c.usageLimit)
  ) ?? null;

  return NextResponse.json(coupon);
}
