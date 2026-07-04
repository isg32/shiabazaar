import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      },
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await ensureUser(session.user.email, session.user.name);
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const user = await db.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: { name: true, email: true },
  });

  return NextResponse.json({ user });
}
