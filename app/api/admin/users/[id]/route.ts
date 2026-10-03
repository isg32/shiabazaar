import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { auth } from "@/lib/auth/server";
import type { Prisma } from "@prisma/client";

/** Admin-only role/ban changes. Roles can only be given to users who already have an account. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();

  const data: Prisma.UserUpdateInput = {};
  for (const f of ["banned", "isAdmin", "isClerk", "isReader"] as const) {
    if (typeof body[f] === "boolean") data[f] = body[f];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Don't let an admin lock themselves out of the admin panel.
  const { data: session } = await auth.getSession();
  if (session?.user?.email === target.email && (data.isAdmin === false || data.banned === true)) {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}
