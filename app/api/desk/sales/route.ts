import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import {
  DeskOrderError,
  createDeskOrder,
  optionalString,
  resolveLines,
} from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const orders = await db.order.findMany({
    where: { channel: "offline", buyerType: "individual" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { select: { id: true, title: true, qty: true, price: true } },
    },
  });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();

  try {
    const body = await req.json();
    const lines = await resolveLines(body.lines ?? []);

    const customerBits = [optionalString(body.customerName), optionalString(body.customerPhone)]
      .filter(Boolean)
      .join(" · ");
    const notes = [customerBits && `Customer: ${customerBits}`, optionalString(body.note)]
      .filter(Boolean)
      .join("\n") || null;

    const order = await createDeskOrder({
      buyerType: "individual",
      lines,
      paymentMethod: optionalString(body.paymentMethod),
      notes,
      staffId: staff?.id ?? null,
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
