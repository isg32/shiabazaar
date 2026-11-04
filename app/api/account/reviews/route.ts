import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const reviews = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
  });

  return NextResponse.json({ reviews });
}
