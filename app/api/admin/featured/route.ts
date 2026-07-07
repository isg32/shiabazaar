import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const featured = await db.homepageFeatured.findMany({
    orderBy: { position: "asc" },
    include: {
      product: { select: { id: true, title: true, type: true, price: true } },
    },
  });
  return NextResponse.json({ featured });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const count = await db.homepageFeatured.count();
  const item = await db.homepageFeatured.upsert({
    where: { productId },
    create: { productId, position: count },
    update: {},
    include: { product: { select: { id: true, title: true, type: true, price: true } } },
  });
    revalidateTag("products", "max");
  revalidateTag("homepage", "max");
  return NextResponse.json({ item }, { status: 201 });
}
