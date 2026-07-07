import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const categories = await db.category.findMany({
    orderBy: [{ group: "asc" }, { position: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { name, slug, group, position } = await request.json();
  if (!name || !slug || !group) {
    return NextResponse.json({ error: "name, slug, and group are required" }, { status: 400 });
  }

  const category = await db.category.create({
    data: { name, slug, group, position: position ?? 0 },
  });
  return NextResponse.json({ category });
}
