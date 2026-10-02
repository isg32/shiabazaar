import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import {
  DeskOrderError,
  createDeskOrder,
  linesTotal,
  optionalString,
  resolveLines,
} from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  const vendor = await db.vendor.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  if (!vendor.active) return NextResponse.json({ error: "This vendor is inactive." }, { status: 400 });

  try {
    const body = await req.json();
    const lines = await resolveLines(body.lines ?? []);
    const total = linesTotal(lines);

    if (
      vendor.creditLimit > 0 &&
      vendor.balance + total > vendor.creditLimit &&
      body.override !== true
    ) {
      return NextResponse.json(
        {
          error: "Credit limit exceeded",
          code: "CREDIT_LIMIT",
          balance: vendor.balance,
          creditLimit: vendor.creditLimit,
          issueTotal: total,
        },
        { status: 400 },
      );
    }

    const overLimit = vendor.creditLimit > 0 && vendor.balance + total > vendor.creditLimit;
    const order = await createDeskOrder({
      buyerType: "vendor",
      lines,
      vendorId: id,
      notes: optionalString(body.note),
      staffId: staff?.id ?? null,
      creditOverrideById: overLimit ? staff?.id ?? null : null,
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
