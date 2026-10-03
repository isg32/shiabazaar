import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ColumnChart from "@/components/dashboard/ColumnChart";
import { loadFacts, pctChange, summarize, summarizeAll, type Facts } from "@/lib/bi/facts";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { GRAINS, resolvePeriod } from "@/lib/bi/period";
import { buildTrend } from "@/lib/bi/trend";
import { inr } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Sales analytics" };

const slice = (f: Facts, from: Date, to: Date) => {
  const inR = (d: Date) => d >= from && d < to;
  return summarize(f.lines.filter((l) => inR(l.at)), f.returns.filter((r) => inR(r.at)), f.orders, f.settlements.filter((s) => inR(s.at)), f.categoryScoped);
};

export default async function SalesAnalytics({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const { period } = f;

  // Fixed PDF comparisons (today vs yesterday … this year vs last) under the same channel/buyer/category filters.
  const pairs = [
    ["Today vs yesterday", resolvePeriod("today"), resolvePeriod("yesterday")],
    ["This week vs last week", resolvePeriod("thisweek"), resolvePeriod("lastweek")],
    ["This month vs last month", resolvePeriod("thismonth"), resolvePeriod("lastmonth")],
    ["This year vs last year", resolvePeriod("thisyear"), { from: resolvePeriod("thisyear").prevFrom, to: resolvePeriod("thisyear").prevTo }],
  ] as const;
  const cmpFrom = pairs[3][2].from;
  const cmpTo = pairs[0][1].to; // end of today (IST)

  const [cur, prev, cmp, cats] = await Promise.all([
    loadFacts(f, period.from, period.to),
    loadFacts(f, period.prevFrom, period.prevTo),
    loadFacts(f, cmpFrom, cmpTo),
    categoryOptions(),
  ]);
  const S = summarizeAll(cur);
  const P = summarizeAll(prev);
  const trend = buildTrend(cur, period.from, period.to, f.grain);
  const tx = withFilters("/dashboard/transactions", sp);
  const na = "n/a with a category filter";

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Sales analytics</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5" data-testid="period-label">{period.label} · compared with the previous period</p>

      <FilterBar categories={cats}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Net sales" value={inr(S.net)} delta={pctChange(S.net, P.net)} sub="after discounts & returns" href={tx} emphasis />
          <StatTile label="Gross sales" value={inr(S.gross)} delta={pctChange(S.gross, P.gross)} sub="at MRP" href={tx} />
          <StatTile label="Discount" value={inr(S.discount)} delta={pctChange(S.discount, P.discount)} upIsGood={false}
            sub={S.gross ? `${Math.round((S.discount / S.gross) * 1000) / 10}% of gross` : undefined} href={tx} />
          <StatTile label="Returns" value={inr(S.returns)} delta={pctChange(S.returns, P.returns)} upIsGood={false} />
          <StatTile label="Transactions" value={String(S.transactions)} delta={pctChange(S.transactions, P.transactions)} sub={`${S.qty} units`} href={tx} />
          <StatTile label="Avg transaction" value={inr(S.avg)} delta={pctChange(S.avg, P.avg)} />
          <StatTile label="Collected" value={S.categoryScoped ? "—" : inr(S.collected)} delta={S.categoryScoped ? null : pctChange(S.collected, P.collected)}
            sub={S.categoryScoped ? na : `at sale ${inr(S.collectedAtSale)} · settlements ${inr(S.settlements)}`} />
          <StatTile label="Credit generated" value={S.categoryScoped ? "—" : inr(S.creditGenerated)} upIsGood={false}
            delta={S.categoryScoped ? null : pctChange(S.creditGenerated, P.creditGenerated)} sub={S.categoryScoped ? na : "school & vendor issues"}
            href={withFilters("/dashboard/credit", {})} />
        </div>

        <div className="flex items-center gap-1 mb-3" data-testid="grain-switch">
          {GRAINS.map(([g, label]) => (
            <Link key={g} href={withFilters("/dashboard/sales", sp, { grain: g })}
              className={`px-3 h-7 inline-flex items-center text-xs rounded-md ${f.grain === g ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>
              {label}
            </Link>
          ))}
        </div>
        <ColumnChart title="Net sales over time" columns={trend} valueName="net sales" />

        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-sm font-medium text-on-dark">Sales comparison</h2>
          </div>
          <table className="w-full text-sm" data-testid="comparison">
            <thead>
              <tr className="border-b border-white/8">
                {["", "Net sales", "Previous", "Change", "Transactions", "Previous"].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {pairs.map(([label, a, b]) => {
                const A = slice(cmp, a.from, a.to), B = slice(cmp, b.from, b.to);
                const ch = pctChange(A.net, B.net);
                return (
                  <tr key={label} className="border-b border-white/5">
                    <td className="px-5 py-3 text-on-dark">{label}</td>
                    <td className="px-5 py-3 text-on-dark font-medium">{inr(A.net)}</td>
                    <td className="px-5 py-3 text-on-dark-soft">{inr(B.net)}</td>
                    <td className={`px-5 py-3 ${ch == null ? "text-on-dark-soft" : ch >= 0 ? "text-success" : "text-error"}`}>
                      {ch == null ? "—" : `${ch > 0 ? "+" : ""}${ch}%`}
                    </td>
                    <td className="px-5 py-3 text-on-dark">{A.transactions}</td>
                    <td className="px-5 py-3 text-on-dark-soft">{B.transactions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FilterBar>
    </div>
  );
}
