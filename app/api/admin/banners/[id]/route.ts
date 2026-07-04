import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const data = await request.json();

  const banner = await db.banner.update({ where: { id }, data });
  return NextResponse.json({ banner });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  await db.banner.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
