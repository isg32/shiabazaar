import type { Metadata } from "next";
import Link from "next/link";
import StatTile from "@/components/dashboard/StatTile";
import Meter from "@/components/dashboard/Meter";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ParamSearch, ParamSelect } from "@/components/dashboard/ParamControls";
import { loadAccounts, STATUS_LABEL, STATUS_TONE, type Account, type CreditStatus, type Kind } from "@/lib/bi/credit";
import { inr } from "@/lib/bi/format";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Credit monitoring" };

const SORTS: [string, string, (a: Account, b: Account) => number][] = [
  ["outstanding", "Highest outstanding", (a, b) => b.balance - a.balance],
  ["utilisation", "Highest utilisation %", (a, b) => (b.utilisation ?? -1) - (a.utilisation ?? -1)],
  ["limit", "Highest credit limit", (a, b) => b.creditLimit - a.creditLimit],
  ["overdue", "Most overdue", (a, b) => b.overdue - a.overdue],
  ["age", "Longest outstanding", (a, b) => b.daysOutstanding - a.daysOutstanding],
  ["sales", "Highest sales", (a, b) => b.totalSales - a.totalSales],
  ["lowsales", "Lowest sales", (a, b) => a.totalSales - b.totalSales],
  ["transactions", "Most transactions", (a, b) => b.transactions - a.transactions],
  ["recent", "Most recent sale", (a, b) => (b.lastSale?.getTime() ?? 0) - (a.lastSale?.getTime() ?? 0)],
  ["name", "Name", (a, b) => a.name.localeCompare(b.name)],
];

const day = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

export default async function CreditMonitoring({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const kind = (["school", "vendor"].includes(one("kind")) ? one("kind") : undefined) as Kind | undefined;
  const status = one("status") as CreditStatus | "attention" | "";
  const q = one("q").toLowerCase();
  const sort = SORTS.find(([k]) => k === one("sort")) ?? SORTS[0];
  const activeOnly = one("active") !== "all";

  const { accounts: all, settings } = await loadAccounts(kind);
  const base = all.filter((a) => !activeOnly || a.active);
  const rows = base
    .filter((a) => !status || (status === "attention" ? ["exceeded", "overdue", "reached", "near"].includes(a.status) : a.status === status))
    .filter((a) => !q || [a.name, a.code, a.city, a.state].some((x) => x?.toLowerCase().includes(q)))
    .sort(sort[2]);

  const owed = base.reduce((s, a) => s + Math.max(a.balance, 0), 0);
  const overdue = base.reduce((s, a) => s + a.overdue, 0);
  const advance = base.reduce((s, a) => s + Math.max(-a.balance, 0), 0);
  const count = (st: CreditStatus[]) => base.filter((a) => st.includes(a.status)).length;

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Credit monitoring</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">
        Schools &amp; vendors · watch at {settings.creditWatchPct}%, near limit at {settings.creditNearPct}% · default terms {settings.paymentTermsDays} days
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatTile label="Outstanding" value={inr(owed)} sub={`${base.filter((a) => a.balance > 0).length} with a balance`} href="/dashboard/ageing" emphasis />
        <StatTile label="Overdue" value={inr(overdue)} sub={`${count(["overdue"])} ${count(["overdue"]) === 1 ? "account" : "accounts"} past terms`} href="/dashboard/credit?status=overdue" />
        <StatTile label="Over limit" value={String(count(["exceeded"]))} sub="limit exceeded" href="/dashboard/credit?status=exceeded" />
        <StatTile label="Near / at limit" value={String(count(["near", "reached"]))} sub={`≥ ${settings.creditNearPct}% used`} href="/dashboard/credit?status=attention" />
        <StatTile label="Advance credit held" value={inr(advance)} sub="paid ahead by accounts" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="credit-filters">
        <ParamSelect name="kind" label="Account type" options={[["", "Schools & vendors"], ["school", "Schools"], ["vendor", "Vendors"]]} />
        <ParamSelect name="status" label="Status" options={[["", "Any status"], ["attention", "Needs attention"],
          ...(Object.keys(STATUS_LABEL) as CreditStatus[]).map((s) => [s, STATUS_LABEL[s]] as [string, string])]} />
        <ParamSelect name="sort" label="Sort" options={SORTS.map(([k, l]) => [k, l])} />
        <ParamSelect name="active" label="Active" options={[["", "Active only"], ["all", "Include inactive"]]} />
        <ParamSearch name="q" placeholder="Code, name, city or state…" />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
        <table className="w-full text-sm" data-testid="credit-table">
          <thead>
            <tr className="border-b border-white/8">
              {["Account", "Location", "Limit", "Outstanding", "Available", "Utilisation", "Status", "Overdue", "Days o/s", "Last payment", "Last sale"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-on-dark-soft">No accounts match.</td></tr>
            ) : rows.map((a) => (
              <tr key={`${a.kind}-${a.id}`} className="border-b border-white/5 hover:bg-white/3">
                <td className="px-3 py-2.5 min-w-48">
                  <Link href={`/dashboard/accounts/${a.kind}/${a.id}`} className="text-on-dark hover:underline">{a.name}</Link>
                  <span className="block text-[11px] text-on-dark-soft font-mono">{a.code ?? "no code"} · {a.kind}{a.active ? "" : " · inactive"}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{[a.city, a.state].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{a.creditLimit ? inr(a.creditLimit) : "—"}</td>
                <td className="px-3 py-2.5 text-on-dark font-medium">{a.balance < 0 ? `${inr(-a.balance)} adv` : inr(a.balance)}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{a.available == null ? "—" : a.available < 0 ? `−${inr(-a.available)}` : inr(a.available)}</td>
                <td className="px-3 py-2.5"><Meter pct={a.utilisation} status={STATUS_TONE[a.status]} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{a.overdue ? inr(a.overdue) : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft">{a.open.length ? a.daysOutstanding : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft whitespace-nowrap">{day(a.lastPayment)}</td>
                <td className="px-3 py-2.5 text-xs text-on-dark-soft whitespace-nowrap">{day(a.lastSale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[11px] text-on-dark-soft/70">
          Days outstanding = age of the oldest unpaid issue; payments and returns settle the oldest issues first. Overdue = unpaid past the account&apos;s payment terms.
        </p>
      </div>
    </div>
  );
}
