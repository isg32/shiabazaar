import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const popups = await db.popup.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ popups });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { title, code, trigger, delayMs } = await request.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const popup = await db.popup.create({
    data: { title, code: code || null, trigger: trigger || "page_load", delayMs: delayMs || 3000 },
  });
    revalidateTag("homepage", "max");
  return NextResponse.json({ popup }, { status: 201 });
}
