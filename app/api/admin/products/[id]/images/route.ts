import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteAsset } from "@/lib/cloudinary";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const { url, cloudinaryId, isCover = false, alt = null } = await req.json();

  if (isCover) {
    await db.productImage.updateMany({ where: { productId: id }, data: { isCover: false } });
  }

  const image = await db.productImage.create({
    data: { productId: id, url, cloudinaryId, isCover, alt },
  });

  return NextResponse.json({ image }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { id } = await params;
  const { imageId } = await req.json();

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteAsset(image.cloudinaryId).catch(() => {});
  await db.productImage.delete({ where: { id: imageId } });

  return NextResponse.json({ deleted: true });
}
