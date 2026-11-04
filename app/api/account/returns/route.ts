import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const { orderId, reason } = await request.json();

  if (!orderId || !reason?.trim()) {
    return NextResponse.json({ error: "Order ID and reason are required" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId || order.status !== "delivered") {
    return NextResponse.json({ error: "Order not eligible for return" }, { status: 400 });
  }

  const existing = await db.returnRequest.findFirst({ where: { orderId } });
  if (existing) {
    return NextResponse.json({ error: "Return already requested for this order" }, { status: 400 });
  }

  const returnRequest = await db.returnRequest.create({
    data: { orderId, reason: reason.trim() },
  });

  return NextResponse.json({ returnRequest }, { status: 201 });
}
