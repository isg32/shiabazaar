import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk } from "@/lib/staff-guard";
import { optionalString, paymentTerms } from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const { id } = await params;

  const vendor = await db.vendor.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [orders, payments] = await Promise.all([
    db.order.findMany({
      where: { vendorId: id, buyerType: "vendor" },
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, title: true, qty: true, price: true } },
        returns: { select: { amount: true } },
      },
    }),
    db.vendor.findUnique({ where: { id } }).payments({ orderBy: { receivedAt: "desc" } }),
  ]);

  // Recompute the authoritative balance and reconcile the stored value if it drifted.
  // Credit generated per issue = total − paid at sale − returned value.
  const issued = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total - o.amountPaid - o.returns.reduce((r, x) => r + x.amount, 0), 0);
  const paid = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const balance = issued - paid;
  if (balance !== vendor.balance) {
    await db.vendor.update({ where: { id }, data: { balance } });
    vendor.balance = balance;
  }

  return NextResponse.json({ vendor, orders, payments: payments ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("name" in body) {
    const name = optionalString(body.name);
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    data.name = name;
  }
  for (const f of ["contactName", "phone", "email", "address", "city", "state", "notes"] as const) {
    if (f in body) data[f] = optionalString(body[f]);
  }
  if ("paymentTermsDays" in body) data.paymentTermsDays = paymentTerms(body.paymentTermsDays);
  if ("creditLimit" in body) {
    const r = Number(body.creditLimit);
    data.creditLimit = Number.isFinite(r) && r > 0 ? Math.round(r * 100) : 0;
  }
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const vendor = await db.vendor.update({ where: { id }, data });
    return NextResponse.json({ vendor });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A vendor with that code already exists." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const { id } = await params;

  const [orderCount, paymentCount, vendor] = await Promise.all([
    db.order.count({ where: { vendorId: id } }),
    db.vendorPayment.count({ where: { vendorId: id } }),
    db.vendor.findUnique({ where: { id }, select: { balance: true } }),
  ]);
  if (!vendor) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (orderCount > 0 || paymentCount > 0 || vendor.balance !== 0) {
    return NextResponse.json(
      { error: "This vendor has ledger history and cannot be deleted. Deactivate it instead." },
      { status: 409 },
    );
  }

  await db.vendor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
