import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import { loadFacts, summarize, mainCategory, type MainCategory } from "@/lib/bi/facts";
import { customerActivity, institutionPerformance } from "@/lib/bi/analytics";
import { inactiveAccounts, loadAccounts } from "@/lib/bi/credit";
import { productRowsOf } from "@/lib/bi/products";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { inr, pct } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Top & bottom performers" };

function Rank({ title, head, rows, more, testId }: { title: string; head: string[]; rows: (string | number)[][]; more?: string; testId?: string }) {
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid={testId}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
        <h2 className="text-sm font-medium text-on-dark">{title}</h2>
        {more && <Link href={more} className="text-xs text-primary">Full report</Link>}
      </div>
      {rows.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">None.</p> : (
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/8"><th className="px-4 py-2 text-left font-medium text-on-dark-soft">#</th>{head.map((h) => <th key={h} className="px-4 py-2 text-left font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="tabular-nums">{rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5"><td className="px-4 py-2 text-on-dark-soft">{i + 1}</td>{r.map((v, j) => <td key={j} className={`px-4 py-2 ${j === 0 ? "text-on-dark" : "text-on-dark-soft"}`}>{v}</td>)}</tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export default async function Rankings({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, schools, vendors, { accounts, settings }, people, cats] = await Promise.all([
    loadFacts(f, f.period.from, f.period.to),
    institutionPerformance("school", f, f.period.from, f.period.to),
    institutionPerformance("vendor", f, f.period.from, f.period.to),
    loadAccounts(),
    customerActivity(f, f.period.from, f.period.to, f.period.prevFrom),
    categoryOptions(),
  ]);
  const products = productRowsOf(facts).filter((p) => p.qty > 0);
  const total = products.reduce((s, p) => s + p.revenue, 0);
  const mains = (["Books", "Gifts", "Other"] as MainCategory[]).map((m) => ({ m, s: summarize(facts.lines.filter((l) => mainCategory(l.type) === m), facts.returns.filter((r) => mainCategory(r.type) === m), facts.orders, [], true) }))
    .sort((a, b) => b.s.net - a.s.net);
  const idle = (k: "school" | "vendor") => inactiveAccounts(accounts.filter((a) => a.kind === k), settings.inactiveDays).slice(0, 8);
  const declining = people.rows.filter((r) => r.prevValue > 0 && r.periodValue < r.prevValue)
    .sort((a, b) => (a.periodValue - a.prevValue) - (b.periodValue - b.prevValue)).slice(0, 8);
  const topInst = (rows: typeof schools) => rows.filter((r) => r.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 8).map((r) => [r.account.name, inr(r.sales), r.transactions, inr(r.avg)]);

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Top &amp; bottom performers</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · each ranking uses one metric</p>
      <FilterBar categories={cats}>
        <div className="grid xl:grid-cols-2 gap-6">
          <Rank title="Top schools by sales" testId="rank-schools" head={["School", "Sales", "Orders", "Avg order"]} rows={topInst(schools)} more={withFilters("/dashboard/reports/top-schools", sp)} />
          <Rank title="Top vendors by sales" head={["Vendor", "Sales", "Orders", "Avg order"]} rows={topInst(vendors)} more={withFilters("/dashboard/reports/top-vendors", sp)} />
          <Rank title="Top products by revenue" testId="rank-products" head={["Product", "Qty", "Revenue"]} rows={[...products].sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((p) => [p.title, p.qty, inr(p.revenue)])} more={withFilters("/dashboard/reports/top-products", sp)} />
          <Rank title="Top categories" head={["Category", "Revenue", "Contribution"]} rows={mains.filter((x) => x.s.qty > 0).map(({ m, s }) => [m, inr(s.net), `${pct(s.net, total)}%`])} more={withFilters("/dashboard/categories", sp)} />
          <Rank title="Lowest-performing products (sold)" head={["Product", "Qty", "Revenue"]} rows={[...products].sort((a, b) => a.revenue - b.revenue).slice(0, 8).map((p) => [p.title, p.qty, inr(p.revenue)])} />
          <Rank title="Customers with declining purchases" head={["Customer", "Before", "Now"]} rows={declining.map((r) => [r.name, inr(r.prevValue), inr(r.periodValue)])} more={withFilters("/dashboard/customers", sp)} />
          <Rank title={`Inactive schools (> ${settings.inactiveDays} days)`} head={["School", "Days since sale", "Outstanding"]} rows={idle("school").map(({ a, days }) => [a.name, days, inr(a.balance)])} more="/dashboard/reports/inactive-schools" />
          <Rank title={`Inactive vendors (> ${settings.inactiveDays} days)`} head={["Vendor", "Days since sale", "Outstanding"]} rows={idle("vendor").map(({ a, days }) => [a.name, days, inr(a.balance)])} more="/dashboard/reports/inactive-vendors" />
        </div>
      </FilterBar>
    </div>
  );
}
