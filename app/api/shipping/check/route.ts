import { NextRequest, NextResponse } from "next/server";
import { quoteShippingForPincode } from "@/lib/shipping";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode")?.trim();
  if (!pincode) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const quote = await quoteShippingForPincode(pincode);
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check pincode.";
    const status = message === "Pincode not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
