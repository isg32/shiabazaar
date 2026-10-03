import type { Metadata } from "next";
import FilterBar from "@/components/dashboard/FilterBar";
import ShareBars from "@/components/dashboard/ShareBars";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { staffPerformance } from "@/lib/bi/analytics";
import { parseFilters, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";
import { VIZ } from "@/lib/bi/colors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Staff performance" };

export default async function Staff({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [rows, cats] = await Promise.all([staffPerformance(f, f.period.from, f.period.to), categoryOptions()]);
  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Salesperson / user performance</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · who entered each desk sale, issue and payment</p>
        </div>
        <ExportLinks id="staff-performance" sp={sp} />
      </div>
      <FilterBar categories={cats}>
        <div className="grid lg:grid-cols-3 gap-6">
          <ShareBars title="Share of net sales entered" rows={rows.slice(0, 6).map((r) => ({
            key: r.key, label: r.name, value: r.sales, valueText: inr(r.sales), color: r.key === "online" ? VIZ.channel.online : VIZ.accent, sub: `${r.transactions} transactions`,
          }))} />
          <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
            <table className="w-full text-sm" data-testid="staff-table">
              <thead><tr className="border-b border-white/8">
                {["Entered by", "Transactions", "Net sales", "Avg", "Discounts given", "Credit generated", "Collections recorded"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="tabular-nums">
                {rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-on-dark-soft">No activity in this period.</td></tr> : rows.map((r) => (
                  <tr key={r.key} className="border-b border-white/5">
                    <td className="px-4 py-3 text-on-dark">{r.name}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{r.transactions}</td>
                    <td className="px-4 py-3 text-on-dark font-medium">{inr(r.sales)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(r.avg)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(r.discount)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(r.creditGenerated)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(r.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FilterBar>
    </div>
  );
}
