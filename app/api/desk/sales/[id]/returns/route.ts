import { NextRequest, NextResponse } from "next/server";
import { requireClerk, getStaffUser } from "@/lib/staff-guard";
import { DeskOrderError, createDeskReturn, optionalString } from "@/lib/desk-orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireClerk();
  if (guard) return guard.error;
  const staff = await getStaffUser();
  const { id } = await params;

  try {
    const body = await req.json();
    const ret = await createDeskReturn({
      orderId: id,
      lines: Array.isArray(body.lines) ? body.lines : [],
      note: optionalString(body.note),
      staffId: staff?.id ?? null,
    });
    return NextResponse.json(ret, { status: 201 });
  } catch (err) {
    if (err instanceof DeskOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
