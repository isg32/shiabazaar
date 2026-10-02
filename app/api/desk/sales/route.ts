import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import {
  DeskOrderError,
  createDeskOrder,
  optionalString,
  resolveLines,
} from "@/lib/desk-orders";
import { deskSaleNotes } from "@/lib/customers";

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

    const customer = { name: optionalString(body.customerName), phone: optionalString(body.customerPhone) };

    const order = await createDeskOrder({
      buyerType: "individual",
      lines,
      paymentMethod: optionalString(body.paymentMethod),
      notes: deskSaleNotes(customer.name, customer.phone, optionalString(body.note)),
      customer,
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
