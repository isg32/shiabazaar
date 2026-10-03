import type { Metadata } from "next";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ShareBars from "@/components/dashboard/ShareBars";
import ColumnChart from "@/components/dashboard/ColumnChart";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { loadFacts, summarizeAll } from "@/lib/bi/facts";
import { modeLabel, paymentModes } from "@/lib/bi/analytics";
import { loadAccounts } from "@/lib/bi/credit";
import { parseFilters, type SearchParams } from "@/lib/bi/filters";
import { bucketSummaries } from "@/lib/bi/trend";
import { bucketLabel, istDay } from "@/lib/bi/period";
import { inr, pct } from "@/lib/bi/format";
import { VIZ } from "@/lib/bi/colors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Payments & collections" };

export default async function Collections({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = { ...parseFilters(sp), category: null };
  const [facts, { accounts }] = await Promise.all([loadFacts(f, f.period.from, f.period.to), loadAccounts()]);
  const S = summarizeAll(facts);
  const modes = paymentModes(facts);
  const owed = accounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);
  const overdue = accounts.reduce((s, a) => s + a.overdue, 0);
  const trend = bucketSummaries(facts, f.period.from, f.period.to, f.grain).map(({ start, s }) => ({
    key: istDay(start), label: bucketLabel(start, f.grain), value: s.collected, valueText: inr(s.collected),
    details: [["At sale", inr(s.collectedAtSale)], ["Settlements", inr(s.settlements)], ["Net sales", inr(s.net)], ["Credit generated", inr(s.creditGenerated)]] as [string, string][],
  }));

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Payments &amp; collections</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · sale value is not the same as money collected</p>
        </div>
        <span className="flex gap-3"><ExportLinks id="collections" sp={sp} /></span>
      </div>
      <FilterBar showCategory={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6" data-testid="collection-tiles">
          <StatTile label="Net sales" value={inr(S.net)} />
          <StatTile label="Collected" value={inr(S.collected)} sub={`at sale ${inr(S.collectedAtSale)}`} emphasis />
          <StatTile label="Collection rate" value={`${pct(S.collected, S.net)}%`} sub="collected ÷ net sales" />
          <StatTile label="Credit generated" value={inr(S.creditGenerated)} upIsGood={false} />
          <StatTile label="Credit recovered" value={inr(S.settlements)} sub="school & vendor payments" />
          <StatTile label="Outstanding now" value={inr(owed)} href="/dashboard/ageing" />
          <StatTile label="Overdue now" value={inr(overdue)} href="/dashboard/credit?status=overdue" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <ShareBars title="Collected by payment mode" rows={modes.map((m) => ({
            key: m.method, label: modeLabel(m.method), value: m.amount, valueText: inr(m.amount), color: VIZ.accent, sub: `${m.transactions} payments`,
          }))} />
          <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-medium text-on-dark">Payment mode analysis</h2>
              <ExportLinks id="payment-modes" sp={sp} />
            </div>
            <table className="w-full text-sm" data-testid="mode-table">
              <thead><tr className="border-b border-white/8">
                {["Mode", "Payments", "At sale", "Settlements", "Total", "Share"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="tabular-nums">
                {modes.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-on-dark-soft">No payments in this period.</td></tr> : modes.map((m) => (
                  <tr key={m.method} className="border-b border-white/5">
                    <td className="px-4 py-3 text-on-dark">{modeLabel(m.method)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{m.transactions}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(m.atSale)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(m.settlements)}</td>
                    <td className="px-4 py-3 text-on-dark font-medium">{inr(m.amount)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{pct(m.amount, S.collected)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ColumnChart title="Collections over time" columns={trend} valueName="collected" />
      </FilterBar>
    </div>
  );
}
