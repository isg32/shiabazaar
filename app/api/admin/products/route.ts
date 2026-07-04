import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: true, variants: true },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const body = await req.json();
  const product = await db.product.create({
    data: {
      slug:          body.slug,
      title:         body.title,
      type:          body.type,
      price:         Math.round(body.price * 100),
      originalPrice: body.originalPrice ? Math.round(body.originalPrice * 100) : null,
      inStock:       body.inStock ?? true,
      badge:         body.badge ?? null,
      author:        body.author ?? null,
      isbn:          body.isbn ?? null,
      publisher:     body.publisher ?? null,
      language:      body.language ?? null,
      genre:         body.genre ?? null,
      pageCount:     body.pageCount ?? null,
      edition:       body.edition ?? null,
      description:   body.description ?? null,
      tableOfContents: body.tableOfContents ?? null,
    },
    include: { images: true, variants: true },
  });
  return NextResponse.json({ product }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { ids } = await req.json();
  await db.product.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: ids.length });
}
