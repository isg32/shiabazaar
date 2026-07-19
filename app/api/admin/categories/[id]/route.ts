import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await request.json();
  // Moving a node between parents/groups isn't supported yet — restrict to safe fields
  // so a stray `group`/`parentId` in the body can't desync the denormalized tree.
  const data: { name?: string; active?: boolean; position?: number } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.position === "number") data.position = body.position;

  const category = await db.category.update({ where: { id }, data });
  revalidateTag("products", "max");
  return NextResponse.json({ category });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  // Descendant categories cascade-delete (parentId onDelete: Cascade) and any
  // products anywhere in the subtree are uncategorized (categoryId onDelete: SetNull) —
  // both handled at the DB level, no manual cleanup needed here.
  await db.category.delete({ where: { id } });
  revalidateTag("products", "max");
  return NextResponse.json({ deleted: true });
}
