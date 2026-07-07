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
  const category = await db.category.update({ where: { id }, data });
  return NextResponse.json({ category });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  // Unlink products before deleting
  await db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await db.category.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
