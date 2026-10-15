import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { getStaffUser } from "@/lib/staff-guard";

export const dynamic = "force-dynamic";

/** Fix-list "Mark fixed": approves a disapproved product. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;
  const found = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!found) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  await db.product.update({ where: { id }, data: { reviewStatus: "approved", reviewedAt: new Date(), reviewedById: staff?.id ?? null } });
  return NextResponse.json({ ok: true });
}
