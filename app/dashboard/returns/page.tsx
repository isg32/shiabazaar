import type { Metadata } from "next";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { loadFacts } from "@/lib/bi/facts";
import { mainCategory } from "@/lib/bi/facts";
import { buyerNames, cancellations, returnsBy } from "@/lib/bi/analytics";
import { parseFilters, type SearchParams } from "@/lib/bi/filters";
import { inr, pct } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Returns & cancellations" };

function Mini({ title, rows, testId }: { title: string; rows: { key: string; qty: number; amount: number; count: number }[]; testId?: string }) {
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid={testId}>
      <h2 className="px-5 py-3.5 border-b border-white/8 text-sm font-medium text-on-dark">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">No returns.</p> : (
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/8">{["", "Returns", "Qty", "Value"].map((h) => <th key={h} className="px-4 py-2 text-left font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="tabular-nums">{rows.slice(0, 10).map((r) => (
            <tr key={r.key} className="border-b border-white/5">
              <td className="px-4 py-2 text-on-dark">{r.key}</td><td className="px-4 py-2 text-on-dark-soft">{r.count}</td>
              <td className="px-4 py-2 text-on-dark-soft">{r.qty}</td><td className="px-4 py-2 text-on-dark">{inr(r.amount)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export default async function Returns({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, canc, cats] = await Promise.all([loadFacts(f, f.period.from, f.period.to), cancellations(f, f.period.from, f.period.to), categoryOptions()]);
  const names = await buyerNames([...new Set(facts.returns.map((r) => r.orderId))]);
  const value = facts.returns.reduce((s, r) => s + r.amount, 0);
  const qty = facts.returns.reduce((s, r) => s + r.qty, 0);
  const sold = Math.round(facts.lines.reduce((s, l) => s + l.net, 0));
  const accounts = returnsBy({ ...facts, returns: facts.returns.filter((r) => r.buyer !== "individual") }, (r) => names.get(r.orderId) ?? "—");

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Returns &amp; cancellations</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · returns are booked on the day they happen and reduce net sales, outstanding and product revenue</p>
        </div>
        <ExportLinks id="returns" sp={sp} />
      </div>
      <FilterBar categories={cats}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="returns-tiles">
          <StatTile label="Return value" value={inr(value)} emphasis />
          <StatTile label="Returned lines" value={String(facts.returns.length)} sub={`${qty} units`} />
          <StatTile label="Return rate" value={`${pct(value, sold)}%`} sub="of goods sold in period" />
          <StatTile label="Cancelled entries" value={String(canc.length)} sub={inr(canc.reduce((s, c) => s + c.subtotal - c.discountAmount, 0))} />
          <StatTile label="Transactions with returns" value={String(new Set(facts.returns.map((r) => r.orderId)).size)} />
        </div>
        <div className="grid xl:grid-cols-3 gap-6">
          <Mini title="Product-wise returns" testId="returns-product" rows={returnsBy(facts, (r) => r.title)} />
          <Mini title="Category-wise returns" rows={returnsBy(facts, (r) => mainCategory(r.type))} />
          <Mini title="School / vendor-wise returns" rows={accounts} />
        </div>
      </FilterBar>
    </div>
  );
}
