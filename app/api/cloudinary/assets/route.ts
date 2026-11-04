import { NextRequest, NextResponse } from "next/server";
import { listAssets } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get("folder") ?? "shiabazaar";
  if (!folder.startsWith("shiabazaar")) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }
  const assets = await listAssets(folder);
  return NextResponse.json({ assets });
}
