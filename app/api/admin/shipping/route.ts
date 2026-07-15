import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const zones = await db.shippingZone.findMany({ orderBy: { zone: "asc" } });
  return NextResponse.json(zones);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { zone: string; price: number }[];
  await Promise.all(
    body.map(({ zone, price }) =>
      db.shippingZone.update({ where: { zone }, data: { price } })
    )
  );
  return NextResponse.json({ ok: true });
}
