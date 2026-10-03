import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

const FIELDS = {
  paymentTermsDays: [0, 3650],
  creditWatchPct: [1, 100],
  creditNearPct: [1, 100],
  inactiveDays: [1, 3650],
  unusualDiscountPct: [1, 100],
} as const;

/** Admin-only: update business-rule thresholds used by credit monitoring and alerts. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;
  const body = await req.json();
  const data: Record<string, number> = {};
  for (const [k, [lo, hi]] of Object.entries(FIELDS)) {
    if (!(k in body)) continue;
    const n = Math.trunc(Number(body[k]));
    if (!Number.isFinite(n) || n < lo || n > hi) {
      return NextResponse.json({ error: `${k} must be between ${lo} and ${hi}.` }, { status: 400 });
    }
    data[k] = n;
  }
  const watch = data.creditWatchPct, near = data.creditNearPct;
  const cur = await db.businessSettings.findUnique({ where: { id: 1 } });
  if ((watch ?? cur?.creditWatchPct ?? 70) >= (near ?? cur?.creditNearPct ?? 90)) {
    return NextResponse.json({ error: "The watch threshold must be below the near-limit threshold." }, { status: 400 });
  }
  const settings = await db.businessSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return NextResponse.json({ settings });
}
