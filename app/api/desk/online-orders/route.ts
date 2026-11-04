import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const orders = await db.order.findMany({
    where: { channel: "online" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: { include: { product: true } }, user: true, address: true },
  });
  return NextResponse.json({ orders });
}
