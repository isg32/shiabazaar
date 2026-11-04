import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const { id, paymentId } = await params;

  const payment = await db.schoolPayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.schoolId !== id) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.school.update({ where: { id }, data: { balance: { increment: payment.amount } } });
    await tx.schoolPayment.delete({ where: { id: paymentId } });
  });

  return NextResponse.json({ ok: true });
}
