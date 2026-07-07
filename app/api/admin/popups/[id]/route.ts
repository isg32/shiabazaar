import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const data = await request.json();
  const popup = await db.popup.update({ where: { id }, data });
    revalidateTag("homepage", "max");
  return NextResponse.json({ popup });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  await db.popup.delete({ where: { id } });
    revalidateTag("homepage", "max");
  return NextResponse.json({ deleted: true });
}
