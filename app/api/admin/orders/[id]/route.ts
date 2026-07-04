import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const order = await db.order.update({
    where: { id },
    data: {
      status:         body.status ?? undefined,
      trackingNumber: body.trackingNumber ?? undefined,
      trackingUrl:    body.trackingUrl ?? undefined,
    },
  });
  return NextResponse.json({ order });
}
