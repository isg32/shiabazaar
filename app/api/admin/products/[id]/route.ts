import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { images: true, variants: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { ...body };
  if (body.price !== undefined) data.price = Math.round(body.price * 100);
  if (body.originalPrice !== undefined) data.originalPrice = body.originalPrice ? Math.round(body.originalPrice * 100) : null;

  try {
    const product = await db.product.update({ where: { id }, data, include: { images: true, variants: true } });
    revalidateTag("products", "max");
    return NextResponse.json({ product });
  } catch (e) {
    console.error("PATCH /api/admin/products/[id] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  await db.product.delete({ where: { id } });
  revalidateTag("products", "max");
  return NextResponse.json({ deleted: true });
}
