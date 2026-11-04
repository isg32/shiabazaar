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
  const { pinned } = await request.json();
  const item = await db.homepageFeatured.update({ where: { id }, data: { pinned } });
    revalidateTag("homepage", "max");
  return NextResponse.json({ item });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  await db.homepageFeatured.delete({ where: { id } });
    revalidateTag("homepage", "max");
  return NextResponse.json({ deleted: true });
}
