import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const body = await req.json();
  const coupon = await db.coupon.create({
    data: {
      code:       body.code.toUpperCase(),
      type:       body.type,
      value:      body.type === "flat" ? Math.round(body.value * 100) : body.value,
      minOrder:   body.minOrder ? Math.round(body.minOrder * 100) : 0,
      usageLimit: body.usageLimit ?? null,
      expiresAt:  body.expiresAt ? new Date(body.expiresAt) : null,
      active:     true,
      autoApply:  body.autoApply ?? false,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
