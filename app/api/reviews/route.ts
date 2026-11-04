import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const { productId, rating, body } = await request.json();

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verified buyer: must have a delivered order containing this product
  const completedItem = await db.orderItem.findFirst({
    where: { productId, order: { userId, status: "delivered" } },
    select: { orderId: true },
  });
  if (!completedItem) {
    return NextResponse.json({ error: "Only verified buyers can leave a review" }, { status: 403 });
  }

  const existing = await db.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
  }

  const review = await db.review.create({
    data: { userId, productId, orderId: completedItem.orderId, rating, body: body || null },
  });

  // Recompute product rating aggregate
  const all = await db.review.findMany({ where: { productId }, select: { rating: true } });
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await db.product.update({
    where: { id: productId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: all.length },
  });

  return NextResponse.json({ review }, { status: 201 });
}
