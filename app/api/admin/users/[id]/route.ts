import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const body = await req.json();

  const data: Prisma.UserUpdateInput = {};
  if (typeof body.banned === "boolean") data.banned = body.banned;
  if (typeof body.isAdmin === "boolean") data.isAdmin = body.isAdmin;
  if (typeof body.isClerk === "boolean") data.isClerk = body.isClerk;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 });
  }

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}
