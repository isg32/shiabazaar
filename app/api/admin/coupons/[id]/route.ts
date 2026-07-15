import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const coupon = await db.coupon.update({ where: { id }, data: body });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
