import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

const COLUMNS = [
  "title","slug","type","price","original_price","in_stock",
  "badge","category_name","description","author","publisher",
  "language","genre","isbn","edition","page_count",
];

function esc(v: unknown) {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  const rows = products.map((p) => [
    esc(p.title),
    esc(p.slug),
    esc(p.type),
    esc(p.price / 100),
    esc(p.originalPrice ? p.originalPrice / 100 : ""),
    esc(p.inStock),
    esc(p.badge ?? ""),
    esc(p.category?.name ?? ""),
    esc(p.description ?? ""),
    esc(p.author ?? ""),
    esc(p.publisher ?? ""),
    esc(p.language ?? ""),
    esc(p.genre ?? ""),
    esc(p.isbn ?? ""),
    esc(p.edition ?? ""),
    esc(p.pageCount ?? ""),
  ].join(","));

  const csv = [COLUMNS.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="shiabazaar-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
