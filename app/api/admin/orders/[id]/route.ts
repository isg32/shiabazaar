import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { restockForCancelledOrder } from "@/lib/order-stock";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();

  const before = await db.order.findUnique({
    where: { id },
    select: { status: true, channel: true },
  });

  const order = await db.order.update({
    where: { id },
    data: {
      status:         body.status ?? undefined,
      trackingNumber: body.trackingNumber ?? undefined,
      trackingUrl:    body.trackingUrl ?? undefined,
    },
  });

  // Keep the shared stock pool in sync when an online order is cancelled after
  // payment already drew stock down. Offline/school orders manage their own stock
  // via the desk. v1 does not re-decrement on un-cancel — a mistakenly cancelled
  // order should be corrected with a manual restock/adjustment on the desk.
  if (
    before &&
    before.channel === "online" &&
    body.status === "cancelled" &&
    before.status !== "cancelled"
  ) {
    await restockForCancelledOrder(id);
  }

  return NextResponse.json({ order });
}
