import { auth } from "./auth/server";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<{ error: NextResponse } | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return null;
}
