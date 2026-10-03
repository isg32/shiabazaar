import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ColumnChart from "@/components/dashboard/ColumnChart";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { loadFacts } from "@/lib/bi/facts";
import { discountByBuyer, discountByMain, discountTransactions } from "@/lib/bi/analytics";
import { productRowsOf } from "@/lib/bi/products";
import { BUYER_LABEL, parseFilters, type Buyer, type SearchParams } from "@/lib/bi/filters";
import { bucketSummaries } from "@/lib/bi/trend";
import { bucketLabel, istDay } from "@/lib/bi/period";
import { inr, pct } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Discount analysis" };

function Mini({ title, head, rows, testId }: { title: string; head: string[]; rows: (string | number)[][]; testId?: string }) {
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid={testId}>
      <h2 className="px-5 py-3.5 border-b border-white/8 text-sm font-medium text-on-dark">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">None.</p> : (
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/8">{head.map((h) => <th key={h} className="px-4 py-2 text-left font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="tabular-nums">{rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5">{r.map((v, j) => <td key={j} className={`px-4 py-2 ${j === 0 ? "text-on-dark" : "text-on-dark-soft"}`}>{v}</td>)}</tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export default async function Discounts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, cats] = await Promise.all([loadFacts(f, f.period.from, f.period.to), categoryOptions()]);
  const txs = await discountTransactions(facts);
  const gross = facts.lines.reduce((s, l) => s + l.gross, 0);
  const net = Math.round(facts.lines.reduce((s, l) => s + l.net, 0));
  const trend = bucketSummaries(facts, f.period.from, f.period.to, f.grain).map(({ start, s }) => ({
    key: istDay(start), label: bucketLabel(start, f.grain), value: s.discount, valueText: inr(s.discount),
    details: [["MRP value", inr(s.gross)], ["Discount %", `${pct(s.discount, s.gross)}%`], ["Transactions", String(s.transactions)]] as [string, string][],
  }));
  const byBuyer = (b: Buyer) => discountByBuyer(txs, b).slice(0, 8).map((r) => [r.name, r.transactions, inr(r.discount), `${pct(r.discount, r.gross)}%`]);

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Discount analysis</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · discount = MRP value − amount charged (line discounts + bill discounts)</p>
        </div>
        <ExportLinks id="discounts" sp={sp} />
      </div>
      <FilterBar categories={cats}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="discount-tiles">
          <StatTile label="MRP value" value={inr(gross)} />
          <StatTile label="Total discount" value={inr(gross - net)} emphasis />
          <StatTile label="Discount %" value={`${pct(gross - net, gross)}%`} sub="of MRP value" />
          <StatTile label="Net (before returns)" value={inr(net)} />
          <StatTile label="Discounted transactions" value={String(txs.length)} sub={`of ${facts.orders.size}`} />
        </div>
        <div className="mb-6"><ColumnChart title="Discount over time" columns={trend} valueName="discount" /></div>
        <div className="grid xl:grid-cols-2 gap-6">
          <Mini title="Highest-discount transactions" testId="top-discount-tx" head={["Transaction", "Buyer", "Discount", "%"]}
            rows={txs.slice(0, 10).map((t) => [`#${t.orderId.slice(0, 8).toUpperCase()}`, t.buyerName, inr(t.discount), `${t.pct}%`])} />
          <Mini title="Product-wise discount" head={["Product", "Qty", "Discount", "%"]}
            rows={productRowsOf(facts).filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 10).map((p) => [p.title, p.qty, inr(p.discount), `${pct(p.discount, p.gross)}%`])} />
          <Mini title={`Highest-discount customers (${BUYER_LABEL.individual})`} head={["Customer", "Transactions", "Discount", "%"]} rows={byBuyer("individual")} />
          <Mini title="Highest-discount schools" head={["School", "Transactions", "Discount", "%"]} rows={byBuyer("school")} />
          <Mini title="Highest-discount vendors" head={["Vendor", "Transactions", "Discount", "%"]} rows={byBuyer("vendor")} />
          <Mini title="Category-wise discount" head={["Main category", "MRP value", "Discount", "%"]}
            rows={discountByMain(facts).map((r) => [r.main, inr(r.gross), inr(r.discount), `${pct(r.discount, r.gross)}%`])} />
        </div>
        <p className="text-[11px] text-on-dark-soft/70 mt-4">Click through to individual transactions from the <Link href="/dashboard/reports/discounts" className="text-primary">discount report</Link>.</p>
      </FilterBar>
    </div>
  );
}
