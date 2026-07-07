import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: [{ group: "asc" }, { position: "asc" }],
    select: { id: true, name: true, slug: true, group: true },
  });
  return NextResponse.json({ categories });
}
