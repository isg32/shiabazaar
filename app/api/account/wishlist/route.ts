import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const items = await db.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          inStock: true,
          author: true,
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const { productId } = await request.json();
  await db.wishlist.deleteMany({ where: { userId, productId } });

  return NextResponse.json({ ok: true });
}
