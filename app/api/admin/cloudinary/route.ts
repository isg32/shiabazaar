import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listAssets, deleteAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const assets = await listAssets("shiabazaar", 200);
  return NextResponse.json({ assets });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { publicId } = await request.json();
  if (!publicId) return NextResponse.json({ error: "publicId required" }, { status: 400 });

  await deleteAsset(publicId);
  // Remove orphaned DB record if it exists
  await db.productImage.deleteMany({ where: { cloudinaryId: publicId } });

  return NextResponse.json({ deleted: true });
}
