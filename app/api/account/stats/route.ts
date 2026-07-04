import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const [orders, wishlist, reviews] = await Promise.all([
    db.order.count({ where: { userId } }),
    db.wishlist.count({ where: { userId } }),
    db.review.count({ where: { userId } }),
  ]);

  return NextResponse.json({ orders, wishlist, reviews });
}
