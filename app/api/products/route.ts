import { NextRequest, NextResponse } from "next/server";
import { searchProducts, getProducts } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const products = q.trim() ? await searchProducts(q) : await getProducts({ limit: 200 });
  return NextResponse.json({ products });
}
