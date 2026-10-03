import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import StatTile from "@/components/dashboard/StatTile";
import Meter from "@/components/dashboard/Meter";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { BUCKETS, loadAccounts, STATUS_TONE, type Kind } from "@/lib/bi/credit";
import { inr } from "@/lib/bi/format";
import { parseDay } from "@/lib/bi/period";
import { buildStatement } from "@/lib/statement";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Account statement" };

const day = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const bal = (p: number) => (p < 0 ? `${inr(-p)} adv` : inr(p));
const money = (p: number) => (p ? inr(p) : "");

export default async function AccountStatement({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<SearchParams> }) {
  const { kind, id } = await params;
  if (kind !== "school" && kind !== "vendor") notFound();
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));

  const orderInclude = {
    items: { select: { title: true } },
    payments: { select: { method: true, amount: true } },
    returns: { select: { id: true, amount: true, note: true, createdAt: true } },
  } as const;
  const [{ accounts }, detail] = await Promise.all([
    loadAccounts(kind as Kind),
    kind === "school"
      ? db.school.findUnique({ where: { id }, include: { orders: { include: orderInclude }, payments: true } })
      : db.vendor.findUnique({ where: { id }, include: { orders: { include: orderInclude }, payments: true } }),
  ]);
  const a = accounts.find((x) => x.id === id);
  if (!a || !detail) notFound();

  const from = parseDay(one("from"));
  const to = parseDay(one("to"));
  const st = buildStatement(detail.orders, detail.payments, {
    noun: kind === "school" ? "Books issued" : "Goods issued",
    fromMs: from ? from.getTime() : -Infinity,
    toMs: to ? to.getTime() + 86_400_000 - 1 : Infinity,
  });

  return (
    <div className="px-8 py-8 text-on-dark">
      <Link href="/dashboard/credit" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4">
        <ChevronLeft size={13} /> Credit monitoring
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">{a.name}</h1>
          <p className="text-sm text-on-dark-soft mt-1">
            {[a.code, kind === "school" ? "School" : "Vendor", [a.city, a.state].filter(Boolean).join(", "), `${a.termsDays}-day terms${a.termsIsDefault ? " (default)" : ""}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-4"><StatusBadge status={a.status} /><Meter pct={a.utilisation} status={STATUS_TONE[a.status]} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6" data-testid="account-tiles">
        <StatTile label={a.balance < 0 ? "Advance credit" : "Outstanding"} value={inr(Math.abs(a.balance))} emphasis />
        <StatTile label="Credit limit" value={a.creditLimit ? inr(a.creditLimit) : "None"} />
        <StatTile label="Available credit" value={a.available == null ? "—" : a.available < 0 ? `−${inr(-a.available)}` : inr(a.available)} />
        <StatTile label="Overdue" value={inr(a.overdue)} sub={a.open.length ? `oldest ${a.daysOutstanding} days` : "nothing open"} />
        <StatTile label="Total sales" value={inr(a.totalSales)} sub={`${a.transactions} transactions`} />
        <StatTile label="Total paid" value={inr(a.totalPaid)} sub={`last ${a.lastPayment ? day(a.lastPayment) : "—"}`} />
        <StatTile label="Last sale" value={a.lastSale ? day(a.lastSale) : "—"} />
      </div>

      {a.open.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5">
            <h2 className="text-sm font-medium text-on-dark mb-3">Ageing</h2>
            <div className="grid grid-cols-3 gap-3 text-sm tabular-nums">
              {BUCKETS.map(([key, label]) => (
                <div key={key}><p className="text-[11px] text-on-dark-soft">{label}</p><p className="text-on-dark">{inr(a.buckets[key])}</p></div>
              ))}
            </div>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <h2 className="px-5 py-4 border-b border-white/8 text-sm font-medium text-on-dark">Open issues (oldest first)</h2>
            <table className="w-full text-sm" data-testid="open-invoices">
              <tbody className="tabular-nums">
                {a.open.map((i) => (
                  <tr key={i.orderId} className="border-b border-white/5">
                    <td className="px-4 py-2 text-xs"><Link href={`/dashboard/transactions/${i.orderId}`} className="font-mono text-primary">#{i.orderId.slice(0, 8).toUpperCase()}</Link></td>
                    <td className="px-4 py-2 text-xs text-on-dark-soft">{day(i.at)}</td>
                    <td className="px-4 py-2 text-xs text-on-dark-soft">{i.ageDays} days</td>
                    <td className="px-4 py-2 text-xs text-on-dark">{inr(i.open)} <span className="text-on-dark-soft">of {inr(i.charge)}</span></td>
                    <td className="px-4 py-2 text-xs">{i.overdue ? <span className="text-error">Overdue</span> : <span className="text-on-dark-soft">Within terms</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
        <form className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-on-dark mr-auto">Account statement</h2>
          <label className="text-xs text-on-dark-soft flex items-center gap-1.5">From
            <input type="date" name="from" defaultValue={one("from") ?? ""} className="h-8 px-2 text-xs bg-surface-dark border border-white/20 rounded-md text-on-dark" />
          </label>
          <label className="text-xs text-on-dark-soft flex items-center gap-1.5">To
            <input type="date" name="to" defaultValue={one("to") ?? ""} className="h-8 px-2 text-xs bg-surface-dark border border-white/20 rounded-md text-on-dark" />
          </label>
          <button className="h-8 px-3 text-xs rounded-md bg-white/10 text-on-dark hover:bg-white/15">Apply</button>
        </form>
        <table className="w-full text-sm" data-testid="statement">
          <thead>
            <tr className="border-b border-white/8">
              {["Date", "Transaction", "Sale", "Payment", "Credit added", "Credit adjusted", "Balance"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <tr className="border-b border-white/8 bg-white/2">
              <td className="px-4 py-2.5 text-xs text-on-dark-soft">{from ? day(from) : ""}</td>
              <td className="px-4 py-2.5 text-xs text-on-dark-soft" colSpan={5}>Opening balance</td>
              <td className="px-4 py-2.5 text-xs font-medium text-on-dark" data-testid="opening-balance">{bal(st.opening)}</td>
            </tr>
            {st.rows.map((r) => (
              <tr key={r.key} className={`border-b border-white/5 ${r.muted ? "opacity-40" : ""}`}>
                <td className="px-4 py-2.5 text-xs text-on-dark-soft whitespace-nowrap">{day(r.date)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark">
                  {r.order ? <Link href={`/dashboard/transactions/${r.order.id}`} className="hover:underline">{r.label}</Link> : r.label}
                  {r.detail && <span className="block text-[11px] text-on-dark-soft">{r.detail}</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-on-dark">{money(r.sale)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark">{money(r.paid)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark">{money(r.creditAdded)}</td>
                <td className="px-4 py-2.5 text-xs text-on-dark">{money(r.creditAdjusted)}</td>
                <td className="px-4 py-2.5 text-xs font-medium text-on-dark whitespace-nowrap">{bal(r.running)}</td>
              </tr>
            ))}
            <tr className="bg-white/2">
              <td className="px-4 py-2.5 text-xs text-on-dark-soft">{to ? day(to) : ""}</td>
              <td className="px-4 py-2.5 text-xs text-on-dark-soft" colSpan={5}>Closing balance</td>
              <td className="px-4 py-2.5 text-xs font-semibold text-on-dark" data-testid="closing-balance">{bal(st.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
