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
  const { status, adminNote } = await request.json();

  const updated = await db.returnRequest.update({
    where: { id },
    data: { status, adminNote: adminNote ?? undefined },
  });

  return NextResponse.json({ returnRequest: updated });
}
