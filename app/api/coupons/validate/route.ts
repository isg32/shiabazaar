import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { code, subtotal } = await request.json(); // subtotal in rupees

  if (!code || typeof subtotal !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }
  if (subtotal * 100 < coupon.minOrder) {
    return NextResponse.json(
      { error: `Minimum order of ₹${(coupon.minOrder / 100).toFixed(0)} required` },
      { status: 400 }
    );
  }

  const discount =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value / 100; // flat is stored in paise → convert to rupees

  return NextResponse.json({ discount, code: coupon.code, type: coupon.type, value: coupon.value });
}
