import type { Metadata } from "next";
import FilterBar from "@/components/dashboard/FilterBar";
import { loadFacts } from "@/lib/bi/facts";
import { parseFilters, type SearchParams } from "@/lib/bi/filters";
import { inr, pct } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";
import { productRowsOf, type ProductRow } from "@/lib/bi/products";
import { VIZ } from "@/lib/bi/colors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Products" };

function ProductTable({ title, rows, metric, testId }: { title: string; rows: ProductRow[]; metric: "revenue" | "qty" | "discount"; testId: string }) {
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid={testId}>
      <h2 className="px-5 py-4 border-b border-white/8 text-sm font-medium text-on-dark">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-on-dark-soft text-center py-8">Nothing sold in this period.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Product", "Qty", "Revenue", metric === "discount" ? "Discount" : "Gross", metric === "discount" ? "Disc %" : "Returns"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.productId} className="border-b border-white/5">
                <td className="px-4 py-2.5 max-w-[260px]">
                  <p className="text-on-dark truncate flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: VIZ.main[r.main] }} title={r.main} />
                    {r.title}
                  </p>
                  <p className="text-[11px] text-on-dark-soft font-mono">{r.sku ?? "—"} · {r.main}</p>
                </td>
                <td className={`px-4 py-2.5 ${metric === "qty" ? "text-on-dark font-medium" : "text-on-dark-soft"}`}>{r.qty}</td>
                <td className={`px-4 py-2.5 ${metric === "revenue" ? "text-on-dark font-medium" : "text-on-dark-soft"}`}>{inr(r.revenue)}</td>
                <td className={`px-4 py-2.5 ${metric === "discount" ? "text-on-dark font-medium" : "text-on-dark-soft"}`}>{inr(metric === "discount" ? r.discount : r.gross)}</td>
                <td className="px-4 py-2.5 text-on-dark-soft">{metric === "discount" ? `${pct(r.discount, r.gross)}%` : r.returnedQty ? `${r.returnedQty} · ${inr(r.returns)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function Products({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, cats] = await Promise.all([loadFacts(f, f.period.from, f.period.to), categoryOptions()]);
  const rows = productRowsOf(facts).filter((r) => r.qty > 0);
  const by = (k: keyof ProductRow, dir = -1) => [...rows].sort((a, b) => dir * ((a[k] as number) - (b[k] as number)) || a.title.localeCompare(b.title)).slice(0, 10);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Products</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">
        {f.period.label} · {rows.length} products sold · {totalQty} units · {inr(totalRev)} revenue (net of discounts and returns)
      </p>
      <FilterBar categories={cats}>
        <div className="grid xl:grid-cols-2 gap-6">
          <ProductTable title="Top products by revenue" rows={by("revenue")} metric="revenue" testId="top-revenue" />
          <ProductTable title="Top products by quantity" rows={by("qty")} metric="qty" testId="top-qty" />
          <ProductTable title="Lowest-selling products (sold at least once)" rows={by("revenue", 1)} metric="revenue" testId="low-revenue" />
          <ProductTable title="Highest discounts given" rows={by("discount").filter((r) => r.discount > 0)} metric="discount" testId="top-discount" />
        </div>
      </FilterBar>
    </div>
  );
}
