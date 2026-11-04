import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const popular = await db.homepagePopularBook.findMany({
    orderBy: { position: "asc" },
    include: { product: { select: { id: true, title: true, author: true, publisher: true, price: true } } },
  });
  return NextResponse.json({ popular });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const count = await db.homepagePopularBook.count();
  const item = await db.homepagePopularBook.upsert({
    where: { productId },
    create: { productId, position: count },
    update: {},
    include: { product: { select: { id: true, title: true, author: true, publisher: true, price: true } } },
  });
  revalidateTag("homepage", "max");
  return NextResponse.json({ item }, { status: 201 });
}
