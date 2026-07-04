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
  const { stock } = await request.json();

  const variant = await db.productVariant.update({
    where: { id },
    data: { stock: Math.max(0, parseInt(stock, 10) || 0) },
  });

  return NextResponse.json({ variant });
}
