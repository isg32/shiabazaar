import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import {
  DeskOrderError,
  cancelDeskOrder,
  optionalString,
  resolveLines,
  updateDeskOrder,
} from "@/lib/desk-orders";
import { deskSaleNotes } from "@/lib/customers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          id: true, title: true, qty: true, price: true, productId: true, variantId: true,
          product: {
            select: {
              title: true, slug: true, price: true,
              variants: { select: { id: true, label: true, stock: true, price: true } },
            },
          },
          variant: { select: { label: true } },
        },
      },
      school: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
      customer: { select: { name: true, phone: true } },
    },
  });
  if (!order || order.channel !== "offline") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  try {
    const body = await req.json();
    const lines = await resolveLines(body.lines ?? []);
    // Only the walk-in sale form sends customer fields; school/vendor edits keep their notes as-is.
    const hasCustomer = "customerName" in body || "customerPhone" in body;
    const customer = { name: optionalString(body.customerName), phone: optionalString(body.customerPhone) };
    await updateDeskOrder({
      id,
      lines,
      paymentMethod: optionalString(body.paymentMethod),
      notes: hasCustomer
        ? deskSaleNotes(customer.name, customer.phone, optionalString(body.note))
        : optionalString(body.note),
      customer: hasCustomer ? customer : null,
      staffId: staff?.id ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  try {
    await cancelDeskOrder(id, staff?.id ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
