import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const categories = await db.category.findMany({
    orderBy: [{ group: "asc" }, { position: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { name, slug, group, parentId, position } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  // Subcategories inherit their group from the parent — a tree can't span groups.
  let resolvedGroup = group;
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId }, select: { group: true } });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
    resolvedGroup = parent.group;
  } else if (!group) {
    return NextResponse.json({ error: "group is required for a top-level category" }, { status: 400 });
  }

  const category = await db.category.create({
    data: { name, slug, group: resolvedGroup, parentId: parentId ?? null, position: position ?? 0 },
  });
  revalidateTag("products", "max");
  return NextResponse.json({ category });
}
