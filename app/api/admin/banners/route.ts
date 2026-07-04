import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const banners = await db.banner.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { title, subtitle, ctaLabel, ctaUrl } = await request.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await db.banner.count();
  const banner = await db.banner.create({
    data: { title, subtitle: subtitle || null, ctaLabel: ctaLabel || "Shop Now", ctaUrl: ctaUrl || "/products", position: count },
  });
  return NextResponse.json({ banner }, { status: 201 });
}
