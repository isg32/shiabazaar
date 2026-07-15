import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyZone } from "@/lib/shipping";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode")?.trim();
  if (!pincode || !/^[1-9]\d{5}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  // India Post public API — no auth, free
  let state: string;
  let district: string;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 86400 }, // cache 24h per pincode
    });
    const data = await res.json();
    if (!data?.[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
      return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
    }
    const po = data[0].PostOffice[0];
    state = po.State as string;
    district = po.District as string;
  } catch {
    return NextResponse.json({ error: "Could not verify pincode" }, { status: 502 });
  }

  const zone = classifyZone(state, district);
  const row = await db.shippingZone.findUnique({ where: { zone } });

  return NextResponse.json({
    zone,
    label: row?.label ?? zone,
    price: row?.price ?? 0, // paise
    state,
    district,
  });
}
