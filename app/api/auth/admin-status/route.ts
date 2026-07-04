import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ isAdmin: false });

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  return NextResponse.json({ isAdmin: user?.isAdmin ?? false });
}
