import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}
