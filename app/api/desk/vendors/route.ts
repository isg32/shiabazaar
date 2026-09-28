import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";
import { optionalString } from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const vendors = await db.vendor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { orders: true, payments: true } } },
  });
  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const body = await req.json();
  const name = optionalString(body.name);
  if (!name) {
    return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
  }

  const creditRupees = Number(body.creditLimit);
  const creditLimit = Number.isFinite(creditRupees) && creditRupees > 0 ? Math.round(creditRupees * 100) : 0;

  try {
    const vendor = await db.vendor.create({
      data: {
        name,
        code: optionalString(body.code),
        contactName: optionalString(body.contactName),
        phone: optionalString(body.phone),
        email: optionalString(body.email),
        address: optionalString(body.address),
        creditLimit,
      },
    });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A vendor with that code already exists." }, { status: 409 });
    }
    throw err;
  }
}
