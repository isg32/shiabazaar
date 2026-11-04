import { auth } from "./auth/server";
import { db } from "./db";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<{ error: NextResponse } | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return null;
}
