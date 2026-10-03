import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { ParamSelect } from "@/components/dashboard/ParamControls";
import { institutionPerformance, SEGMENT_HELP, SEGMENT_LABEL, type InstitutionRow, type Segment } from "@/lib/bi/analytics";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";
import type { Kind } from "@/lib/bi/credit";

const SEGMENTS: Segment[] = ["high", "medium", "low", "frequent", "inactive", "highcredit", "nearlimit"];
const SORTS: [string, string, (a: InstitutionRow, b: InstitutionRow) => number][] = [
  ["sales", "Highest sales", (a, b) => b.sales - a.sales],
  ["lowsales", "Lowest sales", (a, b) => a.sales - b.sales],
  ["outstanding", "Highest outstanding", (a, b) => b.account.balance - a.account.balance],
  ["limit", "Highest credit limit", (a, b) => b.account.creditLimit - a.account.creditLimit],
  ["transactions", "Most transactions", (a, b) => b.transactions - a.transactions],
  ["recent", "Most recent transaction", (a, b) => (b.lastOrder?.getTime() ?? 0) - (a.lastOrder?.getTime() ?? 0)],
  ["oldest", "Oldest outstanding", (a, b) => b.account.daysOutstanding - a.account.daysOutstanding],
  ["discount", "Highest discount", (a, b) => b.discount - a.discount],
];
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

/** School-wise / vendor-wise performance with segmentation (TM spec §7, §11, §12). */
export default async function InstitutionPage({ kind, sp }: { kind: Kind; sp: SearchParams }) {
  const f = parseFilters({ ...sp, buyer: kind });
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const seg = SEGMENTS.find((s) => s === one("seg")) ?? null;
  const sort = SORTS.find(([k]) => k === one("sort")) ?? SORTS[0];
  const q = one("q").toLowerCase();

  const [all, cats] = await Promise.all([institutionPerformance(kind, f, f.period.from, f.period.to), categoryOptions()]);
  const rows = all
    .filter((r) => !seg || r.segments.includes(seg))
    .filter((r) => !q || [r.account.name, r.account.code, r.account.city, r.account.state].some((x) => x?.toLowerCase().includes(q)))
    .sort(sort[2]);
  const noun = kind === "school" ? "schools" : "vendors";

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">{kind === "school" ? "School" : "Vendor"} performance</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · {all.filter((r) => r.transactions > 0).length} of {all.length} {noun} bought in the period</p>
        </div>
        <ExportLinks id={`${kind}-sales`} sp={sp} />
      </div>
      <FilterBar categories={cats} showBuyer={false} showChannel={false}>
        <div className="flex flex-wrap gap-2 mb-4" data-testid="segments">
          <Link href={withFilters(`/dashboard/${noun}`, sp, { seg: null })}
            className={`h-8 px-3 inline-flex items-center rounded-full text-xs ${!seg ? "bg-primary/20 text-primary" : "bg-white/5 text-on-dark-soft hover:text-on-dark"}`}>
            All · {all.length}
          </Link>
          {SEGMENTS.map((s) => (
            <Link key={s} href={withFilters(`/dashboard/${noun}`, sp, { seg: s })} title={SEGMENT_HELP[s]}
              className={`h-8 px-3 inline-flex items-center rounded-full text-xs ${seg === s ? "bg-primary/20 text-primary" : "bg-white/5 text-on-dark-soft hover:text-on-dark"}`}>
              {SEGMENT_LABEL[s]} · {all.filter((r) => r.segments.includes(s)).length}
            </Link>
          ))}
        </div>
        {seg && <p className="text-xs text-on-dark-soft mb-3">{SEGMENT_LABEL[seg]}: {SEGMENT_HELP[seg]}.</p>}
        <div className="mb-4 flex gap-2">
          <ParamSelect name="sort" label="Sort" options={SORTS.map(([k, l]) => [k, l])} />
        </div>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
          <table className="w-full text-sm" data-testid="institution-table">
            <thead>
              <tr className="border-b border-white/8">
                {[kind === "school" ? "School" : "Vendor", "Net sales", "Orders", "Avg order", "Highest", "Discount", "Paid", "Outstanding", "Limit", "Status", "Last order", "Segments"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-on-dark-soft">No {noun} match.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.account.id} className="border-b border-white/5">
                  <td className="px-3 py-2.5 min-w-48">
                    <Link href={`/dashboard/accounts/${kind}/${r.account.id}`} className="text-on-dark hover:underline">{r.account.name}</Link>
                    <span className="block text-[11px] text-on-dark-soft font-mono">{r.account.code ?? "no code"}{r.account.city ? ` · ${r.account.city}` : ""}</span>
                  </td>
                  <td className="px-3 py-2.5 text-on-dark font-medium">{inr(r.sales)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{r.transactions}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(r.avg)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(r.highest)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(r.discount)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(r.paidInPeriod)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark">{r.account.balance < 0 ? `${inr(-r.account.balance)} adv` : inr(r.account.balance)}</td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft">{r.account.creditLimit ? inr(r.account.creditLimit) : "—"}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={r.account.status} /></td>
                  <td className="px-3 py-2.5 text-xs text-on-dark-soft whitespace-nowrap">{day(r.lastOrder)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-on-dark-soft">{r.segments.map((s) => SEGMENT_LABEL[s]).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FilterBar>
    </div>
  );
}
