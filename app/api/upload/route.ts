import { NextRequest, NextResponse } from "next/server";
import { signUploadParams } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const { folder } = await req.json();
  if (!folder || !folder.startsWith("shiabazaar/")) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }
  const params = await signUploadParams(folder);
  return NextResponse.json(params);
}
