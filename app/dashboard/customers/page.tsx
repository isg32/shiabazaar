import type { Metadata } from "next";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { customerActivity, type CustomerRow } from "@/lib/bi/analytics";
import { parseFilters, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { withFilters } from "@/lib/bi/filters";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Customers" };

const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function Table({ title, rows, extra, testId }: { title: string; rows: CustomerRow[]; extra?: (r: CustomerRow) => string; testId: string }) {
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid={testId}>
      <h2 className="px-5 py-4 border-b border-white/8 text-sm font-medium text-on-dark">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-8">None.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/8">
            {["Customer", "Purchases", "Total", "Avg", "Last purchase", extra ? "Change" : "Days since"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-white/5">
                <td className="px-4 py-2.5"><span className="text-on-dark">{r.name}</span><span className="block text-[11px] text-on-dark-soft">{r.contact} · {r.source}</span></td>
                <td className="px-4 py-2.5 text-xs text-on-dark-soft">{r.purchases}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark">{inr(r.total)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark-soft">{inr(r.avg)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark-soft">{day(r.last)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark-soft">{extra ? extra(r) : r.daysSince}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function Customers({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const { rows, inactiveDays } = await customerActivity(f, f.period.from, f.period.to, f.period.prevFrom);
  const has = (s: CustomerRow["segments"][number]) => rows.filter((r) => r.segments.includes(s));
  const buyersInPeriod = rows.filter((r) => r.periodValue > 0);
  const declining = rows.filter((r) => r.prevValue > 0 && r.periodValue < r.prevValue).sort((a, b) => (a.periodValue - a.prevValue) - (b.periodValue - b.prevValue)).slice(0, 15);

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Customer activity &amp; retention</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · individual buyers identified by phone (walk-in) or website account · inactive after {inactiveDays} days</p>
        </div>
        <span className="flex gap-2"><ExportLinks id="customer-sales" sp={sp} /></span>
      </div>
      <FilterBar showCategory={false} showBuyer={false}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="customer-tiles">
          <StatTile label="Customers" value={String(rows.length)} sub="identified, all time" />
          <StatTile label="Bought in period" value={String(buyersInPeriod.length)} sub={inr(buyersInPeriod.reduce((s, r) => s + r.periodValue, 0))} />
          <StatTile label="New" value={String(has("new").length)} sub="first purchase in period" />
          <StatTile label="Repeat" value={String(has("repeat").length)} sub="2+ purchases" />
          <StatTile label="Inactive" value={String(has("inactive").length)} sub={`no purchase for ${inactiveDays}+ days`} href={withFilters("/dashboard/reports/inactive-customers", sp)} />
        </div>
        <div className="grid xl:grid-cols-2 gap-6">
          <Table title="Top customers in the period" rows={buyersInPeriod.sort((a, b) => b.periodValue - a.periodValue).slice(0, 15)} testId="top-customers" />
          <Table title="Declining purchases (vs previous period)" rows={declining} testId="declining" extra={(r) => `${inr(r.prevValue)} → ${inr(r.periodValue)}`} />
          <Table title="Inactive customers" rows={has("inactive").sort((a, b) => b.total - a.total).slice(0, 15)} testId="inactive" />
          <Table title="New customers" rows={has("new").sort((a, b) => b.total - a.total).slice(0, 15)} testId="new" />
        </div>
        <p className="text-[11px] text-on-dark-soft/70 mt-4">
          Walk-in sales without a phone number can&apos;t be attributed to a customer and are not counted here. <Link className="text-primary" href="/dashboard/settings">Change the inactivity period</Link>.
        </p>
      </FilterBar>
    </div>
  );
}
