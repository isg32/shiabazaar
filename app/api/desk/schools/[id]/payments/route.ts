import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import { optionalString } from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  const school = await db.school.findUnique({ where: { id }, select: { id: true } });
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });

  const body = await req.json();
  const rupees = Number(body.amount);
  if (!Number.isFinite(rupees) || rupees <= 0) {
    return NextResponse.json({ error: "Enter a payment amount greater than zero." }, { status: 400 });
  }
  const amount = Math.round(rupees * 100);
  const method = optionalString(body.method) ?? "cash";

  const receivedAt = optionalString(body.receivedAt);
  const receivedDate = receivedAt ? new Date(receivedAt) : new Date();
  if (Number.isNaN(receivedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const payment = await db.$transaction(async (tx) => {
    const p = await tx.schoolPayment.create({
      data: {
        schoolId: id,
        amount,
        method,
        reference: optionalString(body.reference),
        note: optionalString(body.note),
        receivedAt: receivedDate,
        recordedById: staff?.id ?? null,
      },
    });
    await tx.school.update({ where: { id }, data: { balance: { decrement: amount } } });
    return p;
  });

  return NextResponse.json({ payment }, { status: 201 });
}
