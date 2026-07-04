import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const rows = await db.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          title: true, price: true, type: true, author: true,
          images: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
      variant: { select: { label: true, price: true } },
    },
  });

  const items = rows.map(r => ({
    productId:   r.productId,
    variantId:   r.variantId ?? null,
    qty:         r.qty,
    title:       r.product.title,
    price:       (r.variant?.price ?? r.product.price) / 100,  // rupees
    coverImage:  r.product.images[0]?.url ?? "",
    author:      r.product.author ?? null,
    type:        r.product.type,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const { productId, variantId = null, qty } = await request.json();

  if (!productId || typeof qty !== "number" || qty < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await db.cartItem.findFirst({ where: { userId, productId, variantId } });
  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { qty } });
  } else {
    await db.cartItem.create({ data: { userId, productId, variantId, qty } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const body = await request.json();

  if (body.clear) {
    await db.cartItem.deleteMany({ where: { userId } });
  } else {
    const { productId, variantId = null } = body;
    await db.cartItem.deleteMany({ where: { userId, productId, variantId } });
  }

  return NextResponse.json({ ok: true });
}
