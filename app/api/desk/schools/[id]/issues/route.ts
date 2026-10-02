import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import {
  CreditLimitError,
  DeskOrderError,
  createDeskOrder,
  optionalString,
  resolveBillDiscount,
  resolveLines,
  resolvePayments,
} from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  const school = await db.school.findUnique({ where: { id }, select: { active: true } });
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });
  if (!school.active) return NextResponse.json({ error: "This school is inactive." }, { status: 400 });

  try {
    const body = await req.json();
    const order = await createDeskOrder({
      buyerType: "school",
      lines: await resolveLines(body.lines ?? []),
      billDiscount: resolveBillDiscount(body.billDiscount),
      payments: resolvePayments(body.payments),
      schoolId: id,
      notes: optionalString(body.note),
      staffId: staff?.id ?? null,
      // Only an admin may push an account past its credit limit.
      override: { requested: body.override === true, allowed: !!staff?.isAdmin, staffId: staff?.id ?? null },
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof CreditLimitError) {
      return NextResponse.json({ error: err.message, code: "CREDIT_LIMIT", ...err.details }, { status: 409 });
    }
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
