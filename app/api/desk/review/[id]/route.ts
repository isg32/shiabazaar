import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";

export const dynamic = "force-dynamic";

/** Record a swipe: approve / reject, or undo your own last decision. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;
  const { decision } = await req.json().catch(() => ({}));
  if (!["approve", "reject", "undo"].includes(decision)) {
    return NextResponse.json({ error: "decision must be approve, reject or undo." }, { status: 400 });
  }
  const product = await db.product.findUnique({ where: { id }, select: { reviewStatus: true, reviewedById: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  if (decision === "undo") {
    if (product.reviewStatus === "pending") return NextResponse.json({ ok: true });
    if (product.reviewedById !== staff?.id) {
      return NextResponse.json({ error: "Someone else reviewed this product since; it can't be undone here." }, { status: 403 });
    }
    await db.product.update({ where: { id }, data: { reviewStatus: "pending", reviewedAt: null, reviewedById: null } });
    return NextResponse.json({ ok: true });
  }

  await db.product.update({
    where: { id },
    data: { reviewStatus: decision === "approve" ? "approved" : "rejected", reviewedAt: new Date(), reviewedById: staff?.id ?? null },
  });
  return NextResponse.json({ ok: true });
}
