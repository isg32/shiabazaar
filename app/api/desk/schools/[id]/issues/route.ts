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

  const school = await db.school.findUnique({ where: { id } });
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });
  if (!school.active) return NextResponse.json({ error: "This school is inactive." }, { status: 400 });

  try {
    const body = await req.json();
    const lines = await resolveLines(body.lines ?? []);
    const total = linesTotal(lines);

    if (
      school.creditLimit > 0 &&
      school.balance + total > school.creditLimit &&
      body.override !== true
    ) {
      return NextResponse.json(
        {
          error: "Credit limit exceeded",
          code: "CREDIT_LIMIT",
          balance: school.balance,
          creditLimit: school.creditLimit,
          issueTotal: total,
        },
        { status: 400 },
      );
    }

    const overLimit = school.creditLimit > 0 && school.balance + total > school.creditLimit;
    const order = await createDeskOrder({
      buyerType: "school",
      lines,
      schoolId: id,
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
