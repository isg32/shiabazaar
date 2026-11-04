import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";
import { normalizePhone } from "@/lib/customers";

export const dynamic = "force-dynamic";

/** Look up a walk-in customer by phone so the sale form can prefill their name. */
export async function GET(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const phone = normalizePhone(req.nextUrl.searchParams.get("phone"));
  if (!phone) return NextResponse.json({ customer: null });
  const customer = await db.customer.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, _count: { select: { orders: true } } },
  });
  return NextResponse.json({ customer });
}
