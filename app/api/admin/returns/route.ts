import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const returns = await db.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          total: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ returns });
}
