import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const { label, stock = 0, price } = await req.json();

  const variant = await db.productVariant.create({
    data: {
      productId: id,
      label,
      stock: Number(stock),
      price: price ? Math.round(Number(price) * 100) : null,
    },
  });

  return NextResponse.json({ variant }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const { variantId } = await req.json();

  await db.productVariant.deleteMany({ where: { id: variantId, productId: id } });

  return NextResponse.json({ deleted: true });
}
