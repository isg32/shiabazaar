import type { Metadata } from "next";
import StatTile from "@/components/dashboard/StatTile";
import ShareBars from "@/components/dashboard/ShareBars";
import { loadFacts, summarize } from "@/lib/bi/facts";
import { resolvePeriod } from "@/lib/bi/period";
import { BUYER_LABEL, CHANNEL_LABEL, type Buyer, type Channel } from "@/lib/bi/filters";
import { loadAccounts } from "@/lib/bi/credit";
import { loadAlerts } from "@/lib/bi/alerts";
import { inr } from "@/lib/bi/format";
import { VIZ } from "@/lib/bi/colors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Overview" };

const ALL = { channel: null, buyer: null, category: null } as const;

export default async function DashboardOverview() {
  const today = resolvePeriod("today"), d7 = resolvePeriod("7d"), d30 = resolvePeriod("30d"), fy = resolvePeriod("fy");
  const [fyFacts, { accounts }, alerts] = await Promise.all([
    loadFacts(ALL, fy.from < d30.from ? fy.from : d30.from, today.to),
    loadAccounts(),
    loadAlerts(),
  ]);
  const win = (from: Date, to: Date) => {
    const inR = (d: Date) => d >= from && d < to;
    return summarize(fyFacts.lines.filter((l) => inR(l.at)), fyFacts.returns.filter((r) => inR(r.at)), fyFacts.orders,
      fyFacts.settlements.filter((s) => inR(s.at)), false);
  };
  const t = win(today.from, today.to), w = win(d7.from, d7.to), m = win(d30.from, d30.to), y = win(fy.from, fy.to);
  const m30 = { ...fyFacts, lines: fyFacts.lines.filter((l) => l.at >= d30.from), returns: fyFacts.returns.filter((r) => r.at >= d30.from) };

  const owed = accounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);
  const overdue = accounts.reduce((s, a) => s + a.overdue, 0);
  const atRisk = accounts.filter((a) => ["exceeded", "near", "reached", "overdue"].includes(a.status)).length;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const fyLabel = `FY ${fy.from.getUTCFullYear() % 100}–${(fy.from.getUTCFullYear() + 1) % 100}`;

  const seg = <K extends string>(keys: K[], pick: (l: { channel: Channel; buyer: Buyer }) => K) =>
    keys.map((k) => ({ k, s: summarize(m30.lines.filter((l) => pick(l) === k), m30.returns.filter((r) => pick(r) === k), m30.orders, [], false) }));
  const byChannel = seg<Channel>(["online", "offline"], (l) => l.channel);
  const byBuyer = seg<Buyer>(["individual", "school", "vendor"], (l) => l.buyer);

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-on-dark">Overview</h1>
        <p className="text-sm text-on-dark-soft mt-0.5">
          All channels · net of discounts &amp; returns · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3" data-testid="kpis">
        <StatTile label="Today's sales" value={inr(t.net)} sub={`${t.transactions} transactions`} href="/dashboard/transactions?range=today" />
        <StatTile label="Last 7 days" value={inr(w.net)} sub={`${w.transactions} transactions · avg ${inr(w.avg)}`} href="/dashboard/sales?range=7d" />
        <StatTile label="Last 30 days" value={inr(m.net)} sub={`${m.transactions} transactions · avg ${inr(m.avg)}`} href="/dashboard/sales?range=30d" emphasis />
        <StatTile label={`Sales ${fyLabel}`} value={inr(y.net)} sub={`${y.transactions} transactions`} href="/dashboard/sales?range=fy" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Collected (30 days)" value={inr(m.collected)} sub="at sale + settlements" href="/dashboard/sales?range=30d" />
        <StatTile label="Outstanding receivables" value={inr(owed)} sub={`overdue ${inr(overdue)}`} href="/dashboard/ageing" />
        <StatTile label="Accounts needing attention" value={String(atRisk)} sub="near/over limit or overdue" href="/dashboard/credit?status=attention" />
        <StatTile label="Open alerts" value={String(alerts.length)} sub={`${critical} critical`} href="/dashboard/alerts" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ShareBars title="Last 30 days · online vs store" rows={byChannel.map(({ k, s }) => ({
          key: k, label: CHANNEL_LABEL[k], value: s.net, valueText: inr(s.net), color: VIZ.channel[k],
          sub: `${s.transactions} transactions`, href: `/dashboard/channels?range=30d`,
        }))} />
        <ShareBars title="Last 30 days · by buyer type" rows={byBuyer.map(({ k, s }) => ({
          key: k, label: BUYER_LABEL[k], value: s.net, valueText: inr(s.net), color: VIZ.buyer[k],
          sub: `${s.transactions} transactions`, href: `/dashboard/buyers?range=30d`,
        }))} />
      </div>
    </div>
  );
}
