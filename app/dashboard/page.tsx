import type { Metadata } from "next";
import { TrendingUp, CalendarDays, CalendarRange, Landmark, Wallet, HandCoins } from "lucide-react";
import {
  collections, financialYearStart, inr, istDayStart, outstanding, salesBySegment, salesTotals,
} from "@/lib/bi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Overview" };

const CHANNEL = { online: "Website", offline: "Physical store" } as const;
const BUYER = { individual: "Individual", school: "School", vendor: "Vendor" } as const;

export default async function DashboardOverview() {
  const today = istDayStart(0);
  const last7 = istDayStart(6);
  const last30 = istDayStart(29);
  const fy = financialYearStart();

  const [t, w, m, y, collected30, owed, segments] = await Promise.all([
    salesTotals({ from: today }),
    salesTotals({ from: last7 }),
    salesTotals({ from: last30 }),
    salesTotals({ from: fy }),
    collections({ from: last30 }),
    outstanding(),
    salesBySegment({ from: last30 }),
  ]);

  const fyLabel = `FY ${fy.getUTCFullYear() % 100}–${(fy.getUTCFullYear() + 1) % 100}`;
  const cards = [
    { label: "Today's sales", value: inr(t.net), sub: `${t.count} transactions`, Icon: TrendingUp },
    { label: "Last 7 days", value: inr(w.net), sub: `${w.count} transactions · avg ${inr(w.avg)}`, Icon: CalendarDays },
    { label: "Last 30 days", value: inr(m.net), sub: `${m.count} transactions · avg ${inr(m.avg)}`, Icon: CalendarRange },
    { label: `Sales ${fyLabel}`, value: inr(y.net), sub: `${y.count} transactions`, Icon: Landmark },
    { label: "Collected (30 days)", value: inr(collected30), sub: "cash, UPI, card, online & settlements", Icon: HandCoins },
    { label: "Outstanding receivables", value: inr(owed.school + owed.vendor), sub: `schools ${inr(owed.school)} · vendors ${inr(owed.vendor)}`, Icon: Wallet },
  ];

  const segTotal = segments.reduce((s, g) => s + g.total, 0);
  const ordered = [...segments].sort((a, b) => b.total - a.total);

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-on-dark">Overview</h1>
        <p className="text-sm text-on-dark-soft mt-0.5">
          All channels · net of returns · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-testid="kpis">
        {cards.map(({ label, value, sub, Icon }) => (
          <div key={label} className="bg-surface-dark-elevated rounded-xl p-5 border border-white/8">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
              <Icon size={15} className="text-on-dark-soft" />
            </div>
            <p className="text-xl font-semibold text-on-dark">{value}</p>
            <p className="text-xs text-on-dark-soft mt-0.5">{label}</p>
            <p className="text-[11px] text-on-dark-soft/70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="text-sm font-medium text-on-dark">Last 30 days by channel and buyer</h2>
        </div>
        {ordered.length === 0 ? (
          <p className="text-sm text-on-dark-soft text-center py-8">No sales in the last 30 days.</p>
        ) : (
          <table className="w-full text-sm" data-testid="segments">
            <thead>
              <tr className="border-b border-white/8">
                {["Channel", "Buyer", "Transactions", "Sales", "Avg value", "Share"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.map((g, i) => {
                const share = segTotal ? Math.round((g.total / segTotal) * 100) : 0;
                return (
                  <tr key={`${g.channel}-${g.buyerType}`} className={i < ordered.length - 1 ? "border-b border-white/8" : ""}>
                    <td className="px-6 py-3 text-on-dark">{CHANNEL[g.channel]}</td>
                    <td className="px-6 py-3 text-on-dark-soft">{BUYER[g.buyerType]}</td>
                    <td className="px-6 py-3 text-on-dark-soft">{g.count}</td>
                    <td className="px-6 py-3 text-on-dark font-medium">{inr(g.total)}</td>
                    <td className="px-6 py-3 text-on-dark-soft">{inr(g.count ? Math.round(g.total / g.count) : 0)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-on-dark-soft">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
