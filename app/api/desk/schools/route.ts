import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";
import { optionalString, paymentTerms } from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const schools = await db.school.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { orders: true, payments: true } } },
  });
  return NextResponse.json({ schools });
}

export async function POST(req: NextRequest) {
  const guard = await requireClerk();
  if (guard) return guard.error;

  const body = await req.json();
  const name = optionalString(body.name);
  if (!name) {
    return NextResponse.json({ error: "School name is required." }, { status: 400 });
  }

  const creditRupees = Number(body.creditLimit);
  const creditLimit = Number.isFinite(creditRupees) && creditRupees > 0 ? Math.round(creditRupees * 100) : 0;

  try {
    const school = await db.school.create({
      data: {
        name,
        contactName: optionalString(body.contactName),
        phone: optionalString(body.phone),
        email: optionalString(body.email),
        address: optionalString(body.address),
        city: optionalString(body.city),
        state: optionalString(body.state),
        paymentTermsDays: paymentTerms(body.paymentTermsDays),
        creditLimit,
      },
    });
    return NextResponse.json({ school }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A school with that code already exists." }, { status: 409 });
    }
    throw err;
  }
}
