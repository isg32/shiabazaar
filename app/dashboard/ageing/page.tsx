import type { Metadata } from "next";
import Link from "next/link";
import StatTile from "@/components/dashboard/StatTile";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ParamSelect } from "@/components/dashboard/ParamControls";
import { BUCKETS, loadAccounts, type Kind } from "@/lib/bi/credit";
import { inr } from "@/lib/bi/format";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Credit ageing" };

export default async function Ageing({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const k = Array.isArray(sp.kind) ? sp.kind[0] : sp.kind;
  const kind = (k === "school" || k === "vendor" ? k : undefined) as Kind | undefined;
  const { accounts } = await loadAccounts(kind);
  const rows = accounts.filter((a) => a.open.length > 0).sort((a, b) => b.daysOutstanding - a.daysOutstanding || b.balance - a.balance);
  const totals = Object.fromEntries(BUCKETS.map(([key]) => [key, rows.reduce((s, a) => s + a.buckets[key], 0)]));
  const total = rows.reduce((s, a) => s + a.open.reduce((x, i) => x + i.open, 0), 0);
  const overdue = rows.reduce((s, a) => s + a.overdue, 0);

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Credit ageing</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">How long money has been outstanding · oldest issues are settled first</p>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6" data-testid="ageing-tiles">
        <StatTile label="Outstanding" value={inr(total)} emphasis />
        <StatTile label="Overdue" value={inr(overdue)} sub="past payment terms" />
        {BUCKETS.map(([key, label]) => <StatTile key={key} label={label} value={inr(totals[key])} />)}
      </div>

      <div className="mb-4">
        <ParamSelect name="kind" label="Account type" options={[["", "Schools & vendors"], ["school", "Schools"], ["vendor", "Vendors"]]} />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
        <table className="w-full text-sm" data-testid="ageing-table">
          <thead>
            <tr className="border-b border-white/8">
              {["Account", "Type", "Outstanding", ...BUCKETS.map(([, l]) => l), "Overdue", "Terms", "Status"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.length === 0 ? (
              <tr><td colSpan={BUCKETS.length + 6} className="px-4 py-10 text-center text-on-dark-soft">Nothing outstanding.</td></tr>
            ) : rows.map((a) => (
              <tr key={`${a.kind}-${a.id}`} className="border-b border-white/5">
                <td className="px-3 py-2.5 min-w-48">
                  <Link href={`/dashboard/accounts/${a.kind}/${a.id}`} className="text-on-dark hover:underline">{a.name}</Link>
                  <span className="block text-[11px] text-on-dark-soft font-mono">{a.code ?? "no code"}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft capitalize">{a.kind}</td>
                <td className="px-3 py-2.5 text-on-dark font-medium">{inr(a.open.reduce((s, i) => s + i.open, 0))}</td>
                {BUCKETS.map(([key]) => (
                  <td key={key} className={`px-3 py-2.5 text-xs ${a.buckets[key] ? "text-on-dark" : "text-on-dark-soft/50"}`}>{a.buckets[key] ? inr(a.buckets[key]) : "—"}</td>
                ))}
                <td className="px-3 py-2.5 text-xs text-on-dark">{a.overdue ? inr(a.overdue) : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{a.termsDays}d{a.termsIsDefault ? "" : " *"}</td>
                <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-white/3 font-medium">
                <td className="px-3 py-2.5 text-on-dark" colSpan={2}>Total</td>
                <td className="px-3 py-2.5 text-on-dark">{inr(total)}</td>
                {BUCKETS.map(([key]) => <td key={key} className="px-3 py-2.5 text-xs text-on-dark">{inr(totals[key])}</td>)}
                <td className="px-3 py-2.5 text-xs text-on-dark">{inr(overdue)}</td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[11px] text-on-dark-soft/70">* account-specific payment terms (others use the default).</p>
      </div>
    </div>
  );
}
